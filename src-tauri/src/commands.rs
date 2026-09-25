use tauri::{AppHandle, Emitter, Manager, State, WebviewUrl, WebviewWindowBuilder};
use crate::db::DbState;
use crate::errors::{AppError, AppResult};
use crate::models::{
    CreateNoteInput, ExportData, Note, NoteWindowState, Revision, Settings, Tag, UpdateNoteInput,
};
use crate::repositories::{
    NoteRepository, RevisionRepository, SettingsRepository, TagRepository, WindowRepository,
};

#[tauri::command]
pub fn create_note(
    app: AppHandle,
    db: State<'_, DbState>,
    input: CreateNoteInput,
) -> AppResult<Note> {
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let note = NoteRepository::create(&conn, input)?;
    let _ = app.emit("stash://note-updated", &note.id);
    Ok(note)
}

#[tauri::command]
pub fn get_note(
    db: State<'_, DbState>,
    id: String,
) -> AppResult<Option<Note>> {
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    NoteRepository::get_by_id(&conn, &id)
}

#[tauri::command]
pub fn list_notes(
    db: State<'_, DbState>,
    section: Option<String>,
    tag_id: Option<String>,
    color: Option<String>,
) -> AppResult<Vec<Note>> {
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let sec = section.as_deref().unwrap_or("all");
    NoteRepository::list(&conn, sec, tag_id.as_deref(), color.as_deref())
}

#[tauri::command]
pub fn update_note(
    app: AppHandle,
    db: State<'_, DbState>,
    input: UpdateNoteInput,
) -> AppResult<Note> {
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let note = NoteRepository::update(&conn, input)?;
    let _ = app.emit("stash://note-updated", &note.id);
    Ok(note)
}

#[tauri::command]
pub fn set_note_archived(
    app: AppHandle,
    db: State<'_, DbState>,
    id: String,
    archived: bool,
) -> AppResult<()> {
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    NoteRepository::set_archived(&conn, &id, archived)?;
    let _ = app.emit("stash://note-updated", &id);
    Ok(())
}

#[tauri::command]
pub fn trash_note(
    app: AppHandle,
    db: State<'_, DbState>,
    id: String,
) -> AppResult<()> {
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    NoteRepository::soft_delete(&conn, &id)?;
    let _ = app.emit("stash://note-deleted", &id);
    Ok(())
}

#[tauri::command]
pub fn restore_note(
    app: AppHandle,
    db: State<'_, DbState>,
    id: String,
) -> AppResult<()> {
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    NoteRepository::restore_trash(&conn, &id)?;
    let _ = app.emit("stash://note-updated", &id);
    Ok(())
}

#[tauri::command]
pub fn delete_note_permanently(
    app: AppHandle,
    db: State<'_, DbState>,
    id: String,
) -> AppResult<()> {
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    NoteRepository::delete_permanently(&conn, &id)?;
    let _ = app.emit("stash://note-deleted", &id);
    Ok(())
}

#[tauri::command]
pub fn empty_trash(
    app: AppHandle,
    db: State<'_, DbState>,
) -> AppResult<()> {
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    NoteRepository::empty_trash(&conn)?;
    let _ = app.emit("stash://refresh-all", ());
    Ok(())
}

#[tauri::command]
pub fn duplicate_note(
    app: AppHandle,
    db: State<'_, DbState>,
    id: String,
) -> AppResult<Note> {
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let note = NoteRepository::duplicate(&conn, &id)?;
    let _ = app.emit("stash://note-updated", &note.id);
    Ok(note)
}

#[tauri::command]
pub fn search_notes(
    db: State<'_, DbState>,
    query: String,
    include_archived: Option<bool>,
) -> AppResult<Vec<Note>> {
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    NoteRepository::search(&conn, &query, include_archived.unwrap_or(false))
}

#[tauri::command]
pub fn list_tags(
    db: State<'_, DbState>,
) -> AppResult<Vec<Tag>> {
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    TagRepository::list(&conn)
}

