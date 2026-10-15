//! Disk and process queries shared by both platforms.

use std::{
    fs,
    path::{Path, PathBuf},
    thread,
    time::{Duration, Instant},
};

use sysinfo::{Disks, ProcessRefreshKind, ProcessesToUpdate, System};

/// The closest ancestor of `path` (or `path` itself) that exists.
pub fn existing_ancestor(path: &Path) -> Option<PathBuf> {
    path.ancestors().find(|p| p.exists()).map(Path::to_path_buf)
}

/// Try to create a file where the install would go, without creating folders.
pub fn is_writable(path: &Path) -> bool {
    let Some(base) = existing_ancestor(path) else {
        return false;
    };
    let probe = base.join(format!(".stash-setup-probe-{}", std::process::id()));
    match fs::write(&probe, b"") {
        Ok(()) => {
            let _ = fs::remove_file(&probe);
            true
        }
        Err(_) => false,
    }
}

fn normalize(path: &Path) -> PathBuf {
    let canonical = fs::canonicalize(path).unwrap_or_else(|_| path.to_path_buf());
    // Windows canonical paths carry a `\\?\` prefix that disk mount points lack.
    let text = canonical.to_string_lossy();
    PathBuf::from(text.strip_prefix(r"\\?\").unwrap_or(&text).to_string())
}

pub fn free_space(path: &Path) -> Option<u64> {
    let base = normalize(&existing_ancestor(path)?);
    let disks = Disks::new_with_refreshed_list();
    disks
        .list()
        .iter()
        .filter(|d| base.starts_with(d.mount_point()))
        .max_by_key(|d| d.mount_point().as_os_str().len())
        .map(|d| d.available_space())
}

fn stash_processes(sys: &System, executable: &Path) -> Vec<sysinfo::Pid> {
    let wanted = normalize(executable);
    sys.processes()
        .iter()
        .filter(|(_, p)| p.exe().is_some_and(|exe| normalize(exe).starts_with(&wanted)))
        .map(|(pid, _)| *pid)
        .collect()
}

fn refreshed_system() -> System {
    let mut sys = System::new();
    sys.refresh_processes_specifics(
        ProcessesToUpdate::All,
        true,
        ProcessRefreshKind::nothing().with_exe(sysinfo::UpdateKind::Always),
    );
    sys
}

pub fn running_pids(executable: &Path) -> Vec<u32> {
    stash_processes(&refreshed_system(), executable)
        .into_iter()
        .map(|p| p.as_u32())
        .collect()
}

/// Wait until no process runs from `executable`, up to `timeout`.
pub fn wait_for_exit(executable: &Path, timeout: Duration) -> bool {
    let start = Instant::now();
    loop {
        if running_pids(executable).is_empty() {
            return true;
        }
        if start.elapsed() >= timeout {
            return false;
        }
        thread::sleep(Duration::from_millis(200));
    }
}

pub fn kill(executable: &Path) {
    let sys = refreshed_system();
    for pid in stash_processes(&sys, executable) {
        if let Some(process) = sys.process(pid) {
            process.kill();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn writable_checks_nearest_existing_folder() {
        let tmp = tempfile::tempdir().unwrap();
        assert!(is_writable(&tmp.path().join("not/yet/created")));
        assert!(!tmp.path().join("not").exists());
    }

    #[test]
    fn free_space_is_reported_for_temp_dir() {
        let tmp = tempfile::tempdir().unwrap();
        assert!(free_space(tmp.path()).unwrap_or(0) > 0);
    }

    #[test]
    fn no_processes_run_from_a_fresh_path() {
        let tmp = tempfile::tempdir().unwrap();
        assert!(running_pids(&tmp.path().join("stash.exe")).is_empty());
    }
}
