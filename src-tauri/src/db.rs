use rusqlite::{params, Connection};
use std::path::Path;
use std::sync::Mutex;
use uuid::Uuid;
use chrono::Utc;
use crate::errors::{AppError, AppResult};

/// Turn a legacy `todoList` document into the stash envelope plus plain text.
///
/// Checked state and item order survive. The `☐` / `☑` prefixes do not: search
/// and card previews read the same words the editor shows. Returns `None` when
/// the payload is not a checklist, so a row is never rewritten into garbage.
pub fn convert_todo_list(content_json: &str) -> Option<(String, String)> {
    let parsed: serde_json::Value = serde_json::from_str(content_json).ok()?;
    let (list, widgets) = if parsed.get("type").and_then(|t| t.as_str()) == Some("todoList") {
        (parsed, serde_json::json!([]))
    } else if parsed.get("type").and_then(|t| t.as_str()) == Some("stashDoc")
        && parsed
            .get("doc")
            .and_then(|d| d.get("type"))
            .and_then(|t| t.as_str())
            == Some("todoList")
    {
        let widgets = parsed
            .get("widgets")
            .cloned()
            .unwrap_or_else(|| serde_json::json!([]));
        (parsed.get("doc")?.clone(), widgets)
    } else {
        return None;
    };

    let items = list.get("items").and_then(|i| i.as_array())?;
    let mut task_items = Vec::with_capacity(items.len());
    let mut lines = Vec::with_capacity(items.len());

    for item in items {
        let text = item.get("text").and_then(|t| t.as_str()).unwrap_or("");
        let done = item.get("done").and_then(|d| d.as_bool()).unwrap_or(false);
        lines.push(text.to_string());

        let paragraph = if text.is_empty() {
            serde_json::json!({ "type": "paragraph" })
        } else {
            serde_json::json!({
                "type": "paragraph",
                "content": [{ "type": "text", "text": text }]
            })
        };
        task_items.push(serde_json::json!({
            "type": "taskItem",
            "attrs": { "checked": done },
            "content": [paragraph]
        }));
    }

    let doc = if task_items.is_empty() {
        serde_json::json!({ "type": "doc", "content": [] })
    } else {
        serde_json::json!({
            "type": "doc",
            "content": [{ "type": "taskList", "content": task_items }]
        })
    };
    let envelope = serde_json::json!({
        "type": "stashDoc",
        "doc": doc,
        "widgets": widgets
    });
    Some((envelope.to_string(), lines.join("\n")))
}

pub struct DbState {
    pub conn: Mutex<Connection>,
}

impl DbState {
    pub fn new<P: AsRef<Path>>(db_path: P) -> AppResult<Self> {
        let conn = Connection::open(db_path)?;
        let state = Self {
            conn: Mutex::new(conn),
        };
        state.run_migrations()?;
        state.seed_starter_data_if_empty()?;
        Ok(state)
    }

    pub fn new_in_memory() -> AppResult<Self> {
        let conn = Connection::open_in_memory()?;
        let state = Self {
            conn: Mutex::new(conn),
        };
        state.run_migrations()?;
        Ok(state)
    }

    pub fn run_migrations(&self) -> AppResult<()> {
        let conn = self.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;

        // Enable WAL mode and foreign keys for performance and consistency
        conn.execute_batch(
            "PRAGMA journal_mode = WAL;
             PRAGMA synchronous = NORMAL;
             PRAGMA foreign_keys = ON;"
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL
            );",
            [],
        )?;

