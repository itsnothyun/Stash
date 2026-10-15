mod cli;
mod detect;
mod install;
mod payload;
mod platform;
mod system;
mod version;

use std::{
    fs::OpenOptions,
    io::Write,
    path::{Path, PathBuf},
    sync::Mutex,
    time::Duration,
};

use serde::Serialize;
use tauri::{Emitter, Manager, RunEvent, State};

use crate::{
    cli::Cli,
    detect::{Installed, LegacyUninstall, Mode},
    install::{Options, Outcome, Plan},
};

const CLOSE_TIMEOUT: Duration = Duration::from_secs(5);

fn log(line: &str) {
    let path = std::env::temp_dir().join("stash-setup.log");
    if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(path) {
        let _ = writeln!(file, "{line}");
    }
}

#[derive(Debug, Serialize)]
pub struct CmdError {
    code: &'static str,
    message: String,
}

impl CmdError {
    fn new(code: &'static str, message: impl Into<String>) -> Self {
        let message = message.into();
        log(&format!("error [{code}]: {message}"));
        Self { code, message }
    }
}

struct SetupState {
    cli: Cli,
    installed: Option<Installed>,
    self_delete: Mutex<Option<PathBuf>>,
}

impl SetupState {
    fn default_options(&self) -> Options {
        let dir = self
            .cli
            .dir
            .clone()
            .or_else(|| self.installed.as_ref().map(|i| i.dir.clone()))
            .unwrap_or_else(platform::default_dir);
        Options {
            dir,
            desktop_shortcut: self.cli.desktop_shortcut,
            start_menu: self.cli.start_menu,
            launch_at_login: self.cli.launch_at_login,
        }
    }

    /// Where an existing install lives, for uninstalling and closing Stash.
    fn installed_target(&self) -> Option<PathBuf> {
        if let Some(installed) = &self.installed {
            if installed.legacy.is_none() {
                return Some(platform::target_for(&installed.dir));
            }
        }
        // Run as `uninstall.exe` from inside the install folder.
        std::env::current_exe()
            .ok()
            .and_then(|exe| exe.parent().map(Path::to_path_buf))
            .filter(|dir| platform::manifest_path(dir).exists())
    }

    fn legacy(&self) -> Option<LegacyUninstall> {
        self.installed.as_ref().and_then(|i| i.legacy.clone())
    }

    /// Executables (or folders) Stash could be running from right now.
    fn stash_locations(&self, dir: Option<&Path>) -> Vec<PathBuf> {
        let mut out: Vec<PathBuf> = self
            .installed_target()
            .into_iter()
            .chain(dir.map(platform::target_for))
            .map(|t| platform::executable(&t))
            .collect();
        if let Some(LegacyUninstall::Nsis { dir, .. }) = self.legacy() {
            out.push(dir);
        }
        out
    }
}

fn mb(bytes: u64) -> String {
    format!("{:.0} MB", (bytes as f64 / 1_048_576.0).ceil())
}

/// Why `dir` can't take an install, if it can't.
fn dir_problem(target: &Path, required: u64) -> (Option<String>, Option<u64>) {
    let free = system::free_space(target);
    let problem = if !target.is_absolute() {
        Some("Choose a full folder path.".to_string())
    } else if !platform::is_replaceable(target) {
        Some("This folder already has other files in it. Choose an empty or new folder.".into())
    } else if !system::is_writable(target) {
        Some("You don't have permission to install here. Choose another folder.".into())
    } else if free.is_some_and(|f| f < required) {
        Some(format!(
            "Not enough space: Stash needs {}, and this drive has {} free.",
            mb(required),
            mb(free.unwrap_or(0))
        ))
    } else {
        None
    };
    (problem, free)
}

