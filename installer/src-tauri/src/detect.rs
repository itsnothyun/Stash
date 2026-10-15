//! Decides whether this run is a fresh install, an update, a repair or a
//! downgrade, based on what the platform layer found on disk.

use std::{cmp::Ordering, path::PathBuf};

use serde::Serialize;

use crate::version;

/// How to remove a Stash installed by the old Tauri NSIS/MSI installers.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum LegacyUninstall {
    Nsis { uninstaller: PathBuf, dir: PathBuf },
    Msi { product_code: String },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Installed {
    /// What the user would pick in the folder field (see `install::Options::dir`).
    pub dir: PathBuf,
    pub version: String,
    #[serde(skip)]
    pub legacy: Option<LegacyUninstall>,
    /// Whether the user has to approve an admin prompt to remove it.
    pub needs_elevation: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum Mode {
    Fresh,
    Update { from: String },
    Repair,
    Downgrade { from: String },
}

pub fn decide(installed: Option<&Installed>, payload_version: &str) -> Mode {
    let Some(installed) = installed else {
        return Mode::Fresh;
    };
    match version::compare(&installed.version, payload_version) {
        Ordering::Less => Mode::Update { from: installed.version.clone() },
        Ordering::Equal => Mode::Repair,
        Ordering::Greater => Mode::Downgrade { from: installed.version.clone() },
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn installed(version: &str) -> Installed {
        Installed {
            dir: PathBuf::from("C:/Stash"),
            version: version.into(),
            legacy: None,
            needs_elevation: false,
        }
    }

    #[test]
    fn nothing_installed_is_fresh() {
        assert_eq!(decide(None, "0.1.1"), Mode::Fresh);
    }

    #[test]
    fn older_is_update() {
        assert_eq!(
            decide(Some(&installed("0.1.0")), "0.1.1"),
            Mode::Update { from: "0.1.0".into() }
        );
    }

    #[test]
    fn same_is_repair() {
        assert_eq!(decide(Some(&installed("0.1.1")), "0.1.1"), Mode::Repair);
    }

    #[test]
    fn newer_is_downgrade() {
        assert_eq!(
            decide(Some(&installed("0.2.0")), "0.1.1"),
            Mode::Downgrade { from: "0.2.0".into() }
        );
    }

    #[test]
    fn legacy_install_with_older_version_is_update() {
        let mut legacy = installed("0.1.0");
        legacy.legacy = Some(LegacyUninstall::Msi { product_code: "{X}".into() });
        assert!(matches!(decide(Some(&legacy), "0.1.1"), Mode::Update { .. }));
    }
}