        let current_version: i64 = conn
            .query_row(
                "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0);

        if current_version < 1 {
            conn.execute_batch(
                "BEGIN;
                CREATE TABLE IF NOT EXISTS notes (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL DEFAULT '',
                    content_json TEXT NOT NULL DEFAULT '{\"type\":\"doc\",\"content\":[]}',
                    plain_text TEXT NOT NULL DEFAULT '',
                    color TEXT NOT NULL DEFAULT 'Paper',
                    is_pinned INTEGER NOT NULL DEFAULT 0,
                    is_favorite INTEGER NOT NULL DEFAULT 0,
                    is_archived INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    deleted_at TEXT,
                    sort_index INTEGER,
                    version INTEGER NOT NULL DEFAULT 1
                );

                CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
                CREATE INDEX IF NOT EXISTS idx_notes_is_archived ON notes(is_archived);
                CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON notes(deleted_at);
                CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON notes(is_pinned);

                CREATE TABLE IF NOT EXISTS tags (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL UNIQUE,
                    color TEXT,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS note_tags (
                    note_id TEXT NOT NULL,
                    tag_id TEXT NOT NULL,
                    PRIMARY KEY (note_id, tag_id),
                    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
                    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS window_states (
                    note_id TEXT PRIMARY KEY,
                    x INTEGER,
                    y INTEGER,
                    width INTEGER NOT NULL DEFAULT 500,
                    height INTEGER NOT NULL DEFAULT 580,
                    always_on_top INTEGER NOT NULL DEFAULT 0,
                    is_open INTEGER NOT NULL DEFAULT 0,
                    monitor_id TEXT,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS revisions (
                    id TEXT PRIMARY KEY,
                    note_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    content_json TEXT NOT NULL,
                    plain_text TEXT NOT NULL,
                    version INTEGER NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS idx_revisions_note_id ON revisions(note_id, version DESC);

                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );

                INSERT INTO schema_migrations (version, applied_at)
                VALUES (1, datetime('now'));
                COMMIT;",
            )?;
        }

        // Migration 2: FTS5 full-text search table
        if current_version < 2 {
            let fts_result = conn.execute_batch(
                "CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
                    id UNINDEXED,
                    title,
                    plain_text,
                    tokenize='porter unicode61'
                );

                INSERT OR IGNORE INTO notes_fts (id, title, plain_text)
                SELECT id, title, plain_text FROM notes WHERE deleted_at IS NULL;
                
                CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
                    INSERT INTO notes_fts (id, title, plain_text)
                    VALUES (new.id, new.title, new.plain_text);
                END;

                CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
                    DELETE FROM notes_fts WHERE id = old.id;
                END;

                CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
                    DELETE FROM notes_fts WHERE id = old.id;
                    INSERT INTO notes_fts (id, title, plain_text)
                    VALUES (new.id, new.title, new.plain_text);
                END;

                INSERT INTO schema_migrations (version, applied_at)
                VALUES (2, datetime('now'));"
            );

            if let Err(e) = fts_result {
                log::warn!("FTS5 table creation skipped or unsupported: {}", e);
            }
        }

        // Migration 3: note kind ("Note" | "Todo") so a stash can be a checklist
        if current_version < 3 {
            // Older databases already have rows; the default keeps them free-form notes.
            let already_present = conn
                .prepare("SELECT kind FROM notes LIMIT 1")
                .is_ok();

            if !already_present {
                conn.execute(
                    "ALTER TABLE notes ADD COLUMN kind TEXT NOT NULL DEFAULT 'Note'",
                    [],
                )?;
            }

            conn.execute(
                "INSERT INTO schema_migrations (version, applied_at) VALUES (3, datetime('now'))",
                [],
            )?;
        }

        // Migration 4: a stash is a stash. Checklist rows become Tiptap task
        // lists. The `kind` column stays (dropping it would rebuild the table
        // and the FTS triggers) but nothing reads it after this.
        if current_version < 4 {
            let rows: Vec<(String, String)> = {
                let mut stmt = conn.prepare(
                    "SELECT id, content_json FROM notes WHERE kind = 'Todo'",
                )?;
                let mapped = stmt.query_map([], |row| Ok((row.get(0)?, row.get(1)?)))?;
                mapped.collect::<Result<Vec<_>, _>>()?
            };

            for (id, content_json) in rows {
                if let Some((next_json, plain)) = convert_todo_list(&content_json) {
                    conn.execute(
                        "UPDATE notes SET content_json = ?1, plain_text = ?2, kind = 'Note' WHERE id = ?3",
                        params![next_json, plain, id],
                    )?;
                } else {
                    conn.execute(
                        "UPDATE notes SET kind = 'Note' WHERE id = ?1",
                        params![id],
                    )?;
                }
            }

            conn.execute(
                "INSERT INTO schema_migrations (version, applied_at) VALUES (4, datetime('now'))",
                [],
            )?;
        }

        Ok(())
    }

    pub fn seed_starter_data_if_empty(&self) -> AppResult<()> {
        let conn = self.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;

        // Seed initial friendly starter notes if workspace is completely empty
        let note_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM notes", [], |row| row.get(0))
            .unwrap_or(0);

        if note_count == 0 {
            let now = Utc::now().to_rfc3339();
            let swap_id = Uuid::new_v4().to_string();
            let welcome_id = Uuid::new_v4().to_string();
            let tag_swap_id = Uuid::new_v4().to_string();
            let tag_crypto_id = Uuid::new_v4().to_string();
            let tag_guide_id = Uuid::new_v4().to_string();

            // Insert tags
            let _ = conn.execute(
                "INSERT OR IGNORE INTO tags (id, name, color, created_at) VALUES (?1, 'swap', '#10b981', ?2)",
                rusqlite::params![tag_swap_id, now],
            );
            let _ = conn.execute(
                "INSERT OR IGNORE INTO tags (id, name, color, created_at) VALUES (?1, 'crypto', '#3b82f6', ?2)",
                rusqlite::params![tag_crypto_id, now],
            );
            let _ = conn.execute(
                "INSERT OR IGNORE INTO tags (id, name, color, created_at) VALUES (?1, 'guide', '#8b5cf6', ?2)",
                rusqlite::params![tag_guide_id, now],
            );

            // 1. Swap note
            let swap_plain = "[swap-widget]\n\nInteractive crypto token swap calculator powered by notboring.dev design spec.\n\n• Live numerical exchange calculation\n• Spring coin flip with tokens trading places\n• Interactive draggable slide-to-swap track\n• Instant transaction receipts logged to note\n\nRecent Transactions:\n• Ready for simulation";
            let _ = conn.execute(
                "INSERT INTO notes (
                    id, title, content_json, plain_text, color,
                    is_pinned, is_favorite, is_archived, created_at,
                    updated_at, deleted_at, sort_index, version
                ) VALUES (?1, '⚡ ETH / USDC Swap', '{\"type\":\"doc\",\"content\":[]}', ?2, 'Mint', 1, 1, 0, ?3, ?3, NULL, 0, 1)",
                rusqlite::params![swap_id, swap_plain, now],
            );

            let _ = conn.execute(
                "INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?1, ?2), (?1, ?3)",
                rusqlite::params![swap_id, tag_swap_id, tag_crypto_id],
            );

            // 2. Welcome note
            let welcome_plain = "Capture it. Stash it. Find it instantly.\n\n• Press ⌘⇧N (Ctrl+Shift+N) anywhere to quick-capture a thought.\n• Pin stashes to float above your work in always-on-top mode.\n• Search across all stashes with instant full-text indexing.\n• Use '/' slash commands in any note to insert blocks like the Swap widget.";
            let _ = conn.execute(
                "INSERT INTO notes (
                    id, title, content_json, plain_text, color,
                    is_pinned, is_favorite, is_archived, created_at,
                    updated_at, deleted_at, sort_index, version
                ) VALUES (?1, 'Welcome to Stash', '{\"type\":\"doc\",\"content\":[]}', ?2, 'Paper', 1, 0, 0, ?3, ?3, NULL, 1, 1)",
                rusqlite::params![welcome_id, welcome_plain, now],
            );

            let _ = conn.execute(
                "INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?1, ?2)",
                rusqlite::params![welcome_id, tag_guide_id],
            );

            // 3. A starter stash that already contains a checklist, so the
            // To-dos section is demonstrating the unified document on day one.
            let todo_id = Uuid::new_v4().to_string();
            let todo_content = serde_json::json!({
                "type": "stashDoc",
                "doc": {
                    "type": "doc",
                    "content": [{
                        "type": "taskList",
                        "content": [
                            {
                                "type": "taskItem",
                                "attrs": { "checked": true },
                                "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Press Ctrl+Shift+N to capture from anywhere" }] }]
                            },
                            {
                                "type": "taskItem",
                                "attrs": { "checked": false },
                                "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Keep this list on top while you work" }] }]
                            },
                            {
                                "type": "taskItem",
                                "attrs": { "checked": false },
                                "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Tick something off — it feels good" }] }]
                            }
                        ]
                    }]
                },
                "widgets": []
            })
            .to_string();
            let todo_plain = "Press Ctrl+Shift+N to capture from anywhere\nKeep this list on top while you work\nTick something off — it feels good";

            let _ = conn.execute(
                "INSERT INTO notes (
                    id, title, content_json, plain_text, color, kind,
                    is_pinned, is_favorite, is_archived, created_at,
                    updated_at, deleted_at, sort_index, version
                ) VALUES (?1, 'Today', ?2, ?3, 'Sky', 'Note', 0, 0, 0, ?4, ?4, NULL, 2, 1)",
                rusqlite::params![todo_id, todo_content, todo_plain, now],
            );

            let _ = conn.execute(
                "INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?1, ?2)",
                rusqlite::params![todo_id, tag_guide_id],
            );

            let _ = conn.execute(
                "INSERT OR IGNORE INTO window_states (note_id, x, y, width, height, always_on_top, is_open, monitor_id, updated_at)
                 VALUES (?1, NULL, NULL, 380, 460, 0, 0, NULL, ?2)",
                rusqlite::params![todo_id, now],
            );

            // Window states
            let _ = conn.execute(
                "INSERT OR IGNORE INTO window_states (note_id, x, y, width, height, always_on_top, is_open, monitor_id, updated_at)
                 VALUES (?1, NULL, NULL, 360, 520, 1, 0, NULL, ?2)",
                rusqlite::params![swap_id, now],
            );
            let _ = conn.execute(
                "INSERT OR IGNORE INTO window_states (note_id, x, y, width, height, always_on_top, is_open, monitor_id, updated_at)
                 VALUES (?1, NULL, NULL, 360, 360, 0, 0, NULL, ?2)",
                rusqlite::params![welcome_id, now],
            );
        }

        Ok(())
    }
}
