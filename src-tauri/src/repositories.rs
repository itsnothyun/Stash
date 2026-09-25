use rusqlite::{params, Connection, OptionalExtension};
use uuid::Uuid;
use chrono::Utc;
use crate::errors::{AppError, AppResult};
use crate::models::{
    CreateNoteInput, Note, NoteColor, NoteWindowState, Revision, Settings, Tag, UpdateNoteInput,
};

/// A new stash opens on an empty Tiptap document. Checklists are blocks inside
/// that document, not a separate kind of row.
const EMPTY_DOC: &str = "{\"type\":\"doc\",\"content\":[]}";

pub struct NoteRepository;

impl NoteRepository {
    pub fn create(conn: &Connection, input: CreateNoteInput) -> AppResult<Note> {
        let id = input.id.unwrap_or_else(|| Uuid::new_v4().to_string());
        let now = Utc::now().to_rfc3339();
        let title = input.title.unwrap_or_default();
        let content_json = input
            .content_json
            .unwrap_or_else(|| EMPTY_DOC.to_string());
        let plain_text = input.plain_text.unwrap_or_default();
        let color = input.color.unwrap_or_default().to_string();
        let is_pinned = if input.is_pinned.unwrap_or(false) { 1 } else { 0 };
        let is_favorite = if input.is_favorite.unwrap_or(false) { 1 } else { 0 };
        let is_archived = 0;
        let version = 1;

        conn.execute(
            "INSERT INTO notes (
                id, title, content_json, plain_text, color, kind,
                is_pinned, is_favorite, is_archived, created_at,
                updated_at, deleted_at, sort_index, version
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, NULL, NULL, ?12)",
            params![
                id,
                title,
                content_json,
                plain_text,
                color,
                "Note",
                is_pinned,
                is_favorite,
                is_archived,
                now,
                now,
                version
            ],
        )?;

        // Attach initial tags if provided
        if let Some(tag_names) = input.tag_names {
            for tag_name in tag_names {
                let trimmed = tag_name.trim();
                if !trimmed.is_empty() {
                    let tag = TagRepository::get_or_create(conn, trimmed, None)?;
                    TagRepository::add_to_note(conn, &id, &tag.id)?;
                }
            }
        }