#[tauri::command]
pub fn create_tag(
    db: State<'_, DbState>,
    name: String,
    color: Option<String>,
) -> AppResult<Tag> {
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    TagRepository::get_or_create(&conn, &name, color.as_deref())
}

#[tauri::command]
pub fn delete_tag(
    app: AppHandle,
    db: State<'_, DbState>,
    id: String,
) -> AppResult<()> {
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    TagRepository::delete(&conn, &id)?;
    let _ = app.emit("stash://refresh-all", ());
    Ok(())
}

#[tauri::command]
pub fn add_tag_to_note(
    app: AppHandle,
    db: State<'_, DbState>,
    note_id: String,
    tag_id: String,
) -> AppResult<()> {
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    TagRepository::add_to_note(&conn, &note_id, &tag_id)?;
    let _ = app.emit("stash://note-updated", &note_id);
    Ok(())
}

#[tauri::command]
pub fn remove_tag_from_note(
    app: AppHandle,
    db: State<'_, DbState>,
    note_id: String,
    tag_id: String,
) -> AppResult<()> {
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    TagRepository::remove_from_note(&conn, &note_id, &tag_id)?;
    let _ = app.emit("stash://note-updated", &note_id);
    Ok(())
}

#[tauri::command]
pub fn create_revision_checkpoint(
    db: State<'_, DbState>,
    note_id: String,
) -> AppResult<()> {
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    if let Some(note) = NoteRepository::get_by_id(&conn, &note_id)? {
        RevisionRepository::record(&conn, &note)?;
    }
    Ok(())
}

#[tauri::command]
pub fn list_revisions(
    db: State<'_, DbState>,
    note_id: String,
) -> AppResult<Vec<Revision>> {
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    RevisionRepository::list_by_note(&conn, &note_id)
}

#[tauri::command]
pub fn restore_revision(
    app: AppHandle,
    db: State<'_, DbState>,
    note_id: String,
    revision_id: String,
) -> AppResult<Note> {
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let note = RevisionRepository::restore(&conn, &note_id, &revision_id)?;
    let _ = app.emit("stash://note-updated", &note_id);
    Ok(note)
}

#[tauri::command]
pub fn get_window_state(
    db: State<'_, DbState>,
    note_id: String,
) -> AppResult<Option<NoteWindowState>> {
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    WindowRepository::get(&conn, &note_id)
}

#[tauri::command]
pub fn persist_window_state(
    db: State<'_, DbState>,
    window_state: NoteWindowState,
) -> AppResult<()> {
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    WindowRepository::save(&conn, &window_state)
}

#[tauri::command]
pub fn set_note_window_closed(
    db: State<'_, DbState>,
    note_id: String,
) -> AppResult<()> {
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    WindowRepository::set_open(&conn, &note_id, false)
}

