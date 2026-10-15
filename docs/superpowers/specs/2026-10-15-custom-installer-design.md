# Stash Setup — Custom Installer Design

Date: 2026-10-15
Status: Approved (pending spec review)

## Goal

Replace the default Tauri installers (NSIS `.exe` + `.msi` on Windows, plain DMG on macOS) with **Stash Setup**: a branded installer app whose UI matches Stash itself. It runs on Windows and macOS, works offline, and handles install, update/repair and uninstall.

## Decisions

| Topic | Decision |
|---|---|
| Scope | Fully custom installer app (not a re-skinned NSIS) |
| Platforms | Windows and macOS |
| Payload | Bundled offline: the Stash build is embedded in the setup binary |
| Features | Choose install folder, shortcut options, branded uninstaller, update/repair mode |
| Visual direction | "Match the app": light warm surfaces, indigo brand (`--brand: 243 70% 58%`), dark pill primary button |
| Flow | Step-by-step wizard: Welcome → Options → Installing → Done, with step dots |
| Tech | Separate Tauri 2 app with a React UI |
| Old artifacts | NSIS `.exe` and `.msi` are no longer published; the macOS DMG now contains "Install Stash.app" |

## Architecture

New top-level package `installer/`, an independent Tauri app (identifier `com.stash.setup`, product name "Stash Setup").

| Unit | Responsibility | Depends on |
|---|---|---|
| `installer/ui/` | React wizard: Welcome, Options, Installing, Done, plus Update/Repair and Uninstall variants. Imports the app's design tokens from `src/styles` so colors and type match exactly. | Tauri commands and events only |
| `installer/src-tauri/src/payload.rs` | Embeds the archived Stash build at compile time (`include_bytes!` of a zstd-compressed tar) and streams extraction with progress callbacks. | none |
| `installer/src-tauri/src/detect.rs` | Finds an existing install: the Stash Setup manifest, or a legacy Tauri NSIS install (HKCU Uninstall key for `Stash`). Returns `Fresh`, `Update{from}`, `Repair`, or `MigrateLegacy{uninstaller}`. | platform registry/fs reads |
| `installer/src-tauri/src/install.rs` | Orchestrates the install transaction (steps below) and emits progress events. | payload, platform |
| `installer/src-tauri/src/platform/windows.rs` | Shortcuts (desktop, Start Menu), launch at login (HKCU `Run`), Apps & Features entry (HKCU `...\Uninstall\com.stash.desktop`), self-delete after uninstall. | Windows APIs |
| `installer/src-tauri/src/platform/macos.rs` | Copy `Stash.app` to `/Applications` (or a chosen folder), launch at login via a LaunchAgent plist, uninstall. | macOS fs |
| `installer/src-tauri/src/cli.rs` | Parses `--uninstall`, `--silent`, `--dir <path>`, `--no-desktop-shortcut`, `--no-start-menu`, `--launch-at-login`. | none |

### Install locations and data

- **Windows:** per-user, default `%LOCALAPPDATA%\Programs\Stash`, with no admin prompt. This matches the current NSIS default, so updates replace the old install in place.
- **macOS:** default `/Applications/Stash.app`.
- **User data:** `%APPDATA%\com.stash.desktop` and `~/Library/Application Support/com.stash.desktop`. These sit outside the install folder and are never touched except by the explicit uninstall option "Also delete my notes" (unticked by default).
- **Manifest:** `<install dir>/.stash-install.json` holds `{ version, installedAt, options }`. On Windows the same version is also written to the Apps & Features entry (`DisplayVersion`).

## Install flow

1. **Close running Stash:** a graceful close request with a 5 s timeout; if it times out, the UI asks the user to close it, with a Retry button.
2. **Migrate legacy:** for `MigrateLegacy`, run the old NSIS uninstaller with `/S` and wait. User data is unaffected.
3. **Extract** the payload into a staging folder `<install dir>.staging` next to the target, emitting byte-level progress.
4. **Swap:** rename the existing install to `<install dir>.old`, then rename staging to the install dir. If the second rename fails, rename `.old` back.
5. **Integrate:** create the chosen shortcuts, launch-at-login entry and Apps & Features entry, and copy the setup binary to `<install dir>/uninstall.exe` (Windows) or into the app's Resources folder (macOS).
6. **Write the manifest.**
7. **Clean up:** delete `.old`.

### Error handling

