use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use sysinfo::{CpuRefreshKind, Disks, MemoryRefreshKind, ProcessRefreshKind, RefreshKind, System};
use tauri::{AppHandle, Manager};
use crate::db::DbState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CpuCoreInfo {
    pub id: usize,
    pub name: String,
    pub usage: f32,
    pub frequency: u64, // MHz
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskInfo {
    pub name: String,
    pub mount_point: String,
    pub total_space: u64,     // bytes
    pub available_space: u64, // bytes
    pub is_removable: bool,
    pub file_system: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessStats {
    pub pid: u32,
    pub memory_bytes: u64,
    pub virtual_memory_bytes: u64,
    pub cpu_usage: f32,
    pub run_time_secs: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemPerformanceSnapshot {
    // OS & Hardware
    pub os_name: String,
    pub os_version: String,
    pub kernel_version: String,
    pub hostname: String,
    pub uptime_secs: u64,
    pub cpu_brand: String,
    pub cpu_vendor: String,
    pub physical_core_count: usize,
    pub logical_core_count: usize,
    pub global_cpu_usage: f32,
    pub cpu_cores: Vec<CpuCoreInfo>,

    // Memory (bytes)
    pub total_memory: u64,
    pub used_memory: u64,
    pub free_memory: u64,
    pub available_memory: u64,
    pub total_swap: u64,
    pub used_swap: u64,
    pub free_swap: u64,

    // Disks
    pub disks: Vec<DiskInfo>,

    // Stash App Specifics
    pub stash_process: Option<ProcessStats>,
    pub db_size_bytes: u64,
    pub active_windows_count: usize,
}

pub struct PerformanceState {
    pub system: Mutex<System>,
}

impl PerformanceState {
    pub fn new() -> Self {
        let mut sys = System::new_with_specifics(
            RefreshKind::nothing()
                .with_cpu(CpuRefreshKind::everything())
                .with_memory(MemoryRefreshKind::everything()),
        );
        sys.refresh_cpu_usage();
        sys.refresh_memory();
        Self {
            system: Mutex::new(sys),
        }
    }
}

impl Default for PerformanceState {
    fn default() -> Self {
        Self::new()
    }
}

pub fn collect_snapshot(
    state: &PerformanceState,
    app_handle: &AppHandle,
) -> SystemPerformanceSnapshot {
    let mut sys = state.system.lock().unwrap_or_else(|e| e.into_inner());

    // Refresh CPU and Memory efficiently without full system scan
    sys.refresh_cpu_usage();
    sys.refresh_memory();

    let os_name = System::name().unwrap_or_else(|| "Windows".to_string());
    let os_version = System::os_version().unwrap_or_else(|| "".to_string());
    let kernel_version = System::kernel_version().unwrap_or_else(|| "".to_string());
    let hostname = System::host_name().unwrap_or_else(|| "PC".to_string());
    let uptime_secs = System::uptime();

    let cpus = sys.cpus();
    let cpu_brand = cpus
        .first()
        .map(|c| c.brand().to_string())
        .unwrap_or_else(|| "Unknown CPU".to_string());
    let cpu_vendor = cpus
        .first()
        .map(|c| c.vendor_id().to_string())
        .unwrap_or_else(|| "".to_string());

    let physical_core_count = System::physical_core_count().unwrap_or(cpus.len());
    let logical_core_count = cpus.len();
    let global_cpu_usage = sys.global_cpu_usage();

    let cpu_cores: Vec<CpuCoreInfo> = cpus
        .iter()
        .enumerate()
        .map(|(idx, c)| CpuCoreInfo {
            id: idx,
            name: c.name().to_string(),
            usage: c.cpu_usage(),
            frequency: c.frequency(),
        })
        .collect();

    let total_memory = sys.total_memory();
    let used_memory = sys.used_memory();
    let free_memory = sys.free_memory();
    let available_memory = sys.available_memory();
    let total_swap = sys.total_swap();
    let used_swap = sys.used_swap();
    let free_swap = sys.free_swap();

    // Query Disks
    let disks = Disks::new_with_refreshed_list();
    let disk_list: Vec<DiskInfo> = disks
        .list()
        .iter()
        .map(|d| DiskInfo {
            name: d.name().to_string_lossy().to_string(),
            mount_point: d.mount_point().to_string_lossy().to_string(),
            total_space: d.total_space(),
            available_space: d.available_space(),
            is_removable: d.is_removable(),
            file_system: d.file_system().to_string_lossy().to_string(),
        })
        .collect();

    // Query Stash process stats
    let current_pid_res = sysinfo::get_current_pid();
    let stash_process = if let Ok(pid) = current_pid_res {
        sys.refresh_processes_specifics(
            sysinfo::ProcessesToUpdate::Some(&[pid]),
            true,
            ProcessRefreshKind::everything(),
        );
        sys.process(pid).map(|p| ProcessStats {
            pid: pid.as_u32(),
            memory_bytes: p.memory(),
            virtual_memory_bytes: p.virtual_memory(),
            cpu_usage: p.cpu_usage(),
            run_time_secs: p.run_time(),
        })
    } else {
        None
    };

    // Database file size
    let mut db_size_bytes = 0u64;
    if let Ok(app_dir) = app_handle.path().app_data_dir() {
        let db_file = app_dir.join("stash.db");
        if let Ok(meta) = std::fs::metadata(db_file) {
            db_size_bytes = meta.len();
        }
    }

    // Active Tauri webview windows
    let active_windows_count = app_handle.webview_windows().len();

    SystemPerformanceSnapshot {
        os_name,
        os_version,
        kernel_version,
        hostname,
        uptime_secs,
        cpu_brand,
        cpu_vendor,
        physical_core_count,
        logical_core_count,
        global_cpu_usage,
        cpu_cores,
        total_memory,
        used_memory,
        free_memory,
        available_memory,
        total_swap,
        used_swap,
        free_swap,
        disks: disk_list,
        stash_process,
        db_size_bytes,
        active_windows_count,
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OptimizationResult {
    pub success: bool,
    pub message: String,
    pub db_size_before: u64,
    pub db_size_after: u64,
    pub memory_freed_estimate_bytes: u64,
}

pub fn optimize_stash_database(
    app_handle: &AppHandle,
    db: &DbState,
) -> Result<OptimizationResult, String> {
    let mut db_size_before = 0u64;
    let mut db_path = None;

    if let Ok(app_dir) = app_handle.path().app_data_dir() {
        let path = app_dir.join("stash.db");
        if let Ok(meta) = std::fs::metadata(&path) {
            db_size_before = meta.len();
        }
        db_path = Some(path);
    }

    let conn = db.conn.lock().map_err(|e| format!("DB lock error: {}", e))?;

    // Execute SQLite VACUUM and optimize
    conn.execute_batch(
        "PRAGMA optimize;
         PRAGMA shrink_memory;
         VACUUM;",
    )
    .map_err(|e| format!("SQLite optimization error: {}", e))?;

    drop(conn);

    let mut db_size_after = db_size_before;
    if let Some(path) = db_path {
        if let Ok(meta) = std::fs::metadata(path) {
            db_size_after = meta.len();
        }
    }

    let memory_freed_estimate_bytes = db_size_before.saturating_sub(db_size_after);

    Ok(OptimizationResult {
        success: true,
        message: "Stash database compacted and memory shrink complete.".to_string(),
        db_size_before,
        db_size_after,
        memory_freed_estimate_bytes,
    })
}