/// Open (or focus) the floating window for a note.
///
/// This command is deliberately `async`. Building a webview has to hand work
/// to the platform event loop, and a *synchronous* command runs on the main
/// thread — on Windows that deadlocks and the new window never paints, which
/// looks exactly like a blank white window. Async commands run off the main
/// thread, so the event loop stays free to finish creating the webview.
#[tauri::command]
pub async fn open_floating_stash(
    app: AppHandle,
    db: State<'_, DbState>,
    note_id: String,
) -> AppResult<()> {
    let label = format!("stash-{}", note_id);

    // If window already exists, focus it and bring it to front!
    if let Some(win) = app.get_webview_window(&label) {
        let _ = win.unminimize();
        let _ = win.show();
        let _ = win.set_focus();
        return Ok(());
    }

    // Load persisted window state or defaults
    let window_state = {
        let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
        WindowRepository::get(&conn, &note_id)?
    };

    let (default_width, default_height) = (580.0, 640.0);
    let (mut width, mut height) = match window_state.as_ref() {
        Some(s) => {
            // Upgrade legacy or cramped stash windows to comfortable modern dimensions
            let w = if s.width < 520 {
                default_width
            } else {
                s.width as f64
            };
            let h = if s.height < 540 {
                default_height
            } else {
                s.height as f64
            };
            (w, h)
        }
        None => (default_width, default_height),
    };
    width = width.clamp(360.0, 1600.0);
    height = height.clamp(300.0, 1400.0);
    let always_on_top = window_state.as_ref().map(|s| s.always_on_top).unwrap_or(false);

    let url_str = format!("/?window=stash&noteId={}", note_id);
    let webview_url = WebviewUrl::App(url_str.parse().map_err(|e| AppError::Internal(format!("{:?}", e)))?);

    let mut builder = WebviewWindowBuilder::new(&app, &label, webview_url)
        .title("Stash")
        .inner_size(width, height)
        .min_inner_size(280.0, 36.0)
        .always_on_top(always_on_top)
        .decorations(false)
        .transparent(false)
        .shadow(true)
        .zoom_hotkeys_enabled(true)
        .focused(true);

    // If persisted x, y are valid, position it
    if let Some(ref state) = window_state {
        if let (Some(x), Some(y)) = (state.x, state.y) {
            // Keep window within reasonable desktop bounds
            if x >= -200 && y >= -100 && x < 10000 && y < 10000 {
                builder = builder.position(x as f64, y as f64);
            }
        }
    }

    let win = builder.build().map_err(|e| AppError::Window(e.to_string()))?;
    if let Some(icon) = app.default_window_icon() {
        let _ = win.set_icon(icon.clone());
    }

    // Mark window as open in persistence
    {
        let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
        let _ = WindowRepository::set_open(&conn, &note_id, true);
    }

    Ok(())
}

/// Async for the same reason as `open_floating_stash`: closing a window is
/// event-loop work and must not block the main thread.
#[tauri::command]
pub async fn close_floating_stash(
    app: AppHandle,
    db: State<'_, DbState>,
    note_id: String,
) -> AppResult<()> {
    let label = format!("stash-{}", note_id);
    if let Some(win) = app.get_webview_window(&label) {
        let _ = win.close();
    }

    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    WindowRepository::set_open(&conn, &note_id, false)?;
    Ok(())
}

#[tauri::command]
pub async fn set_note_always_on_top(
    app: AppHandle,
    db: State<'_, DbState>,
    note_id: String,
    always_on_top: bool,
) -> AppResult<()> {
    let label = format!("stash-{}", note_id);
    if let Some(win) = app.get_webview_window(&label) {
        win.set_always_on_top(always_on_top)
            .map_err(|e| AppError::Window(e.to_string()))?;
    }

    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    if let Some(mut state) = WindowRepository::get(&conn, &note_id)? {
        state.always_on_top = always_on_top;
        WindowRepository::save(&conn, &state)?;
    }
    Ok(())
}

#[tauri::command]
pub fn get_settings(
    db: State<'_, DbState>,
) -> AppResult<Settings> {
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    SettingsRepository::get(&conn)
}

#[tauri::command]
pub fn update_settings(
    app: AppHandle,
    db: State<'_, DbState>,
    settings: Settings,
) -> AppResult<()> {
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    SettingsRepository::save(&conn, &settings)?;
    let _ = app.emit("stash://settings-updated", &settings);
    Ok(())
}

#[tauri::command]
pub fn export_data(
    db: State<'_, DbState>,
) -> AppResult<ExportData> {
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let notes = NoteRepository::list(&conn, "all", None, None)?;
    let archived_notes = NoteRepository::list(&conn, "archive", None, None)?;
    let all_notes = [notes, archived_notes].concat();
    let tags = TagRepository::list(&conn)?;
    let window_states = WindowRepository::list_open(&conn)?;

    Ok(ExportData {
        version: "1.0.0".to_string(),
        exported_at: chrono::Utc::now().to_rfc3339(),
        notes: all_notes,
        tags,
        window_states,
    })
}

