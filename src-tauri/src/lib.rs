mod errors;
mod models;
mod db;
mod repositories;
mod commands;
#[cfg(test)]
mod tests;

use std::fs;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    Manager,
};
use db::DbState;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

/// Persist a new stash and hand back its id.
///
/// Kept separate from `quick_capture` so the database guard is provably
/// released before any `.await` — a `MutexGuard` must never cross one.
fn create_quick_note(handle: &tauri::AppHandle) -> Option<String> {
    let db = handle.try_state::<DbState>()?;
    let conn = match db.conn.lock() {
        Ok(conn) => conn,
        Err(_) => {
            log::error!("quick capture aborted: database lock poisoned");
            return None;
        }
    };

    let settings = repositories::SettingsRepository::get(&conn).unwrap_or_default();
    let new_id = uuid::Uuid::new_v4().to_string();

    match repositories::NoteRepository::create(
        &conn,
        models::CreateNoteInput {
            id: Some(new_id.clone()),
            title: None,
            content_json: None,
            plain_text: None,
            color: Some(settings.default_color),
            is_pinned: None,
            is_favorite: None,
            tag_names: None,
        },
    ) {
        Ok(_) => Some(new_id),
        Err(e) => {
            log::error!("quick capture failed to create stash: {}", e);
            None
        }
    }
}

/// Create a stash and immediately open it as a floating window.
pub(crate) async fn quick_capture(handle: tauri::AppHandle) {
    let Some(new_id) = create_quick_note(&handle) else {
        return;
    };

    if let Err(e) =
        commands::open_floating_stash(handle.clone(), handle.state::<DbState>(), new_id).await
    {
        log::error!("quick capture could not open the stash window: {}", e);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            // Setup SQLite DB in AppData
            let app_data_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("."));
            fs::create_dir_all(&app_data_dir).ok();
            let db_path = app_data_dir.join("stash.db");
            log::info!("Stash SQLite path: {:?}", db_path);

            let db_state = DbState::new(db_path)
                .expect("Failed to initialize SQLite database migrations");
            app.manage(db_state);

            // Setup Tray Menu
            let quit_i = MenuItem::with_id(app, "quit", "Quit Stash", true, None::<&str>)?;
            let quick_stash_i = MenuItem::with_id(app, "quick_stash", "Quick Stash", true, None::<&str>)?;
            let open_stash_i = MenuItem::with_id(app, "open_stash", "Open Stash", true, None::<&str>)?;
            let tray_menu = Menu::with_items(
                app,
                &[&quick_stash_i, &open_stash_i, &quit_i],
            )?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "quick_stash" => {
                        let handle = app.clone();
                        let _ = tauri::async_runtime::spawn(async move {
                            quick_capture(handle).await;
                        });
                    }
                    "open_stash" => {
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.show();
                            let _ = win.unminimize();
                            let _ = win.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: tauri::tray::MouseButton::Left,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.show();
                            let _ = win.unminimize();
                            let _ = win.set_focus();
                        }
                    }
                })
                .build(app)?;

            // Register global shortcut from persisted settings
            let app_handle = app.handle().clone();
            let shortcut_str = {
                let db = app.state::<DbState>();
                let s = match db.conn.lock() {
                    Ok(conn) => repositories::SettingsRepository::get(&conn)
                        .map(|s| s.global_shortcut)
                        .unwrap_or_else(|_| "CommandOrControl+Shift+N".to_string()),
                    Err(_) => "CommandOrControl+Shift+N".to_string(),
                };
                s
            };
            if let Ok(shortcut) = shortcut_str.parse::<tauri_plugin_global_shortcut::Shortcut>() {
                let _ = app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        let handle = app_handle.clone();
                        tauri::async_runtime::spawn(async move {
                            quick_capture(handle).await;
                        });
                    }
                });
            }

            // Ensure main window is shown and focused on startup
            if let Some(win) = app.get_webview_window("main") {
                if let Some(icon) = app.default_window_icon() {
                    let _ = win.set_icon(icon.clone());
                }
                let _ = win.show();
                let _ = win.unminimize();
                let _ = win.set_focus();
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::create_note,
            commands::get_note,
            commands::list_notes,
            commands::update_note,
            commands::set_note_archived,
            commands::trash_note,
            commands::restore_note,
            commands::delete_note_permanently,
            commands::empty_trash,
            commands::duplicate_note,
            commands::search_notes,
            commands::list_tags,
            commands::create_tag,
            commands::delete_tag,
            commands::add_tag_to_note,
            commands::remove_tag_from_note,
            commands::create_revision_checkpoint,
            commands::list_revisions,
            commands::restore_revision,
            commands::get_window_state,
            commands::persist_window_state,
            commands::set_note_window_closed,
            commands::open_floating_stash,
            commands::close_floating_stash,
            commands::set_note_always_on_top,
            commands::get_settings,
            commands::update_settings,
            commands::update_global_shortcut,
            commands::export_data,
            commands::import_data,
            commands::open_pip_browser_window,
            commands::close_pip_browser_window,
            commands::minimize_current_window,
            commands::toggle_maximize_current_window,
            commands::toggle_fullscreen_current_window,
            commands::close_current_window_cmd,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Stash application");
}