| When | Behavior |
|---|---|
| Before step 4 fails | Delete staging, nothing changed. Show the error screen with Retry. |
| Step 4 fails | Roll back the rename and show the error screen with Retry. |
| Steps 5–6 fail | The install still counts as successful. The Done screen lists items that didn't complete (e.g. "Couldn't create desktop shortcut"). |
| Not enough disk space | Checked on the Options screen; Install is disabled with a message. |
| Folder can't be written | Checked when the folder is chosen; Install is disabled with a message. |
| WebView2 missing (Windows) | Before the webview starts, a native `MessageBox` offers to download and run the Evergreen bootstrapper, then relaunches the setup. Declining exits with code 2. |

### Uninstall

Started from Apps & Features (`uninstall.exe --uninstall`), from the macOS Resources copy, or by running the setup when Stash is already installed and choosing Remove. It uses the same window with a "Remove Stash" screen and an "Also delete my notes" option (unticked). It closes Stash, removes the shortcuts, launch-at-login entry and Apps & Features entry, then the install folder. On Windows the uninstaller deletes itself after it exits, via a delayed `cmd /c` delete.

### Silent mode

`--silent` runs with no UI and logs to `%TEMP%\stash-setup.log` (or `$TMPDIR` on macOS). Exit codes: 0 success, 1 failure, 2 WebView2 declined (Windows only), 3 Stash still running.

## UI

The wizard window is 640×420, fixed size, with a frameless custom title bar showing minimize and close. Its visual tokens are imported from the app, so light mode only.

- **Welcome:** logo, "Welcome to Stash", one-line description, version and size, Continue. In Update or Repair mode this screen becomes "Update to X.Y.Z" or "Repair Stash", with a secondary "Remove" link.
- **Options:** install folder with a Change button, which opens the native folder picker. On Windows: desktop shortcut (on), Start Menu (on) and launch at login (off). On macOS: launch at login only. Shows the disk space needed and free. Install button.
- **Installing:** progress bar plus a label for the current step.
- **Done:** "Stash is ready", any items that didn't complete, and an "Open Stash" button (primary) next to Close.
- **Step dots** appear on Welcome, Options and Installing.

## Build and release

Changes to `release.yml`, per platform:

1. Build Stash with `tauri build --no-bundle` on Windows; on macOS, `--bundles app` with the universal target.
2. Archive the output with zstd into `installer/src-tauri/payload/` (Windows: `stash.exe` plus resources; macOS: `Stash.app`).
3. Build Stash Setup. Windows produces `Stash-Setup-<ver>.exe`, the setup program itself. macOS produces `Stash-Setup-<ver>.dmg`, containing "Install Stash.app" on a light indigo DMG background.
4. When signing is configured, the existing Azure Trusted Signing step signs both `stash.exe` (before archiving) and the setup exe. macOS stays unsigned for now, so the existing release note about Gatekeeper stays.
5. Upload to the draft release. The Windows signature check now looks at the setup exe.

The installer version is read from `src-tauri/tauri.conf.json`. A `build.rs` check fails the build if `installer/src-tauri/tauri.conf.json` doesn't match it.

## Website

- `website/src/lib/os-detect.ts`: Windows primary installer → `Stash-Setup-<ver>.exe`; remove `secondaryInstaller` (the MSI); macOS → `Stash-Setup-<ver>.dmg`; update sizes.
- `website/src/components/download-matrix.tsx`: remove the MSI button; update the SHA256 prefixes from the new release assets.

## Testing

- **Rust unit tests:** `detect` decisions (fresh, update, repair, legacy migration) using fixture manifests and registry abstractions; the install transaction's swap and rollback against a temp dir, including injected failures at each step; version comparison; CLI parsing.
- **Vitest:** wizard step transitions, and how the UI reacts to progress, partial-failure and error events, with Tauri commands mocked.
- **CI smoke test (windows-latest):** `Stash-Setup.exe --silent --dir %TEMP%\stash-it`, then assert `stash.exe` and the Apps & Features key exist; `uninstall.exe --uninstall --silent`, then assert both are gone.
- **Manual checks before the first release:** a clean Windows 10 VM without WebView2; updating over an existing NSIS v0.1.1 install; a macOS install from the DMG and launching the app.

## Out of scope

- Code signing and notarization for macOS.
- Auto-updates from inside Stash (a separate feature).
- Dark mode for the installer.
- Linux packaging.
- Publishing to winget (the `--silent` flag makes it possible later).