#[tauri::command]
pub fn import_data(
    app: AppHandle,
    db: State<'_, DbState>,
    data: ExportData,
) -> AppResult<()> {
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;

    // Import inside a transaction to prevent corruption
    conn.execute("BEGIN TRANSACTION", [])?;

    for note in data.notes {
        let tag_names: Vec<String> = note.tags.into_iter().map(|t| t.name).collect();
        let _ = NoteRepository::create(
            &conn,
            CreateNoteInput {
                id: Some(note.id),
                title: Some(note.title),
                content_json: Some(note.content_json),
                plain_text: Some(note.plain_text),
                color: Some(note.color),
                is_pinned: Some(note.is_pinned),
                is_favorite: Some(note.is_favorite),
                tag_names: Some(tag_names),
            },
        );
    }

    conn.execute("COMMIT", [])?;
    let _ = app.emit("stash://refresh-all", ());
    Ok(())
}

#[tauri::command]
pub async fn update_global_shortcut(
    app: AppHandle,
    db: State<'_, DbState>,
    shortcut_str: String,
) -> AppResult<()> {
    use tauri_plugin_global_shortcut::GlobalShortcutExt;
    use tauri_plugin_global_shortcut::ShortcutState;

    // Validate the shortcut format
    let new_shortcut = shortcut_str
        .parse::<tauri_plugin_global_shortcut::Shortcut>()
        .map_err(|e| AppError::Internal(format!("Invalid shortcut: {e}")))?;

    // Persist to database settings
    {
        let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
        let mut settings = SettingsRepository::get(&conn)?;
        settings.global_shortcut = shortcut_str.clone();
        SettingsRepository::save(&conn, &settings)?;
        let _ = app.emit("stash://settings-updated", &settings);
    }

    // Unregister old shortcuts and register new one
    let _ = app.global_shortcut().unregister_all();
    let app_handle = app.clone();
    let _ = app.global_shortcut().on_shortcut(new_shortcut, move |_app, _shortcut, event| {
        if event.state() == ShortcutState::Pressed {
            let handle = app_handle.clone();
            tauri::async_runtime::spawn(async move {
                crate::quick_capture(handle).await;
            });
        }
    });

    Ok(())
}


/// Opens or focuses the floating Picture-in-Picture Web Browser window
#[tauri::command]
pub async fn open_pip_browser_window(
    app: AppHandle,
    url: Option<String>,
    note_id: Option<String>,
    widget_id: Option<String>,
) -> AppResult<()> {
    let label = "stash-pip-browser".to_string();
    let target_url = url.unwrap_or_else(|| "https://www.youtube.com".to_string());
    let note_param = note_id.unwrap_or_default();
    let widget_param = widget_id.unwrap_or_default();

    let parsed_url: tauri::Url = if target_url.starts_with("http://") || target_url.starts_with("https://") {
        target_url.parse().map_err(|e| AppError::Internal(format!("{:?}", e)))?
    } else {
        format!("https://{}", target_url).parse().map_err(|e| AppError::Internal(format!("{:?}", e)))?
    };

    if let Some(win) = app.get_webview_window(&label) {
        let _ = win.unminimize();
        let _ = win.show();
        let _ = win.set_focus();
        let _ = win.navigate(parsed_url);
        return Ok(());
    }

    let webview_url = WebviewUrl::External(parsed_url);

    let app_handle_nav = app.clone();
    let note_id_nav = note_param.clone();
    let widget_id_nav = widget_param.clone();

    let win = WebviewWindowBuilder::new(&app, &label, webview_url)
        .title("Stash Picture-in-Picture")
        .inner_size(680.0, 420.0)
        .min_inner_size(320.0, 220.0)
        .always_on_top(true)
        .decorations(true)
        .shadow(true)
        .zoom_hotkeys_enabled(true)
        .focused(true)
        .on_navigation(move |nav_url| {
            let _ = app_handle_nav.emit("stash://pip-browser-url-changed", serde_json::json!({
                "url": nav_url.as_str(),
                "noteId": note_id_nav,
                "widgetId": widget_id_nav,
            }));
            true
        })
        .build()
        .map_err(|e| AppError::Window(e.to_string()))?;

    if let Some(icon) = app.default_window_icon() {
        let _ = win.set_icon(icon.clone());
    }

    let app_handle_close = app.clone();
    let note_id_close = note_param.clone();
    let widget_id_close = widget_param.clone();

    win.on_window_event(move |event| {
        if let tauri::WindowEvent::CloseRequested { .. } | tauri::WindowEvent::Destroyed = event {
            let _ = app_handle_close.emit("stash://dock-browser-widget", serde_json::json!({
                "noteId": note_id_close,
                "widgetId": widget_id_close,
            }));
        }
    });

    Ok(())
}