        let (default_w, default_h) = (380, 380);
        let _ = conn.execute(
            "INSERT OR IGNORE INTO window_states (
                note_id, x, y, width, height, always_on_top, is_open, monitor_id, updated_at
            ) VALUES (?1, NULL, NULL, ?2, ?3, 0, 0, NULL, ?4)",
            params![id, default_w, default_h, now],
        );

        Self::get_by_id(conn, &id)?.ok_or_else(|| AppError::NotFound(id))
    }

    pub fn get_by_id(conn: &Connection, id: &str) -> AppResult<Option<Note>> {
        let note = conn.query_row(
            "SELECT id, title, content_json, plain_text, color,
                    is_pinned, is_favorite, is_archived, created_at,
                    updated_at, deleted_at, sort_index, version
             FROM notes WHERE id = ?1",
            params![id],
            |row| {
                let color_str: String = row.get(4)?;
                let is_pinned: i64 = row.get(5)?;
                let is_favorite: i64 = row.get(6)?;
                let is_archived: i64 = row.get(7)?;

                Ok(Note {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    content_json: row.get(2)?,
                    plain_text: row.get(3)?,
                    color: NoteColor::from(color_str.as_str()),
                    is_pinned: is_pinned == 1,
                    is_favorite: is_favorite == 1,
                    is_archived: is_archived == 1,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                    deleted_at: row.get(10)?,
                    sort_index: row.get(11)?,
                    version: row.get(12)?,
                    tags: Vec::new(),
                })
            },
        ).optional()?;

        if let Some(mut n) = note {
            n.tags = TagRepository::get_tags_for_note(conn, &n.id)?;
            Ok(Some(n))
        } else {
            Ok(None)
        }
    }

    pub fn list(
        conn: &Connection,
        section: &str,
        tag_id: Option<&str>,
        color: Option<&str>,
    ) -> AppResult<Vec<Note>> {
        let mut query = String::from(
            "SELECT n.id, n.title, n.content_json, n.plain_text, n.color,
                    n.is_pinned, n.is_favorite, n.is_archived, n.created_at,
                    n.updated_at, n.deleted_at, n.sort_index, n.version
             FROM notes n "
        );

        let mut conditions = Vec::new();
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(tid) = tag_id {
            query.push_str("INNER JOIN note_tags nt ON n.id = nt.note_id ");
            conditions.push("nt.tag_id = ?");
            params_vec.push(Box::new(tid.to_string()));
        }

        match section {
            "trash" => {
                conditions.push("n.deleted_at IS NOT NULL");
            }
            "archive" => {
                conditions.push("n.deleted_at IS NULL");
                conditions.push("n.is_archived = 1");
            }
            "pinned" => {
                conditions.push("n.deleted_at IS NULL");
                conditions.push("n.is_archived = 0");
                conditions.push("n.is_pinned = 1");
            }
            "favorites" => {
                conditions.push("n.deleted_at IS NULL");
                conditions.push("n.is_archived = 0");
                conditions.push("n.is_favorite = 1");
            }
            "todos" => {
                // Cheap prefilter. The library drops rows whose real task
                // count is zero, so a pasted JSON string cannot fake a hit.
                conditions.push("n.deleted_at IS NULL");
                conditions.push("n.is_archived = 0");
                conditions.push(
                    "(n.content_json LIKE '%\"type\":\"taskItem\"%' OR n.content_json LIKE '%\"type\":\"todoList\"%')",
                );
            }
            _ => {
                // "all" or general section
                conditions.push("n.deleted_at IS NULL");
                conditions.push("n.is_archived = 0");
            }
        }

        if let Some(c) = color {
            conditions.push("n.color = ?");
            params_vec.push(Box::new(c.to_string()));
        }

        if !conditions.is_empty() {
            query.push_str(" WHERE ");
            query.push_str(&conditions.join(" AND "));
        }

        query.push_str(" ORDER BY n.is_pinned DESC, n.updated_at DESC");

        let mut stmt = conn.prepare(&query)?;
        let param_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|b| b.as_ref()).collect();

        let rows = stmt.query_map(param_refs.as_slice(), |row| {
            let color_str: String = row.get(4)?;
            let is_pinned: i64 = row.get(5)?;
            let is_favorite: i64 = row.get(6)?;
            let is_archived: i64 = row.get(7)?;

            Ok(Note {
                id: row.get(0)?,
                title: row.get(1)?,
                content_json: row.get(2)?,
                plain_text: row.get(3)?,
                color: NoteColor::from(color_str.as_str()),
                is_pinned: is_pinned == 1,
                is_favorite: is_favorite == 1,
                is_archived: is_archived == 1,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
                deleted_at: row.get(10)?,
                sort_index: row.get(11)?,
                version: row.get(12)?,
                tags: Vec::new(),
            })
        })?;

        let mut notes = Vec::new();
        for r in rows {
            let mut note = r?;
            note.tags = TagRepository::get_tags_for_note(conn, &note.id)?;
            notes.push(note);
        }

        Ok(notes)
    }

    pub fn update(conn: &Connection, input: UpdateNoteInput) -> AppResult<Note> {
        let existing = Self::get_by_id(conn, &input.id)?
            .ok_or_else(|| AppError::NotFound(input.id.clone()))?;

        let now = Utc::now().to_rfc3339();
        let new_title = input.title.unwrap_or_else(|| existing.title.clone());
        let new_content_json = input.content_json.unwrap_or_else(|| existing.content_json.clone());
        let new_plain_text = input.plain_text.unwrap_or_else(|| existing.plain_text.clone());
        let new_color = input.color.map(|c| c.to_string()).unwrap_or_else(|| existing.color.to_string());
        let new_pinned = input.is_pinned.map(|p| if p { 1 } else { 0 }).unwrap_or(if existing.is_pinned { 1 } else { 0 });
        let new_favorite = input.is_favorite.map(|f| if f { 1 } else { 0 }).unwrap_or(if existing.is_favorite { 1 } else { 0 });
        let new_archived = input.is_archived.map(|a| if a { 1 } else { 0 }).unwrap_or(if existing.is_archived { 1 } else { 0 });
        let new_version = existing.version + 1;

        conn.execute(
            "UPDATE notes SET
                title = ?1,
                content_json = ?2,
                plain_text = ?3,
                color = ?4,
                is_pinned = ?5,
                is_favorite = ?6,
                is_archived = ?7,
                updated_at = ?8,
                version = ?9
             WHERE id = ?10",
            params![
                new_title,
                new_content_json,
                new_plain_text,
                new_color,
                new_pinned,
                new_favorite,
                new_archived,
                now,
                new_version,
                input.id
            ],
        )?;

        // Periodically or on significant changes, record revision
        if existing.version % 10 == 0 || (new_plain_text.len() as i64 - existing.plain_text.len() as i64).abs() > 40 {
            let _ = RevisionRepository::record(conn, &existing);
        }

        Self::get_by_id(conn, &input.id)?.ok_or_else(|| AppError::NotFound(input.id))
    }

    pub fn set_archived(conn: &Connection, id: &str, archived: bool) -> AppResult<()> {
        let now = Utc::now().to_rfc3339();
        let val = if archived { 1 } else { 0 };
        conn.execute(
            "UPDATE notes SET is_archived = ?1, updated_at = ?2 WHERE id = ?3",
            params![val, now, id],
        )?;
        Ok(())
    }

    pub fn soft_delete(conn: &Connection, id: &str) -> AppResult<()> {
        let now = Utc::now().to_rfc3339();
        conn.execute(
            "UPDATE notes SET deleted_at = ?1 WHERE id = ?2",
            params![now, id],
        )?;
        Ok(())
    }

    pub fn restore_trash(conn: &Connection, id: &str) -> AppResult<()> {
        let now = Utc::now().to_rfc3339();
        conn.execute(
            "UPDATE notes SET deleted_at = NULL, updated_at = ?1 WHERE id = ?2",
            params![now, id],
        )?;
        Ok(())
    }

    pub fn delete_permanently(conn: &Connection, id: &str) -> AppResult<()> {
        conn.execute("DELETE FROM notes WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn empty_trash(conn: &Connection) -> AppResult<()> {
        conn.execute("DELETE FROM notes WHERE deleted_at IS NOT NULL", [])?;
        Ok(())
    }

    pub fn duplicate(conn: &Connection, id: &str) -> AppResult<Note> {
        let note = Self::get_by_id(conn, id)?.ok_or_else(|| AppError::NotFound(id.to_string()))?;
        let new_id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();
        let dup_title = if note.title.is_empty() {
            String::new()
        } else {
            format!("{} (Copy)", note.title)
        };

        conn.execute(
            "INSERT INTO notes (
                id, title, content_json, plain_text, color, kind,
                is_pinned, is_favorite, is_archived, created_at,
                updated_at, deleted_at, sort_index, version
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 0, ?9, ?10, NULL, NULL, 1)",
            params![
                new_id,
                dup_title,
                note.content_json,
                note.plain_text,
                note.color.to_string(),
                "Note",
                if note.is_pinned { 1 } else { 0 },
                if note.is_favorite { 1 } else { 0 },
                now,
                now
            ],
        )?;

        // Copy tags
        for t in &note.tags {
            TagRepository::add_to_note(conn, &new_id, &t.id)?;
        }

        Self::get_by_id(conn, &new_id)?.ok_or_else(|| AppError::NotFound(new_id))
    }

    pub fn search(conn: &Connection, query: &str, include_archived: bool) -> AppResult<Vec<Note>> {
        let trimmed = query.trim();
        if trimmed.is_empty() {
            return Self::list(conn, "all", None, None);
        }

        // Try FTS5 first
        let fts_pattern = format!("\"{}\"*", trimmed.replace('"', "\"\""));
        let mut results = Vec::new();

        let fts_sql = if include_archived {
            "SELECT n.id FROM notes_fts fts
             JOIN notes n ON fts.id = n.id
             WHERE notes_fts MATCH ?1 AND n.deleted_at IS NULL
             ORDER BY rank"
        } else {
            "SELECT n.id FROM notes_fts fts
             JOIN notes n ON fts.id = n.id
             WHERE notes_fts MATCH ?1 AND n.deleted_at IS NULL AND n.is_archived = 0
             ORDER BY rank"
        };

        let fts_attempt = conn.prepare(fts_sql).and_then(|mut stmt| {
            let ids = stmt.query_map(params![fts_pattern], |row| row.get::<_, String>(0))?
                .filter_map(Result::ok)
                .collect::<Vec<_>>();
            Ok(ids)
        });

        if let Ok(matched_ids) = fts_attempt {
            for id in matched_ids {
                if let Ok(Some(n)) = Self::get_by_id(conn, &id) {
                    results.push(n);
                }
            }
        }

        // If FTS returned results, return them
        if !results.is_empty() {
            return Ok(results);
        }

        // Robust fallback: ranked LIKE search
        let like_exact = trimmed.to_string();
        let like_prefix = format!("{}%", trimmed);
        let like_contains = format!("%{}%", trimmed);

        let fallback_sql = if include_archived {
            "SELECT id FROM notes
             WHERE deleted_at IS NULL
               AND (title LIKE ?3 OR plain_text LIKE ?3)
             ORDER BY
               CASE
                 WHEN title = ?1 THEN 1
                 WHEN title LIKE ?2 THEN 2
                 WHEN title LIKE ?3 THEN 3
                 ELSE 4
               END,
               updated_at DESC"
        } else {
            "SELECT id FROM notes
             WHERE deleted_at IS NULL AND is_archived = 0
               AND (title LIKE ?3 OR plain_text LIKE ?3)
             ORDER BY
               CASE
                 WHEN title = ?1 THEN 1
                 WHEN title LIKE ?2 THEN 2
                 WHEN title LIKE ?3 THEN 3
                 ELSE 4
               END,
               updated_at DESC"
        };

        let mut stmt = conn.prepare(fallback_sql)?;
        let rows = stmt.query_map(params![like_exact, like_prefix, like_contains], |row| {
            row.get::<_, String>(0)
        })?;

        for r in rows {
            if let Ok(id) = r {
                if let Ok(Some(n)) = Self::get_by_id(conn, &id) {
                    results.push(n);
                }
            }
        }

        Ok(results)
    }
}

