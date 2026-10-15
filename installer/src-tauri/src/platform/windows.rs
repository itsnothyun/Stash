//! Windows: per-user install under `%LOCALAPPDATA%\Programs\Stash`.

use std::{
    fs,
    os::windows::process::CommandExt,
    path::{Path, PathBuf},
    process::Command,
};

use winreg::{
    enums::{HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE, KEY_READ, KEY_WOW64_32KEY, KEY_WOW64_64KEY},
    RegKey,
};

use crate::{
    detect::{Installed, LegacyUninstall},
    install::{Manifest, Options},
};

const CREATE_NO_WINDOW: u32 = 0x0800_0000;
const UNINSTALL_ROOT: &str = r"Software\Microsoft\Windows\CurrentVersion\Uninstall";
const OUR_KEY: &str = "com.stash.desktop";
const RUN_KEY: &str = r"Software\Microsoft\Windows\CurrentVersion\Run";
const RUN_VALUE: &str = "Stash";
const EXE: &str = "stash.exe";
pub const UNINSTALLER: &str = "uninstall.exe";

pub fn default_dir() -> PathBuf {
    dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from(r"C:\Users\Default\AppData\Local"))
        .join("Programs")
        .join("Stash")
}

pub fn target_for(dir: &Path) -> PathBuf {
    dir.to_path_buf()
}

/// A picked parent folder gets its own `Stash` subfolder, like most installers.
pub fn dir_from_picked(picked: &Path) -> PathBuf {
    if picked.file_name().is_some_and(|n| n.eq_ignore_ascii_case("Stash")) {
        picked.to_path_buf()
    } else {
        picked.join("Stash")
    }
}

pub fn executable(target: &Path) -> PathBuf {
    target.join(EXE)
}

pub fn manifest_path(target: &Path) -> PathBuf {
    target.join(".stash-install.json")
}

/// True when `target` is missing, empty, or already a Stash install, i.e.
/// safe to replace wholesale.
pub fn is_replaceable(target: &Path) -> bool {
    match fs::read_dir(target) {
        Err(_) => !target.exists(),
        Ok(mut entries) => {
            entries.next().is_none() || executable(target).exists() || manifest_path(target).exists()
        }
    }
}

pub fn data_dirs() -> Vec<PathBuf> {
    [dirs::data_dir(), dirs::data_local_dir()]
        .into_iter()
        .flatten()
        .map(|d| d.join("com.stash.desktop"))
        .collect()
}

fn read_string(key: &RegKey, name: &str) -> Option<String> {
    key.get_value::<String, _>(name).ok().filter(|s| !s.is_empty())
}

pub fn find_installed() -> Option<Installed> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    if let Ok(key) = hkcu.open_subkey(format!(r"{UNINSTALL_ROOT}\{OUR_KEY}")) {
        if let Some(location) = read_string(&key, "InstallLocation") {
            let dir = PathBuf::from(location);
            let version = Manifest::read(&manifest_path(&dir))
                .map(|m| m.version)
                .or_else(|| read_string(&key, "DisplayVersion"))
                .unwrap_or_default();
            return Some(Installed { dir, version, legacy: None, needs_elevation: false });
        }
    }
    find_legacy()
}

