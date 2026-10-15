//! The install and uninstall transactions, independent of any UI.
//!
//! OS-specific side effects (shortcuts, registry, launch agents) go through
//! [`Integrations`] so the file-level transaction can be tested in a temp dir.

use std::{
    ffi::OsString,
    fs, io,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};

use serde::{Deserialize, Serialize};

use crate::detect::LegacyUninstall;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Options {
    /// Windows: the install folder itself. macOS: the folder holding `Stash.app`.
    pub dir: PathBuf,
    pub desktop_shortcut: bool,
    pub start_menu: bool,
    pub launch_at_login: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Manifest {
    pub version: String,
    pub installed_at: u64,
    pub target: PathBuf,
    pub options: Options,
}

impl Manifest {
    pub fn read(path: &Path) -> Option<Manifest> {
        serde_json::from_slice(&fs::read(path).ok()?).ok()
    }

    pub fn write(&self, path: &Path) -> io::Result<()> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(path, serde_json::to_vec_pretty(self)?)
    }
}

#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum Stage {
    Migrating,
    Extracting,
    Finishing,
    Removing,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct Progress {
    pub stage: Stage,
    pub fraction: f64,
}

#[derive(Debug, Default, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Outcome {
    /// Steps that failed after the files were safely in place.
    pub warnings: Vec<String>,
}

#[derive(Debug, thiserror::Error)]
pub enum InstallError {
    #[error("Couldn't remove the previous version of Stash: {0}")]
    Legacy(String),
    #[error("Couldn't unpack Stash: {0}")]
    Extract(io::Error),
    #[error("Couldn't move Stash into place: {0}")]
    Swap(io::Error),
    #[error("{0}")]
    Remove(io::Error),
}

/// OS integration points. Each returns user-facing warning text on failure,
/// because by the time they run the install itself has already succeeded.
pub trait Integrations {
    fn migrate_legacy(&self, legacy: &LegacyUninstall) -> Result<(), String>;
    fn integrate(&self, target: &Path, options: &Options, version: &str) -> Vec<String>;
    fn manifest_path(&self, target: &Path) -> PathBuf;
    fn remove(&self, target: &Path);
}

pub struct Plan<'a> {
    pub archive: &'a [u8],
    pub target: PathBuf,
    pub options: Options,
    pub version: String,
    pub legacy: Option<LegacyUninstall>,
}

pub fn sibling(path: &Path, suffix: &str) -> PathBuf {
    let mut name: OsString = path.file_name().unwrap_or_default().to_owned();
    name.push(suffix);
    path.with_file_name(name)
}

fn remove_any(path: &Path) -> io::Result<()> {
    match fs::symlink_metadata(path) {
        Ok(meta) if meta.is_dir() => fs::remove_dir_all(path),
        Ok(_) => fs::remove_file(path),
        Err(e) if e.kind() == io::ErrorKind::NotFound => Ok(()),
        Err(e) => Err(e),
    }
}

pub fn install(
    plan: &Plan,
    integrations: &dyn Integrations,
    mut progress: impl FnMut(Progress),
) -> Result<Outcome, InstallError> {
    let target = &plan.target;

    if let Some(legacy) = &plan.legacy {
        progress(Progress { stage: Stage::Migrating, fraction: 0.0 });
        integrations
            .migrate_legacy(legacy)
            .map_err(InstallError::Legacy)?;
    }

    // Unpack next to the target so the swap below is a same-volume rename.
    let staging = sibling(target, ".staging");
    remove_any(&staging).map_err(InstallError::Extract)?;
    if let Some(parent) = target.parent() {
        fs::create_dir_all(parent).map_err(InstallError::Extract)?;
    }
    if let Err(e) = crate::payload::extract(plan.archive, &staging, |fraction| {
        progress(Progress { stage: Stage::Extracting, fraction })
    }) {
        let _ = remove_any(&staging);
        return Err(InstallError::Extract(e));
    }

    progress(Progress { stage: Stage::Finishing, fraction: 0.0 });
    let old = sibling(target, ".old");
    if let Err(e) = remove_any(&old) {
        let _ = remove_any(&staging);
        return Err(InstallError::Swap(e));
    }
    let had_previous = target.exists();
    if had_previous {
        if let Err(e) = fs::rename(target, &old) {
            let _ = remove_any(&staging);
            return Err(InstallError::Swap(e));
        }
    }
    if let Err(e) = fs::rename(&staging, target) {
        if had_previous {
            let _ = fs::rename(&old, target);
        }
        let _ = remove_any(&staging);
        return Err(InstallError::Swap(e));
    }

    let mut warnings = integrations.integrate(target, &plan.options, &plan.version);

    let manifest = Manifest {
        version: plan.version.clone(),
        installed_at: SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0),
        target: target.clone(),
        options: plan.options.clone(),
    };
    if let Err(e) = manifest.write(&integrations.manifest_path(target)) {
        warnings.push(format!("Couldn't record the installed version: {e}"));
    }

    let _ = remove_any(&old);
    progress(Progress { stage: Stage::Finishing, fraction: 1.0 });
    Ok(Outcome { warnings })
}