pub struct TagRepository;

impl TagRepository {
    pub fn list(conn: &Connection) -> AppResult<Vec<Tag>> {
        let mut stmt = conn.prepare("SELECT id, name, color, created_at FROM tags ORDER BY name ASC")?;
        let rows = stmt.query_map([], |row| {
            Ok(Tag {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                created_at: row.get(3)?,
            })
        })?;

        let mut tags = Vec::new();
        for r in rows {
            tags.push(r?);
        }
        Ok(tags)
    }

    pub fn get_or_create(conn: &Connection, name: &str, color: Option<&str>) -> AppResult<Tag> {
        let existing = conn.query_row(
            "SELECT id, name, color, created_at FROM tags WHERE name = ?1",
            params![name],
            |row| {
                Ok(Tag {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    color: row.get(2)?,
                    created_at: row.get(3)?,
                })
            },
        ).optional()?;

        if let Some(t) = existing {
            return Ok(t);
        }

        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        conn.execute(
            "INSERT INTO tags (id, name, color, created_at) VALUES (?1, ?2, ?3, ?4)",
            params![id, name, color, now],
        )?;

        Ok(Tag {
            id,
            name: name.to_string(),
            color: color.map(|c| c.to_string()),
            created_at: now,
        })
    }

    pub fn delete(conn: &Connection, id: &str) -> AppResult<()> {
        conn.execute("DELETE FROM tags WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn add_to_note(conn: &Connection, note_id: &str, tag_id: &str) -> AppResult<()> {
        conn.execute(
            "INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?1, ?2)",
            params![note_id, tag_id],
        )?;
        Ok(())
    }

    pub fn remove_from_note(conn: &Connection, note_id: &str, tag_id: &str) -> AppResult<()> {
        conn.execute(
            "DELETE FROM note_tags WHERE note_id = ?1 AND tag_id = ?2",
            params![note_id, tag_id],
        )?;
        Ok(())
    }

    pub fn get_tags_for_note(conn: &Connection, note_id: &str) -> AppResult<Vec<Tag>> {
        let mut stmt = conn.prepare(
            "SELECT t.id, t.name, t.color, t.created_at
             FROM tags t
             JOIN note_tags nt ON t.id = nt.tag_id
             WHERE nt.note_id = ?1
             ORDER BY t.name ASC"
        )?;

        let rows = stmt.query_map(params![note_id], |row| {
            Ok(Tag {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                created_at: row.get(3)?,
            })
        })?;

        let mut tags = Vec::new();
        for r in rows {
            tags.push(r?);
        }
        Ok(tags)
    }
}

pub struct WindowRepository;

impl WindowRepository {
    pub fn get(conn: &Connection, note_id: &str) -> AppResult<Option<NoteWindowState>> {
        let state = conn.query_row(
            "SELECT note_id, x, y, width, height, always_on_top, is_open, monitor_id, updated_at
             FROM window_states WHERE note_id = ?1",
            params![note_id],
            |row| {
                let aot: i64 = row.get(5)?;
                let open: i64 = row.get(6)?;
                Ok(NoteWindowState {
                    note_id: row.get(0)?,
                    x: row.get(1)?,
                    y: row.get(2)?,
                    width: row.get(3)?,
                    height: row.get(4)?,
                    always_on_top: aot == 1,
                    is_open: open == 1,
                    monitor_id: row.get(7)?,
                    updated_at: row.get(8)?,
                })
            },
        ).optional()?;

        Ok(state)
    }

