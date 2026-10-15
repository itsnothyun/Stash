//! macOS: `Stash.app` copied into `/Applications` (or a chosen folder).

use std::{
    fs,
    path::{Path, PathBuf},
    process::Command,
};

use crate::{
    detect::{Installed, LegacyUninstall},
    install::{Manifest, Options},
};

const BUNDLE_ID: &str = "com.stash.desktop";
const APP: &str = "Stash.app";
const AGENT_LABEL: &str = "com.stash.desktop.launcher";

fn home() -> PathBuf {
    dirs::home_dir().unwrap_or_else(|| PathBuf::from("/"))
}

pub fn default_dir() -> PathBuf {
    PathBuf::from("/Applications")
}

pub fn target_for(dir: &Path) -> PathBuf {
    dir.join(APP)
}

pub fn dir_from_picked(picked: &Path) -> PathBuf {
    picked.to_path_buf()
}

/// Processes launched from the bundle all live under it.
pub fn executable(target: &Path) -> PathBuf {
    target.to_path_buf()
}

/// Kept outside the bundle so writing it never invalidates a code signature.
pub fn manifest_path(_target: &Path) -> PathBuf {
    home().join("Library/Application Support/com.stash.setup/install.json")
}

fn plist_string(app: &Path, key: &str) -> Option<String> {
    let text = fs::read_to_string(app.join("Contents/Info.plist")).ok()?;
    let after_key = &text[text.find(&format!("<key>{key}</key>"))?..];
    let start = after_key.find("<string>")? + "<string>".len();
    let end = after_key[start..].find("</string>")? + start;
    Some(after_key[start..end].trim().to_string())
}

fn is_stash_bundle(app: &Path) -> bool {
    plist_string(app, "CFBundleIdentifier").as_deref() == Some(BUNDLE_ID)
}

pub fn is_replaceable(target: &Path) -> bool {
    !target.exists() || is_stash_bundle(target)
}

pub fn data_dirs() -> Vec<PathBuf> {
    let lib = home().join("Library");
    ["Application Support", "Caches", "WebKit"]
        .iter()
        .map(|sub| lib.join(sub).join(BUNDLE_ID))
        .collect()
}

pub fn find_installed() -> Option<Installed> {
    if let Some(manifest) = Manifest::read(&manifest_path(Path::new(""))) {
        if manifest.target.exists() {
            return Some(Installed {
                dir: manifest.options.dir,
                version: manifest.version,
                legacy: None,
                needs_elevation: false,
            });
        }
    }
    // A copy dragged in from the old DMG: no manifest, but replaceable in place.
    [default_dir(), home().join("Applications")]
        .into_iter()
        .find(|dir| is_stash_bundle(&target_for(dir)))
        .map(|dir| Installed {
            version: plist_string(&target_for(&dir), "CFBundleShortVersionString")
                .unwrap_or_default(),
            dir,
            legacy: None,
            needs_elevation: false,
        })
}

fn agent_path() -> PathBuf {
    home().join(format!("Library/LaunchAgents/{AGENT_LABEL}.plist"))
}

fn set_launch_at_login(target: &Path, enabled: bool) -> Result<(), String> {
    let path = agent_path();
    if !enabled {
        return match fs::remove_file(&path) {
            Err(e) if e.kind() != std::io::ErrorKind::NotFound => Err(e.to_string()),
            _ => Ok(()),
        };
    }
    let plist = format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>{AGENT_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/open</string>
    <string>-a</string>
    <string>{}</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
</dict>
</plist>
"#,
        target.display()
    );
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&path, plist).map_err(|e| e.to_string())
}

pub struct MacOs;

impl crate::install::Integrations for MacOs {
    fn migrate_legacy(&self, _legacy: &LegacyUninstall) -> Result<(), String> {
        // Old DMG installs are plain bundles; the swap replaces them in place.
        Ok(())
    }

    fn integrate(&self, target: &Path, options: &Options, _version: &str) -> Vec<String> {
        let mut warnings = Vec::new();
        if let Err(e) = set_launch_at_login(target, options.launch_at_login) {
            warnings.push(format!("Couldn't set Stash to launch at login: {e}"));
        }
        warnings
    }

    fn manifest_path(&self, target: &Path) -> PathBuf {
        manifest_path(target)
    }

    fn remove(&self, target: &Path) {
        let _ = set_launch_at_login(target, false);
    }
}

pub fn request_quit(_pids: &[u32]) {
    let _ = Command::new("osascript")
        .args(["-e", &format!("tell application id \"{BUNDLE_ID}\" to quit")])
        .status();
}

pub fn launch(target: &Path) -> std::io::Result<()> {
    Command::new("open").arg(target).spawn().map(|_| ())
}

/// The setup is never copied into the install, so nothing to clean up.
pub fn schedule_self_delete(_exe: &Path) {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_bundle_identity_from_info_plist() {
        let tmp = tempfile::tempdir().unwrap();
        let app = tmp.path().join(APP);
        fs::create_dir_all(app.join("Contents")).unwrap();
        fs::write(
            app.join("Contents/Info.plist"),
            "<dict><key>CFBundleIdentifier</key>\n<string>com.stash.desktop</string>\
             <key>CFBundleShortVersionString</key><string>0.1.0</string></dict>",
        )
        .unwrap();
        assert!(is_replaceable(&app));
        assert_eq!(plist_string(&app, "CFBundleShortVersionString").as_deref(), Some("0.1.0"));
    }

    #[test]
    fn foreign_bundle_is_not_replaceable() {
        let tmp = tempfile::tempdir().unwrap();
        let app = tmp.path().join(APP);
        fs::create_dir_all(&app).unwrap();
        assert!(!is_replaceable(&app));
    }
}