/// Closes the floating Picture-in-Picture Web Browser window
#[tauri::command]
pub async fn close_pip_browser_window(app: AppHandle) -> AppResult<()> {
    let label = "stash-pip-browser";
    if let Some(win) = app.get_webview_window(label) {
        let _ = win.close();
    }
    Ok(())
}

/// Minimizes the window that called this command.
#[tauri::command]
pub async fn minimize_current_window(window: tauri::Window) -> AppResult<()> {
    window.minimize().map_err(|e| AppError::Window(e.to_string()))?;
    Ok(())
}

/// Toggles maximize state of the window that called this command.
#[tauri::command]
pub async fn toggle_maximize_current_window(window: tauri::Window) -> AppResult<bool> {
    let is_max = window.is_maximized().map_err(|e| AppError::Window(e.to_string()))?;
    if is_max {
        window.unmaximize().map_err(|e| AppError::Window(e.to_string()))?;
        Ok(false)
    } else {
        window.maximize().map_err(|e| AppError::Window(e.to_string()))?;
        Ok(true)
    }
}

/// Toggles fullscreen state of the window that called this command.
#[tauri::command]
pub async fn toggle_fullscreen_current_window(window: tauri::Window) -> AppResult<bool> {
    let is_full = window.is_fullscreen().map_err(|e| AppError::Window(e.to_string()))?;
    window.set_fullscreen(!is_full).map_err(|e| AppError::Window(e.to_string()))?;
    Ok(!is_full)
}

/// Closes the window that called this command.
#[tauri::command]
pub async fn close_current_window_cmd(window: tauri::Window) -> AppResult<()> {
    window.close().map_err(|e| AppError::Window(e.to_string()))?;
    Ok(())
}

/// Returns the current PC username for personalized greetings.
#[tauri::command]
pub fn get_system_username() -> String {
    std::env::var("USERNAME")
        .or_else(|_| std::env::var("USER"))
        .unwrap_or_else(|_| "Friend".to_string())
}

/// Opens the operating system's microphone privacy settings (e.g. Windows Settings ms-settings:privacy-microphone).
#[tauri::command]
pub fn open_microphone_settings() -> AppResult<()> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        let res = std::process::Command::new("explorer")
            .arg("ms-settings:privacy-microphone")
            .creation_flags(CREATE_NO_WINDOW)
            .spawn();

        if res.is_err() {
            let _ = std::process::Command::new("cmd")
                .args(["/c", "start", "", "ms-settings:privacy-microphone"])
                .creation_flags(CREATE_NO_WINDOW)
                .spawn();
        }
    }
    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("open")
            .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone")
            .spawn();
    }
    #[cfg(target_os = "linux")]
    {
        let _ = std::process::Command::new("xdg-open")
            .arg("settings://privacy/microphone")
            .spawn();
    }
    Ok(())
}

/// Retrieves real-time PC hardware and Stash process performance diagnostics.
#[tauri::command]
pub async fn get_system_performance(
    app: AppHandle,
    perf: State<'_, crate::performance::PerformanceState>,
) -> Result<crate::performance::SystemPerformanceSnapshot, String> {
    Ok(crate::performance::collect_snapshot(&perf, &app))
}

/// Executes instant database compaction (VACUUM & PRAGMA optimize/shrink) and trims memory.
#[tauri::command]
pub async fn optimize_stash_system(
    app: AppHandle,
    db: State<'_, DbState>,
) -> Result<crate::performance::OptimizationResult, String> {
    crate::performance::optimize_stash_database(&app, &db)
}

/// Terminates a process by PID (used by performance app inspector).
#[tauri::command]
pub async fn kill_process(
    perf: State<'_, crate::performance::PerformanceState>,
    pid: u32,
) -> Result<bool, String> {
    crate::performance::kill_process_by_pid(&perf, pid)
}


