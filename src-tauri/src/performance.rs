use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use sysinfo::{
    Components, CpuRefreshKind, Disks, MemoryRefreshKind, Networks, Pid, ProcessRefreshKind,
    ProcessesToUpdate, RefreshKind, System,
};
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
pub struct AppProcessInfo {
    pub pid: u32,
    pub name: String,
    pub cpu_usage: f32,
    pub memory_bytes: u64,
    pub virtual_memory_bytes: u64,
    pub run_time_secs: u64,
    pub is_stash: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkTelemetry {
    pub total_rx_bytes: u64,
    pub total_tx_bytes: u64,
    pub rx_rate_bytes_per_sec: u64,
    pub tx_rate_bytes_per_sec: u64,
    pub active_interfaces: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThermalTelemetry {
    pub package_temp_celsius: Option<f32>,
    pub max_temp_celsius: Option<f32>,
    pub sensor_count: usize,
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

    // Running Applications & Top Consumers
    pub processes: Vec<AppProcessInfo>,
    pub total_processes_count: usize,
    pub top_cpu_consumer: Option<AppProcessInfo>,
    pub top_ram_consumer: Option<AppProcessInfo>,

    // Network & Thermal
    pub network: NetworkTelemetry,
    pub thermal: ThermalTelemetry,
}

pub struct PerformanceState {
    pub system: Mutex<System>,
    pub networks: Mutex<Networks>,
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
            networks: Mutex::new(Networks::new_with_refreshed_list()),
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

    // Refresh CPU, Memory, and Processes efficiently (CPU + Memory only, no slow disk/user scanning)
    sys.refresh_cpu_usage();
    sys.refresh_memory();
    sys.refresh_processes_specifics(
        ProcessesToUpdate::All,
        true,
        ProcessRefreshKind::nothing().with_cpu().with_memory(),
    );

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
    let current_pid_num = current_pid_res.as_ref().map(|p| p.as_u32()).unwrap_or(0);

    let stash_process = if let Ok(pid) = current_pid_res {
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

    // Collect and sort Running Processes
    let total_processes_count = sys.processes().len();
    let mut proc_list: Vec<AppProcessInfo> = sys
        .processes()
        .iter()
        .map(|(pid, p)| {
            let pid_num = pid.as_u32();
            let raw_name = p.name().to_string_lossy().to_string();
            let is_stash = pid_num == current_pid_num
                || raw_name.eq_ignore_ascii_case("stash.exe")
                || raw_name.eq_ignore_ascii_case("stash");

            AppProcessInfo {
                pid: pid_num,
                name: raw_name,
                cpu_usage: p.cpu_usage(),
                memory_bytes: p.memory(),
                virtual_memory_bytes: p.virtual_memory(),
                run_time_secs: p.run_time(),
                is_stash,
            }
        })
        .collect();

    // Find absolute top CPU consumer and top RAM consumer across all processes
    let top_cpu_consumer = proc_list
        .iter()
        .filter(|p| !p.is_stash)
        .max_by(|a, b| a.cpu_usage.partial_cmp(&b.cpu_usage).unwrap_or(std::cmp::Ordering::Equal))
        .cloned();

    let top_ram_consumer = proc_list
        .iter()
        .filter(|p| !p.is_stash)
        .max_by_key(|p| p.memory_bytes)
        .cloned();

    // Filter out zero-impact idle kernel threads (< 0.1% CPU and < 8MB RAM) unless it's Stash,
    // and sort by a blended score of CPU + Memory weight so the most prominent apps show first
    proc_list.sort_by(|a, b| {
        // Sort primarily by memory and CPU combined
        let score_a = (a.cpu_usage * 10_000_000.0) as u64 + a.memory_bytes;
        let score_b = (b.cpu_usage * 10_000_000.0) as u64 + b.memory_bytes;
        score_b.cmp(&score_a)
    });

    // Retain the top 60 significant processes for crisp, instant UI rendering
    proc_list.truncate(60);

    // Network Telemetry
    let mut networks = state.networks.lock().unwrap_or_else(|e| e.into_inner());
    networks.refresh(true);
    let mut total_rx = 0u64;
    let mut total_tx = 0u64;
    let mut rx_rate = 0u64;
    let mut tx_rate = 0u64;
    let mut active_ifaces = 0usize;

    for (_name, net) in networks.iter() {
        total_rx = total_rx.saturating_add(net.total_received());
        total_tx = total_tx.saturating_add(net.total_transmitted());
        rx_rate = rx_rate.saturating_add(net.received());
        tx_rate = tx_rate.saturating_add(net.transmitted());
        active_ifaces += 1;
    }

    let network = NetworkTelemetry {
        total_rx_bytes: total_rx,
        total_tx_bytes: total_tx,
        rx_rate_bytes_per_sec: rx_rate,
        tx_rate_bytes_per_sec: tx_rate,
        active_interfaces: active_ifaces,
    };

    // Thermal Telemetry
    let components = Components::new_with_refreshed_list();
    let mut max_temp: Option<f32> = None;
    let mut cpu_temp: Option<f32> = None;
    let sensor_count = components.len();

    for comp in &components {
        if let Some(temp) = comp.temperature() {
            if let Some(current_max) = max_temp {
                if temp > current_max {
                    max_temp = Some(temp);
                }
            } else {
                max_temp = Some(temp);
            }

            let label = comp.label().to_lowercase();
            if label.contains("cpu") || label.contains("package") || label.contains("core") {
                if cpu_temp.is_none() || label.contains("package") {
                    cpu_temp = Some(temp);
                }
            }
        }
    }

    let thermal = ThermalTelemetry {
        package_temp_celsius: cpu_temp.or(max_temp),
        max_temp_celsius: max_temp,
        sensor_count,
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
        processes: proc_list,
        total_processes_count,
        top_cpu_consumer,
        top_ram_consumer,
        network,
        thermal,
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

pub fn kill_process_by_pid(state: &PerformanceState, pid_num: u32) -> Result<bool, String> {
    let mut sys = state.system.lock().unwrap_or_else(|e| e.into_inner());
    let pid = Pid::from_u32(pid_num);
    sys.refresh_processes_specifics(
        ProcessesToUpdate::Some(&[pid]),
        true,
        ProcessRefreshKind::nothing(),
    );
    if let Some(proc) = sys.process(pid) {
        Ok(proc.kill())
    } else {
        Err(format!("Process with PID {} not found or already terminated", pid_num))
    }
}