fn close_stash_blocking(locations: &[PathBuf], force: bool) -> Result<(), CmdError> {
    for location in locations {
        let pids = system::running_pids(location);
        if pids.is_empty() {
            continue;
        }
        if force {
            system::kill(location);
        } else {
            platform::request_quit(&pids);
        }
        if !system::wait_for_exit(location, CLOSE_TIMEOUT) {
            return Err(CmdError::new(
                "stash_running",
                "Stash is still running. Quit it from its tray icon, then try again.",
            ));
        }
    }
    Ok(())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Context {
    action: &'static str,
    mode: Mode,
    installed: Option<Installed>,
    version: &'static str,
    platform: &'static str,
    defaults: Options,
    required_bytes: u64,
    payload_missing: bool,
}

#[tauri::command]
fn get_context(state: State<SetupState>) -> Context {
    Context {
        action: if state.cli.uninstall { "uninstall" } else { "install" },
        mode: detect::decide(state.installed.as_ref(), payload::VERSION),
        installed: state.installed.clone(),
        version: payload::VERSION,
        platform: if cfg!(windows) { "windows" } else { "macos" },
        defaults: state.default_options(),
        required_bytes: payload::unpacked_size(),
        payload_missing: payload::is_empty(),
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DirCheck {
    problem: Option<String>,
    free_bytes: Option<u64>,
    required_bytes: u64,
}

#[tauri::command]
async fn check_dir(dir: PathBuf) -> DirCheck {
    let required = payload::unpacked_size();
    let (problem, free_bytes) = dir_problem(&platform::target_for(&dir), required);
    DirCheck { problem, free_bytes, required_bytes: required }
}

#[tauri::command]
async fn pick_folder(window: tauri::WebviewWindow, current: PathBuf) -> Option<PathBuf> {
    let start = system::existing_ancestor(&current).unwrap_or(current);
    rfd::AsyncFileDialog::new()
        .set_title("Choose where to install Stash")
        .set_directory(start)
        .set_parent(&window)
        .pick_folder()
        .await
        .map(|handle| platform::dir_from_picked(handle.path()))
}

#[tauri::command]
async fn close_stash(
    state: State<'_, SetupState>,
    dir: Option<PathBuf>,
    force: bool,
) -> Result<(), CmdError> {
    let locations = state.stash_locations(dir.as_deref());
    tauri::async_runtime::spawn_blocking(move || close_stash_blocking(&locations, force))
        .await
        .map_err(|e| CmdError::new("internal", e.to_string()))?
}

#[tauri::command]
async fn run_install(
    app: tauri::AppHandle,
    state: State<'_, SetupState>,
    options: Options,
) -> Result<Outcome, CmdError> {
    let legacy = state.legacy();
    tauri::async_runtime::spawn_blocking(move || {
        install_blocking(options, legacy, |p| {
            let _ = app.emit("setup://progress", p);
        })
    })
    .await
    .map_err(|e| CmdError::new("internal", e.to_string()))?
}

fn install_blocking(
    options: Options,
    legacy: Option<LegacyUninstall>,
    progress: impl FnMut(install::Progress),
) -> Result<Outcome, CmdError> {
    if payload::is_empty() {
        return Err(CmdError::new(
            "payload_missing",
            "This setup was built without Stash inside it.",
        ));
    }
    let target = platform::target_for(&options.dir);
    if let (Some(problem), _) = dir_problem(&target, payload::unpacked_size()) {
        return Err(CmdError::new("bad_dir", problem));
    }
    log(&format!("installing {} into {}", payload::VERSION, target.display()));
    let plan = Plan {
        archive: payload::ARCHIVE,
        target,
        options,
        version: payload::VERSION.to_string(),
        legacy,
    };
    let outcome = install::install(&plan, &platform::Native, progress)
        .map_err(|e| CmdError::new("install_failed", e.to_string()))?;
    for warning in &outcome.warnings {
        log(&format!("warning: {warning}"));
    }
    Ok(outcome)
}

#[tauri::command]
async fn run_uninstall(
    app: tauri::AppHandle,
    state: State<'_, SetupState>,
    delete_data: bool,
) -> Result<Outcome, CmdError> {
    let target = state
        .installed_target()
        .ok_or_else(|| CmdError::new("not_installed", "Stash isn't installed."))?;
    let removal = tauri::async_runtime::spawn_blocking(move || {
        uninstall_blocking(&target, delete_data, |p| {
            let _ = app.emit("setup://progress", p);
        })
    })
    .await
    .map_err(|e| CmdError::new("internal", e.to_string()))??;
    *state.self_delete.lock().unwrap() = removal.self_delete;
    Ok(removal.outcome)
}

fn uninstall_blocking(
    target: &Path,
    delete_data: bool,
    progress: impl FnMut(install::Progress),
) -> Result<install::Removal, CmdError> {
    log(&format!("uninstalling {} (delete data: {delete_data})", target.display()));
    let data = if delete_data { platform::data_dirs() } else { Vec::new() };
    let me = std::env::current_exe().ok();
    install::uninstall(target, &platform::Native, &data, me.as_deref(), progress)
        .map_err(|e| CmdError::new("uninstall_failed", e.to_string()))
}

#[tauri::command]
fn launch_stash(dir: PathBuf) -> Result<(), CmdError> {
    platform::launch(&platform::target_for(&dir))
        .map_err(|e| CmdError::new("launch_failed", e.to_string()))
}

/// Exit codes: 0 success, 1 failure, 2 WebView2 declined, 3 Stash still running.
fn run_silent(state: SetupState) -> i32 {
    let result = if state.cli.uninstall {
        let Some(target) = state.installed_target() else {
            log("nothing to uninstall");
            return 0;
        };
        close_stash_blocking(&state.stash_locations(None), false).and_then(|_| {
            let removal = uninstall_blocking(&target, state.cli.delete_data, |_| {})?;
            if let Some(exe) = removal.self_delete {
                platform::schedule_self_delete(&exe);
            }
            Ok(())
        })
    } else {
        let options = state.default_options();
        close_stash_blocking(&state.stash_locations(Some(&options.dir)), false)
            .and_then(|_| install_blocking(options, state.legacy(), |_| {}).map(|_| ()))
    };
    match result {
        Ok(()) => {
            log("done");
            0
        }
        Err(e) if e.code == "stash_running" => 3,
        Err(_) => 1,
    }
}

pub fn run() -> i32 {
    let cli = match cli::parse(std::env::args().skip(1)) {
        Ok(cli) => cli,
        Err(e) => {
            log(&format!("bad arguments: {e}"));
            return 1;
        }
    };
    let state = SetupState {
        installed: platform::find_installed(),
        self_delete: Mutex::new(None),
        cli,
    };

    if state.cli.silent {
        return run_silent(state);
    }

    #[cfg(windows)]
    match platform::webview2::ensure() {
        Ok(false) => {}
        Ok(true) => {
            let relaunched = std::env::current_exe()
                .and_then(|exe| std::process::Command::new(exe).args(std::env::args().skip(1)).spawn());
            return if relaunched.is_ok() { 0 } else { 1 };
        }
        Err(code) => return code,
    }

    let app = tauri::Builder::default()
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            get_context,
            check_dir,
            pick_folder,
            close_stash,
            run_install,
            run_uninstall,
            launch_stash
        ])
        .build(tauri::generate_context!());
    let app = match app {
        Ok(app) => app,
        Err(e) => {
            log(&format!("failed to start: {e}"));
            return 1;
        }
    };
    app.run(|handle, event| {
        if let RunEvent::Exit = event {
            let state = handle.state::<SetupState>();
            let pending = state.self_delete.lock().unwrap().take();
            if let Some(exe) = pending {
                platform::schedule_self_delete(&exe);
            }
        }
    });
    0
}