/// Entries written by the old Tauri NSIS (per-user) or MSI (per-machine) installers.
fn find_legacy() -> Option<Installed> {
    let roots = [
        (HKEY_CURRENT_USER, KEY_READ),
        (HKEY_LOCAL_MACHINE, KEY_READ | KEY_WOW64_64KEY),
        (HKEY_LOCAL_MACHINE, KEY_READ | KEY_WOW64_32KEY),
    ];
    for (hive, flags) in roots {
        let Ok(root) = RegKey::predef(hive).open_subkey_with_flags(UNINSTALL_ROOT, flags) else {
            continue;
        };
        for name in root.enum_keys().flatten() {
            if name == OUR_KEY {
                continue;
            }
            let Ok(key) = root.open_subkey_with_flags(&name, flags) else {
                continue;
            };
            if read_string(&key, "DisplayName").as_deref() != Some("Stash") {
                continue;
            }
            let version = read_string(&key, "DisplayVersion").unwrap_or_default();
            let uninstall = read_string(&key, "UninstallString").unwrap_or_default();
            let location = read_string(&key, "InstallLocation").map(PathBuf::from);

            let legacy = if uninstall.to_ascii_lowercase().contains("msiexec") {
                LegacyUninstall::Msi { product_code: name.clone() }
            } else {
                let uninstaller = PathBuf::from(uninstall.trim_matches('"'));
                let dir = location
                    .clone()
                    .or_else(|| uninstaller.parent().map(Path::to_path_buf))?;
                LegacyUninstall::Nsis { uninstaller, dir }
            };
            return Some(Installed {
                dir: default_dir(),
                version,
                needs_elevation: matches!(legacy, LegacyUninstall::Msi { .. }),
                legacy: Some(legacy),
            });
        }
    }
    None
}

fn create_shortcut(link: &Path, target: &Path) -> Result<(), String> {
    if let Some(parent) = link.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let exe = executable(target);
    let mut shortcut = mslnk::ShellLink::new(&exe).map_err(|e| e.to_string())?;
    shortcut.set_working_dir(Some(target.to_string_lossy().into_owned()));
    shortcut.set_icon_location(Some(exe.to_string_lossy().into_owned()));
    shortcut.create_lnk(link).map_err(|e| e.to_string())
}

fn desktop_link() -> Option<PathBuf> {
    dirs::desktop_dir().map(|d| d.join("Stash.lnk"))
}

fn start_menu_link() -> Option<PathBuf> {
    dirs::data_dir().map(|d| d.join(r"Microsoft\Windows\Start Menu\Programs\Stash.lnk"))
}

fn dir_size_kb(path: &Path) -> u32 {
    fn walk(path: &Path) -> u64 {
        fs::read_dir(path)
            .into_iter()
            .flatten()
            .flatten()
            .map(|e| match e.metadata() {
                Ok(m) if m.is_dir() => walk(&e.path()),
                Ok(m) => m.len(),
                Err(_) => 0,
            })
            .sum()
    }
    (walk(path) / 1024).min(u32::MAX as u64) as u32
}

fn register(target: &Path, version: &str) -> Result<(), String> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let (key, _) = hkcu
        .create_subkey(format!(r"{UNINSTALL_ROOT}\{OUR_KEY}"))
        .map_err(|e| e.to_string())?;
    let uninstaller = target.join(UNINSTALLER);
    let exe = executable(target);
    let quoted = format!("\"{}\" --uninstall", uninstaller.display());
    let set = |name: &str, value: &str| key.set_value(name, &value.to_string());
    set("DisplayName", "Stash")
        .and_then(|_| set("DisplayVersion", version))
        .and_then(|_| set("Publisher", "Stash"))
        .and_then(|_| set("DisplayIcon", &exe.to_string_lossy()))
        .and_then(|_| set("InstallLocation", &target.to_string_lossy()))
        .and_then(|_| set("UninstallString", &quoted))
        .and_then(|_| set("QuietUninstallString", &format!("{quoted} --silent")))
        .and_then(|_| key.set_value("NoModify", &1u32))
        .and_then(|_| key.set_value("NoRepair", &1u32))
        .and_then(|_| key.set_value("EstimatedSize", &dir_size_kb(target)))
        .map_err(|e| e.to_string())
}

fn set_launch_at_login(target: &Path, enabled: bool) -> Result<(), String> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let (key, _) = hkcu.create_subkey(RUN_KEY).map_err(|e| e.to_string())?;
    if enabled {
        let command = format!("\"{}\"", executable(target).display());
        key.set_value(RUN_VALUE, &command).map_err(|e| e.to_string())
    } else {
        match key.delete_value(RUN_VALUE) {
            Err(e) if e.kind() != std::io::ErrorKind::NotFound => Err(e.to_string()),
            _ => Ok(()),
        }
    }
}