    pub fn save(conn: &Connection, state: &NoteWindowState) -> AppResult<()> {
        let now = Utc::now().to_rfc3339();
        conn.execute(
            "INSERT INTO window_states (
                note_id, x, y, width, height, always_on_top, is_open, monitor_id, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
            ON CONFLICT(note_id) DO UPDATE SET
                x = excluded.x,
                y = excluded.y,
                width = excluded.width,
                height = excluded.height,
                always_on_top = excluded.always_on_top,
                is_open = excluded.is_open,
                monitor_id = excluded.monitor_id,
                updated_at = excluded.updated_at",
            params![
                state.note_id,
                state.x,
                state.y,
                state.width,
                state.height,
                if state.always_on_top { 1 } else { 0 },
                if state.is_open { 1 } else { 0 },
                state.monitor_id,
                now
            ],
        )?;
        Ok(())
    }

    pub fn set_open(conn: &Connection, note_id: &str, is_open: bool) -> AppResult<()> {
        let now = Utc::now().to_rfc3339();
        conn.execute(
            "UPDATE window_states SET is_open = ?1, updated_at = ?2 WHERE note_id = ?3",
            params![if is_open { 1 } else { 0 }, now, note_id],
        )?;
        Ok(())
    }

    pub fn list_open(conn: &Connection) -> AppResult<Vec<NoteWindowState>> {
        let mut stmt = conn.prepare(
            "SELECT note_id, x, y, width, height, always_on_top, is_open, monitor_id, updated_at
             FROM window_states WHERE is_open = 1"
        )?;

        let rows = stmt.query_map([], |row| {
            let aot: i64 = row.get(5)?;
            let open: i64 = row.get(6)?;
            Ok(NoteWindowState {
                note_id: row.get(0)?,
                x: row.get(1)?,
                y: row.get(2)?,
                width: row.get(3)?,
                height: row.get(4)?,
                always_on_top: aot == 1,
                is_open: open == 1,
                monitor_id: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }
}

pub struct RevisionRepository;

impl RevisionRepository {
    pub fn record(conn: &Connection, note: &Note) -> AppResult<()> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        conn.execute(
            "INSERT INTO revisions (id, note_id, title, content_json, plain_text, version, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                id,
                note.id,
                note.title,
                note.content_json,
                note.plain_text,
                note.version,
                now
            ],
        )?;

        // Prune older revisions beyond 50 for this note
        conn.execute(
            "DELETE FROM revisions WHERE note_id = ?1 AND id NOT IN (
                SELECT id FROM revisions WHERE note_id = ?1 ORDER BY version DESC LIMIT 50
            )",
            params![note.id],
        )?;

        Ok(())
    }

    pub fn list_by_note(conn: &Connection, note_id: &str) -> AppResult<Vec<Revision>> {
        let mut stmt = conn.prepare(
            "SELECT id, note_id, title, content_json, plain_text, version, created_at
             FROM revisions WHERE note_id = ?1 ORDER BY version DESC LIMIT 50"
        )?;

        let rows = stmt.query_map(params![note_id], |row| {
            Ok(Revision {
                id: row.get(0)?,
                note_id: row.get(1)?,
                title: row.get(2)?,
                content_json: row.get(3)?,
                plain_text: row.get(4)?,
                version: row.get(5)?,
                created_at: row.get(6)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    pub fn restore(conn: &Connection, note_id: &str, revision_id: &str) -> AppResult<Note> {
        let rev = conn.query_row(
            "SELECT title, content_json, plain_text FROM revisions WHERE id = ?1 AND note_id = ?2",
            params![revision_id, note_id],
            |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                ))
            },
        )?;

        NoteRepository::update(
            conn,
            UpdateNoteInput {
                id: note_id.to_string(),
                title: Some(rev.0),
                content_json: Some(rev.1),
                plain_text: Some(rev.2),
                color: None,
                is_pinned: None,
                is_favorite: None,
                is_archived: None,
                version: None,
            },
        )
    }
}

pub struct SettingsRepository;

impl SettingsRepository {
    pub fn get(conn: &Connection) -> AppResult<Settings> {
        let json_str: Option<String> = conn
            .query_row(
                "SELECT value FROM settings WHERE key = 'app_settings'",
                [],
                |row| row.get(0),
            )
            .optional()?;

        if let Some(s) = json_str {
            let parsed = serde_json::from_str::<Settings>(&s).unwrap_or_default();
            Ok(parsed)
        } else {
            let def = Settings::default();
            let json = serde_json::to_string(&def)?;
            let _ = conn.execute(
                "INSERT OR REPLACE INTO settings (key, value) VALUES ('app_settings', ?1)",
                params![json],
            );
            Ok(def)
        }
    }

    pub fn save(conn: &Connection, settings: &Settings) -> AppResult<()> {
        let json = serde_json::to_string(settings)?;
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('app_settings', ?1)",
            params![json],
        )?;
        Ok(())
    }
}