#[derive(Debug, Default, PartialEq, Eq)]
pub struct Removal {
    pub outcome: Outcome,
    /// Set when the running uninstaller lives inside `target` and must be
    /// deleted after this process exits.
    pub self_delete: Option<PathBuf>,
}

pub fn uninstall(
    target: &Path,
    integrations: &dyn Integrations,
    data_dirs: &[PathBuf],
    self_exe: Option<&Path>,
    mut progress: impl FnMut(Progress),
) -> Result<Removal, InstallError> {
    progress(Progress { stage: Stage::Removing, fraction: 0.0 });
    integrations.remove(target);
    let _ = remove_any(&integrations.manifest_path(target));

    let mut removal = Removal::default();
    let self_inside = self_exe.filter(|exe| exe.starts_with(target));
    match self_inside {
        Some(exe) => {
            // Windows cannot delete a running exe: clear everything around it.
            if let Ok(entries) = fs::read_dir(target) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path != exe {
                        remove_any(&path).map_err(InstallError::Remove)?;
                    }
                }
            }
            removal.self_delete = Some(exe.to_path_buf());
        }
        None => remove_any(target).map_err(InstallError::Remove)?,
    }
    progress(Progress { stage: Stage::Removing, fraction: 0.6 });

    for dir in data_dirs {
        if let Err(e) = remove_any(dir) {
            removal
                .outcome
                .warnings
                .push(format!("Couldn't delete {}: {e}", dir.display()));
        }
    }
    progress(Progress { stage: Stage::Removing, fraction: 1.0 });
    Ok(removal)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::payload::tests::sample_archive;
    use std::cell::RefCell;

    #[derive(Default)]
    struct Fake {
        fail_legacy: bool,
        integrate_warnings: Vec<String>,
        calls: RefCell<Vec<String>>,
    }

    impl Integrations for Fake {
        fn migrate_legacy(&self, _: &LegacyUninstall) -> Result<(), String> {
            self.calls.borrow_mut().push("legacy".into());
            if self.fail_legacy {
                Err("boom".into())
            } else {
                Ok(())
            }
        }
        fn integrate(&self, _: &Path, _: &Options, _: &str) -> Vec<String> {
            self.calls.borrow_mut().push("integrate".into());
            self.integrate_warnings.clone()
        }
        fn manifest_path(&self, target: &Path) -> PathBuf {
            target.join(".stash-install.json")
        }
        fn remove(&self, _: &Path) {
            self.calls.borrow_mut().push("remove".into());
        }
    }

    fn plan<'a>(archive: &'a [u8], target: &Path) -> Plan<'a> {
        Plan {
            archive,
            target: target.to_path_buf(),
            options: Options {
                dir: target.to_path_buf(),
                desktop_shortcut: true,
                start_menu: true,
                launch_at_login: false,
            },
            version: "0.1.1".into(),
            legacy: None,
        }
    }

    #[test]
    fn fresh_install_writes_files_and_manifest() {
        let tmp = tempfile::tempdir().unwrap();
        let target = tmp.path().join("Stash");
        let archive = sample_archive(&[("stash.exe", b"v2")]);
        let fake = Fake::default();

        let outcome = install(&plan(&archive, &target), &fake, |_| {}).unwrap();

        assert!(outcome.warnings.is_empty());
        assert_eq!(fs::read(target.join("stash.exe")).unwrap(), b"v2");
        let manifest = Manifest::read(&target.join(".stash-install.json")).unwrap();
        assert_eq!(manifest.version, "0.1.1");
        assert!(!sibling(&target, ".staging").exists());
        assert!(!sibling(&target, ".old").exists());
    }

    #[test]
    fn update_replaces_previous_files() {
        let tmp = tempfile::tempdir().unwrap();
        let target = tmp.path().join("Stash");
        fs::create_dir_all(&target).unwrap();
        fs::write(target.join("stash.exe"), b"v1").unwrap();
        fs::write(target.join("stale.dll"), b"old").unwrap();
        let archive = sample_archive(&[("stash.exe", b"v2")]);

        install(&plan(&archive, &target), &Fake::default(), |_| {}).unwrap();

        assert_eq!(fs::read(target.join("stash.exe")).unwrap(), b"v2");
        assert!(!target.join("stale.dll").exists());
        assert!(!sibling(&target, ".old").exists());
    }

    #[test]
    fn corrupt_payload_leaves_existing_install_untouched() {
        let tmp = tempfile::tempdir().unwrap();
        let target = tmp.path().join("Stash");
        fs::create_dir_all(&target).unwrap();
        fs::write(target.join("stash.exe"), b"v1").unwrap();
        let fake = Fake::default();

        let err = install(&plan(b"garbage", &target), &fake, |_| {}).unwrap_err();

        assert!(matches!(err, InstallError::Extract(_)));
        assert_eq!(fs::read(target.join("stash.exe")).unwrap(), b"v1");
        assert!(!sibling(&target, ".staging").exists());
        assert!(fake.calls.borrow().is_empty());
    }

    #[test]
    fn failed_legacy_migration_aborts_before_touching_files() {
        let tmp = tempfile::tempdir().unwrap();
        let target = tmp.path().join("Stash");
        let archive = sample_archive(&[("stash.exe", b"v2")]);
        let fake = Fake { fail_legacy: true, ..Default::default() };
        let mut p = plan(&archive, &target);
        p.legacy = Some(LegacyUninstall::Nsis {
            uninstaller: tmp.path().join("uninstall.exe"),
            dir: tmp.path().join("old"),
        });

        let err = install(&p, &fake, |_| {}).unwrap_err();

        assert!(matches!(err, InstallError::Legacy(_)));
        assert!(!target.exists());
    }

    #[test]
    fn integration_failures_become_warnings() {
        let tmp = tempfile::tempdir().unwrap();
        let target = tmp.path().join("Stash");
        let archive = sample_archive(&[("stash.exe", b"v2")]);
        let fake = Fake {
            integrate_warnings: vec!["Couldn't create desktop shortcut".into()],
            ..Default::default()
        };

        let outcome = install(&plan(&archive, &target), &fake, |_| {}).unwrap();

        assert_eq!(outcome.warnings, vec!["Couldn't create desktop shortcut"]);
        assert!(target.join("stash.exe").exists());
    }

    #[test]
    fn stale_staging_from_a_crashed_run_is_replaced() {
        let tmp = tempfile::tempdir().unwrap();
        let target = tmp.path().join("Stash");
        let staging = sibling(&target, ".staging");
        fs::create_dir_all(&staging).unwrap();
        fs::write(staging.join("junk"), b"x").unwrap();
        let archive = sample_archive(&[("stash.exe", b"v2")]);

        install(&plan(&archive, &target), &Fake::default(), |_| {}).unwrap();

        assert!(!target.join("junk").exists());
    }

    #[test]
    fn uninstall_removes_target_and_optionally_data() {
        let tmp = tempfile::tempdir().unwrap();
        let target = tmp.path().join("Stash");
        let data = tmp.path().join("data");
        fs::create_dir_all(&target).unwrap();
        fs::create_dir_all(&data).unwrap();
        fs::write(target.join("stash.exe"), b"v1").unwrap();
        let fake = Fake::default();

        let kept = uninstall(&target, &fake, &[], None, |_| {}).unwrap();
        assert!(!target.exists());
        assert!(data.exists());
        assert_eq!(kept.self_delete, None);
        assert_eq!(fake.calls.borrow().as_slice(), ["remove"]);

        fs::create_dir_all(&target).unwrap();
        uninstall(&target, &fake, &[data.clone()], None, |_| {}).unwrap();
        assert!(!data.exists());
    }

    #[test]
    fn uninstall_spares_the_running_uninstaller() {
        let tmp = tempfile::tempdir().unwrap();
        let target = tmp.path().join("Stash");
        fs::create_dir_all(&target).unwrap();
        fs::write(target.join("stash.exe"), b"v1").unwrap();
        let me = target.join("uninstall.exe");
        fs::write(&me, b"me").unwrap();

        let removal = uninstall(&target, &Fake::default(), &[], Some(&me), |_| {}).unwrap();

        assert!(me.exists());
        assert!(!target.join("stash.exe").exists());
        assert_eq!(removal.self_delete, Some(me));
    }
}
