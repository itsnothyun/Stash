use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;
use sysinfo::{
    Components, CpuRefreshKind, Disks, MemoryRefreshKind, Networks, Pid, ProcessRefreshKind,
    ProcessesToUpdate, RefreshKind, System, UpdateKind,
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
    pub is_read_only: bool,
    pub file_system: String,
    pub disk_type: String,
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
    pub icon_data: Option<String>,
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

#[cfg(target_os = "windows")]
mod win32_icon {
    use std::os::windows::ffi::OsStrExt;
    use std::path::Path;

    #[repr(C)]
    struct ShFileInfoW {
        h_icon: isize,
        i_icon: i32,
        dw_attributes: u32,
        sz_display_name: [u16; 260],
        sz_type_name: [u16; 80],
    }

    #[repr(C)]
    struct IconInfo {
        f_icon: i32,
        x_hotspot: u32,
        y_hotspot: u32,
        hbm_mask: isize,
        hbm_color: isize,
    }

    #[repr(C)]
    struct BitmapInfoHeader {
        bi_size: u32,
        bi_width: i32,
        bi_height: i32,
        bi_planes: u16,
        bi_bit_count: u16,
        bi_compression: u32,
        bi_size_image: u32,
        bi_x_pels_per_meter: i32,
        bi_y_pels_per_meter: i32,
        bi_clr_used: u32,
        bi_clr_important: u32,
    }

    #[repr(C)]
    struct Bitmap {
        bm_type: i32,
        bm_width: i32,
        bm_height: i32,
        bm_width_bytes: i32,
        bm_planes: u16,
        bm_bits_pixel: u16,
        bm_bits: *mut u8,
    }

    #[link(name = "shell32")]
    extern "system" {
        fn SHGetFileInfoW(
            psz_path: *const u16,
            dw_file_attributes: u32,
            psfi: *mut ShFileInfoW,
            cb_file_info: u32,
            u_flags: u32,
        ) -> usize;
    }

    #[link(name = "user32")]
    extern "system" {
        fn DestroyIcon(h_icon: isize) -> i32;
        fn GetIconInfo(h_icon: isize, piconinfo: *mut IconInfo) -> i32;
    }

    #[link(name = "gdi32")]
    extern "system" {
        fn CreateCompatibleDC(hdc: isize) -> isize;
        fn DeleteDC(hdc: isize) -> i32;
        fn DeleteObject(ho: isize) -> i32;
        fn GetObjectW(h: isize, c: i32, pv: *mut u8) -> i32;
        fn GetDIBits(
            hdc: isize,
            hbm: isize,
            start: u32,
            c_lines: u32,
            lpv_bits: *mut u8,
            lpbmi: *mut BitmapInfoHeader,
            usage: u32,
        ) -> i32;
    }

    const SHGFI_ICON: u32 = 0x000000100;
    const SHGFI_LARGEICON: u32 = 0x000000000;

    fn to_base64(data: &[u8]) -> String {
        const CHARSET: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        let mut result = String::with_capacity((data.len() + 2) / 3 * 4);
        for chunk in data.chunks(3) {
            let b0 = chunk[0] as usize;
            let b1 = chunk.get(1).copied().unwrap_or(0) as usize;
            let b2 = chunk.get(2).copied().unwrap_or(0) as usize;
            let triple = (b0 << 16) | (b1 << 8) | b2;

            result.push(CHARSET[(triple >> 18) & 0x3F] as char);
            result.push(CHARSET[(triple >> 12) & 0x3F] as char);
            if chunk.len() > 1 {
                result.push(CHARSET[(triple >> 6) & 0x3F] as char);
            } else {
                result.push('=');
            }
            if chunk.len() > 2 {
                result.push(CHARSET[triple & 0x3F] as char);
            } else {
                result.push('=');
            }
        }
        result
    }

    pub fn extract_icon_data_url(path: &Path) -> Option<String> {
        let path_os = path.as_os_str();
        let wide: Vec<u16> = path_os.encode_wide().chain(Some(0)).collect();

        unsafe {
            let mut sfi: ShFileInfoW = std::mem::zeroed();
            let res = SHGetFileInfoW(
                wide.as_ptr(),
                0,
                &mut sfi,
                std::mem::size_of::<ShFileInfoW>() as u32,
                SHGFI_ICON | SHGFI_LARGEICON,
            );

            if res == 0 || sfi.h_icon == 0 {
                return None;
            }

            let mut icon_info: IconInfo = std::mem::zeroed();
            if GetIconInfo(sfi.h_icon, &mut icon_info) == 0 {
                DestroyIcon(sfi.h_icon);
                return None;
            }

            let target_bm = if icon_info.hbm_color != 0 {
                icon_info.hbm_color
            } else {
                icon_info.hbm_mask
            };

            let mut bm: Bitmap = std::mem::zeroed();
            let got_obj = GetObjectW(
                target_bm,
                std::mem::size_of::<Bitmap>() as i32,
                &mut bm as *mut _ as *mut u8,
            );

            let (w, h) = if got_obj > 0 && bm.bm_width > 0 && bm.bm_height > 0 {
                let actual_h = if icon_info.hbm_color == 0 {
                    bm.bm_height / 2
                } else {
                    bm.bm_height
                };
                (bm.bm_width, actual_h)
            } else {
                (32, 32)
            };

            let hdc = CreateCompatibleDC(0);
            if hdc == 0 {
                if icon_info.hbm_color != 0 {
                    DeleteObject(icon_info.hbm_color);
                }
                if icon_info.hbm_mask != 0 {
                    DeleteObject(icon_info.hbm_mask);
                }
                DestroyIcon(sfi.h_icon);
                return None;
            }

            let mut bmi = BitmapInfoHeader {
                bi_size: std::mem::size_of::<BitmapInfoHeader>() as u32,
                bi_width: w,
                bi_height: h,
                bi_planes: 1,
                bi_bit_count: 32,
                bi_compression: 0,
                bi_size_image: (w * h * 4) as u32,
                bi_x_pels_per_meter: 0,
                bi_y_pels_per_meter: 0,
                bi_clr_used: 0,
                bi_clr_important: 0,
            };

            let mut pixels = vec![0u8; (w * h * 4) as usize];
            let dib_res = if icon_info.hbm_color != 0 {
                GetDIBits(
                    hdc,
                    icon_info.hbm_color,
                    0,
                    h as u32,
                    pixels.as_mut_ptr(),
                    &mut bmi,
                    0,
                )
            } else {
                0
            };

            if dib_res == 0 {
                DeleteDC(hdc);
                if icon_info.hbm_color != 0 {
                    DeleteObject(icon_info.hbm_color);
                }
                if icon_info.hbm_mask != 0 {
                    DeleteObject(icon_info.hbm_mask);
                }
                DestroyIcon(sfi.h_icon);
                return None;
            }

            let has_alpha = pixels.chunks_exact(4).any(|p| p[3] > 0);
            if !has_alpha && icon_info.hbm_mask != 0 {
                let mut mask_bmi = bmi;
                let mut mask_pixels = vec![0u8; (w * h * 4) as usize];
                GetDIBits(
                    hdc,
                    icon_info.hbm_mask,
                    0,
                    h as u32,
                    mask_pixels.as_mut_ptr(),
                    &mut mask_bmi,
                    0,
                );
                for (color, mask) in pixels.chunks_exact_mut(4).zip(mask_pixels.chunks_exact(4)) {
                    if mask[0] == 0 && mask[1] == 0 && mask[2] == 0 {
                        color[3] = 255;
                    } else {
                        color[3] = 0;
                    }
                }
            } else if !has_alpha {
                for p in pixels.chunks_exact_mut(4) {
                    p[3] = 255;
                }
            }

            DeleteDC(hdc);
            if icon_info.hbm_color != 0 {
                DeleteObject(icon_info.hbm_color);
            }
            if icon_info.hbm_mask != 0 {
                DeleteObject(icon_info.hbm_mask);
            }
            DestroyIcon(sfi.h_icon);

            // Convert Windows bottom-up BGRA to standard top-down RGBA pixels
            let row_bytes = (w * 4) as usize;
            let mut rgba = vec![0u8; (w * h * 4) as usize];
            for y in 0..h as usize {
                let src_y = (h as usize - 1) - y;
                let src_offset = src_y * row_bytes;
                let dst_offset = y * row_bytes;
                for x in 0..w as usize {
                    let b = pixels[src_offset + x * 4];
                    let g = pixels[src_offset + x * 4 + 1];
                    let r = pixels[src_offset + x * 4 + 2];
                    let a = pixels[src_offset + x * 4 + 3];
                    rgba[dst_offset + x * 4] = r;
                    rgba[dst_offset + x * 4 + 1] = g;
                    rgba[dst_offset + x * 4 + 2] = b;
                    rgba[dst_offset + x * 4 + 3] = a;
                }
            }

            // Encode to transparent 32-bit PNG (eliminates all black square containers)
            let mut png_bytes = Vec::new();
            let encode_success = {
                let mut encoder = png::Encoder::new(&mut png_bytes, w as u32, h as u32);
                encoder.set_color(png::ColorType::Rgba);
                encoder.set_depth(png::BitDepth::Eight);
                match encoder.write_header() {
                    Ok(mut writer) => writer.write_image_data(&rgba).is_ok(),
                    Err(_) => false,
                }
            };

            if encode_success && !png_bytes.is_empty() {
                let base64_str = to_base64(&png_bytes);
                return Some(format!("data:image/png;base64,{}", base64_str));
            }
            None
        }
    }
}

#[cfg(not(target_os = "windows"))]
mod win32_icon {
    use std::path::Path;
    pub fn extract_icon_data_url(_path: &Path) -> Option<String> {
        None
    }
}

fn resolve_fallback_exe_path(lower_name: &str) -> Option<PathBuf> {
    #[cfg(target_os = "windows")]
    {
        let local_app_data = std::env::var("LOCALAPPDATA").ok();
        let program_files = std::env::var("ProgramFiles").ok();
        let program_files_x86 = std::env::var("ProgramFiles(x86)").ok();

        if lower_name == "orca.exe" || lower_name == "orca" {
            if let Some(ref lad) = local_app_data {
                let p = PathBuf::from(lad).join("Programs").join("orca").join("Orca.exe");
                if p.exists() {
                    return Some(p);
                }
            }
        }
        if lower_name == "agy.exe" || lower_name == "agy" {
            if let Some(ref lad) = local_app_data {
                let p = PathBuf::from(lad).join("agy").join("bin").join("agy.exe");
                if p.exists() {
                    return Some(p);
                }
            }
        }
        if lower_name == "code.exe" || lower_name == "code" {
            if let Some(ref lad) = local_app_data {
                let p = PathBuf::from(lad).join("Programs").join("Microsoft VS Code").join("Code.exe");
                if p.exists() {
                    return Some(p);
                }
            }
        }
        if lower_name == "discord.exe" || lower_name == "discord" {
            if let Some(ref lad) = local_app_data {
                let p = PathBuf::from(lad).join("Discord").join("Update.exe");
                if p.exists() {
                    return Some(p);
                }
            }
        }
        if lower_name == "chrome.exe" || lower_name == "chrome" {
            if let Some(ref pf) = program_files {
                let p = PathBuf::from(pf).join("Google").join("Chrome").join("Application").join("chrome.exe");
                if p.exists() {
                    return Some(p);
                }
            }
        }
        if lower_name == "msedge.exe" || lower_name == "msedge" {
            if let Some(ref pf86) = program_files_x86 {
                let p = PathBuf::from(pf86).join("Microsoft").join("Edge").join("Application").join("msedge.exe");
                if p.exists() {
                    return Some(p);
                }
            }
        }
    }
    let _ = lower_name;
    None
}

pub struct PerformanceState {
    pub system: Mutex<System>,
    pub networks: Mutex<Networks>,
    pub icon_cache: Mutex<HashMap<String, String>>,
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
            icon_cache: Mutex::new(HashMap::new()),
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
        ProcessRefreshKind::nothing()
            .with_cpu()
            .with_memory()
            .with_exe(UpdateKind::OnlyIfNotSet),
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
        .map(|d| {
            let disk_type = match d.kind() {
                sysinfo::DiskKind::SSD => "SSD".to_string(),
                sysinfo::DiskKind::HDD => "HDD".to_string(),
                _ => {
                    if d.is_removable() {
                        "Removable".to_string()
                    } else {
                        "Disk".to_string()
                    }
                }
            };
            DiskInfo {
                name: d.name().to_string_lossy().to_string(),
                mount_point: d.mount_point().to_string_lossy().to_string(),
                total_space: d.total_space(),
                available_space: d.available_space(),
                is_removable: d.is_removable(),
                is_read_only: d.is_read_only(),
                file_system: d.file_system().to_string_lossy().to_string(),
                disk_type,
            }
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
    let mut icon_cache = state.icon_cache.lock().unwrap_or_else(|e| e.into_inner());

    let mut proc_list: Vec<AppProcessInfo> = sys
        .processes()
        .iter()
        .map(|(pid, p)| {
            let pid_num = pid.as_u32();
            let raw_name = p.name().to_string_lossy().to_string();
            let is_stash = pid_num == current_pid_num
                || raw_name.eq_ignore_ascii_case("stash.exe")
                || raw_name.eq_ignore_ascii_case("stash");

            let lower_name = raw_name.to_lowercase();
            let icon_data = if let Some(cached) = icon_cache.get(&lower_name) {
                Some(cached.clone())
            } else {
                let resolved_path = p
                    .exe()
                    .map(|ep| ep.to_path_buf())
                    .or_else(|| resolve_fallback_exe_path(&lower_name));

                if let Some(ref path) = resolved_path {
                    let path_str = path.to_string_lossy().to_string();
                    let cached_by_path = icon_cache.get(&path_str).cloned();
                    if let Some(cached) = cached_by_path {
                        icon_cache.insert(lower_name.clone(), cached.clone());
                        Some(cached)
                    } else if let Some(extracted) = win32_icon::extract_icon_data_url(path) {
                        icon_cache.insert(lower_name.clone(), extracted.clone());
                        icon_cache.insert(path_str, extracted.clone());
                        Some(extracted)
                    } else {
                        None
                    }
                } else {
                    None
                }
            };

            AppProcessInfo {
                pid: pid_num,
                name: raw_name,
                cpu_usage: p.cpu_usage(),
                memory_bytes: p.memory(),
                virtual_memory_bytes: p.virtual_memory(),
                run_time_secs: p.run_time(),
                is_stash,
                icon_data,
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