fn copy_uninstaller(target: &Path) -> Result<(), String> {
    let me = std::env::current_exe().map_err(|e| e.to_string())?;
    let dest = target.join(UNINSTALLER);
    if me != dest {
        fs::copy(&me, &dest).map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn run_and_wait(command: &mut Command) -> Result<i32, String> {
    command
        .creation_flags(CREATE_NO_WINDOW)
        .status()
        .map(|s| s.code().unwrap_or(-1))
        .map_err(|e| e.to_string())
}

pub struct Windows;

impl crate::install::Integrations for Windows {
    fn migrate_legacy(&self, legacy: &LegacyUninstall) -> Result<(), String> {
        match legacy {
            LegacyUninstall::Nsis { uninstaller, dir } => {
                // `_?=` makes NSIS uninstall in place and wait, instead of
                // relaunching a temp copy and returning immediately.
                let code = run_and_wait(
                    Command::new(uninstaller)
                        .arg("/S")
                        .arg(format!("_?={}", dir.display())),
                )?;
                if code != 0 {
                    return Err(format!("the old uninstaller exited with code {code}"));
                }
                // With `_?=` NSIS cannot delete itself; tidy up what is left.
                let _ = fs::remove_file(uninstaller);
                let _ = fs::remove_dir(dir);
                Ok(())
            }
            LegacyUninstall::Msi { product_code } => {
                let code = run_and_wait(
                    Command::new("msiexec")
                        .args(["/x", product_code, "/qb!", "/norestart"]),
                )?;
                match code {
                    0 | 3010 => Ok(()),
                    1602 => Err("removal was cancelled".into()),
                    other => Err(format!("msiexec exited with code {other}")),
                }
            }
        }
    }

    fn integrate(&self, target: &Path, options: &Options, version: &str) -> Vec<String> {
        let mut warnings = Vec::new();
        let mut attempt = |what: &str, result: Result<(), String>| {
            if let Err(e) = result {
                warnings.push(format!("Couldn't {what}: {e}"));
            }
        };

        attempt("set up the uninstaller", copy_uninstaller(target));
        attempt("add Stash to Apps & Features", register(target, version));

        for (wanted, link, what) in [
            (options.desktop_shortcut, desktop_link(), "create the desktop shortcut"),
            (options.start_menu, start_menu_link(), "add Stash to the Start menu"),
        ] {
            let Some(link) = link else { continue };
            if wanted {
                attempt(what, create_shortcut(&link, target));
            } else {
                let _ = fs::remove_file(&link);
            }
        }
        attempt(
            "set Stash to launch at login",
            set_launch_at_login(target, options.launch_at_login),
        );
        warnings
    }

    fn manifest_path(&self, target: &Path) -> PathBuf {
        manifest_path(target)
    }

    fn remove(&self, _target: &Path) {
        for link in [desktop_link(), start_menu_link()].into_iter().flatten() {
            let _ = fs::remove_file(link);
        }
        let _ = set_launch_at_login(Path::new(""), false);
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let _ = hkcu.delete_subkey_all(format!(r"{UNINSTALL_ROOT}\{OUR_KEY}"));
    }
}

/// Ask Stash to close the way the taskbar would (no `/F`).
pub fn request_quit(pids: &[u32]) {
    for pid in pids {
        let _ = Command::new("taskkill")
            .args(["/PID", &pid.to_string()])
            .creation_flags(CREATE_NO_WINDOW)
            .status();
    }
}

pub fn launch(target: &Path) -> std::io::Result<()> {
    Command::new(executable(target))
        .current_dir(target)
        .spawn()
        .map(|_| ())
}

/// Delete the uninstaller (and its now-empty folder) once this process exits.
pub fn schedule_self_delete(exe: &Path) {
    let dir = exe.parent().map(Path::to_path_buf).unwrap_or_default();
    let script = format!(
        "ping 127.0.0.1 -n 3 > nul & del /f /q \"{}\" & rmdir \"{}\"",
        exe.display(),
        dir.display()
    );
    // `raw_arg`: cmd.exe does not understand Rust's `\"` argument escaping.
    let _ = Command::new("cmd")
        .raw_arg(format!("/c {script}"))
        .creation_flags(CREATE_NO_WINDOW)
        .spawn();
}

pub mod webview2 {
    //! The wizard needs the WebView2 runtime. Windows 11 always has it and
    //! Windows Update installs it on Windows 10, but not on every machine.

    use super::*;
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        MessageBoxW, IDYES, MB_ICONERROR, MB_ICONINFORMATION, MB_OK, MB_YESNO,
    };

    const CLIENT: &str =
        r"Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}";
    const BOOTSTRAPPER: &str = "https://go.microsoft.com/fwlink/p/?LinkId=2124703";

    pub fn is_installed() -> bool {
        let candidates = [
            (HKEY_LOCAL_MACHINE, format!(r"SOFTWARE\WOW6432Node\{CLIENT}")),
            (HKEY_LOCAL_MACHINE, format!(r"SOFTWARE\{CLIENT}")),
            (HKEY_CURRENT_USER, format!(r"Software\{CLIENT}")),
        ];
        candidates.iter().any(|(hive, path)| {
            RegKey::predef(*hive)
                .open_subkey(path)
                .ok()
                .and_then(|k| read_string(&k, "pv"))
                .is_some_and(|v| v != "0.0.0.0")
        })
    }

    fn message(text: &str, flags: u32) -> i32 {
        let wide = |s: &str| s.encode_utf16().chain(Some(0)).collect::<Vec<u16>>();
        let (text, title) = (wide(text), wide("Stash Setup"));
        unsafe { MessageBoxW(std::ptr::null_mut(), text.as_ptr(), title.as_ptr(), flags) }
    }

    /// Returns `Ok(true)` when setup should relaunch, `Err(code)` to exit.
    pub fn ensure() -> Result<bool, i32> {
        if is_installed() {
            return Ok(false);
        }
        let answer = message(
            "Stash Setup needs the Microsoft Edge WebView2 Runtime, which isn't on this PC yet.\n\n\
             Download and install it now? (about 2 MB, needs an internet connection)",
            MB_YESNO | MB_ICONINFORMATION,
        );
        if answer != IDYES {
            return Err(2);
        }
        let installer = std::env::temp_dir().join("MicrosoftEdgeWebview2Setup.exe");
        let downloaded = run_and_wait(
            Command::new("curl.exe")
                .args(["-fsSL", "-o"])
                .arg(&installer)
                .arg(BOOTSTRAPPER),
        )
        .is_ok_and(|code| code == 0);
        let installed = downloaded
            && run_and_wait(Command::new(&installer).args(["/silent", "/install"])).is_ok()
            && is_installed();
        let _ = fs::remove_file(&installer);
        if installed {
            Ok(true)
        } else {
            message(
                "WebView2 couldn't be installed. Check your internet connection and try again, \
                 or install it from https://developer.microsoft.com/microsoft-edge/webview2/",
                MB_OK | MB_ICONERROR,
            );
            Err(1)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn picked_folder_gets_stash_subfolder() {
        assert_eq!(dir_from_picked(Path::new(r"D:\Apps")), PathBuf::from(r"D:\Apps\Stash"));
        assert_eq!(dir_from_picked(Path::new(r"D:\stash")), PathBuf::from(r"D:\stash"));
    }

    #[test]
    fn only_empty_or_stash_folders_are_replaceable() {
        let tmp = tempfile::tempdir().unwrap();
        let target = tmp.path().join("Stash");
        assert!(is_replaceable(&target));
        fs::create_dir_all(&target).unwrap();
        assert!(is_replaceable(&target));
        fs::write(target.join("thesis.docx"), b"precious").unwrap();
        assert!(!is_replaceable(&target));
        fs::write(target.join(EXE), b"").unwrap();
        assert!(is_replaceable(&target));
    }
}
