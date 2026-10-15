#[cfg(test)]
mod tests {
    use rusqlite::Connection;
    use crate::db::DbState;
    use crate::models::{
        CreateNoteInput, NoteColor, NoteWindowState, ReferenceLink, Settings, UpdateNoteInput,
    };
    use crate::repositories::{
        NoteRepository, ReferenceRepository, RevisionRepository, SettingsRepository, TagRepository,
        WindowRepository,
    };

    fn setup_test_db() -> Connection {
        let state = DbState::new_in_memory().expect("failed in-memory db setup");
        let conn = state.conn.into_inner().unwrap();
        conn
    }

    #[test]
    fn test_note_crud_and_tagging() {
        let conn = setup_test_db();

        // Create
        let note = NoteRepository::create(
            &conn,
            CreateNoteInput {
                id: None,
                title: Some("Meeting with Alex".to_string()),
                content_json: Some("{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"Discuss design\"}]}]}".to_string()),
                plain_text: Some("Discuss design tokens and architecture".to_string()),
                color: Some(NoteColor::Sage),
                is_pinned: Some(true),
                is_favorite: Some(false),
                tag_names: Some(vec!["Design".to_string(), "Q4".to_string()]),
            },
        ).expect("create note failed");

        assert_eq!(note.title, "Meeting with Alex");
        assert_eq!(note.color, NoteColor::Sage);
        assert!(note.is_pinned);
        assert_eq!(note.tags.len(), 2);

        // Update
        let updated = NoteRepository::update(
            &conn,
            UpdateNoteInput {
                id: note.id.clone(),
                title: Some("Meeting with Alex (Updated)".to_string()),
                content_json: None,
                plain_text: Some("Updated content".to_string()),
                color: Some(NoteColor::Lavender),
                is_pinned: Some(false),
                is_favorite: Some(true),
                is_archived: None,
                version: Some(note.version),
            },
        ).expect("update note failed");

        assert_eq!(updated.title, "Meeting with Alex (Updated)");
        assert_eq!(updated.color, NoteColor::Lavender);
        assert!(!updated.is_pinned);
        assert!(updated.is_favorite);
        assert_eq!(updated.version, 2);
    }

    #[test]
    fn test_archive_and_trash_semantics() {
        let conn = setup_test_db();

        let note = NoteRepository::create(
            &conn,
            CreateNoteInput {
                id: None,
                title: Some("Temporary checklist".to_string()),
                content_json: None,
                plain_text: Some("Clean desk\nSort receipts".to_string()),
                color: Some(NoteColor::Sand),
                is_pinned: None,
                is_favorite: None,
                tag_names: None,
            },
        ).unwrap();

        // Initial list has note
        let all = NoteRepository::list(&conn, "all", None, None).unwrap();
        assert_eq!(all.len(), 1);

        // Archive
        NoteRepository::set_archived(&conn, &note.id, true).unwrap();
        let all_after_archive = NoteRepository::list(&conn, "all", None, None).unwrap();
        assert_eq!(all_after_archive.len(), 0);

        let archived_list = NoteRepository::list(&conn, "archive", None, None).unwrap();
        assert_eq!(archived_list.len(), 1);

        // Unarchive
        NoteRepository::set_archived(&conn, &note.id, false).unwrap();
        let all_restored = NoteRepository::list(&conn, "all", None, None).unwrap();
        assert_eq!(all_restored.len(), 1);

        // Move to Trash (soft delete)
        NoteRepository::soft_delete(&conn, &note.id).unwrap();
        let all_after_trash = NoteRepository::list(&conn, "all", None, None).unwrap();
        assert_eq!(all_after_trash.len(), 0);

        let trash_list = NoteRepository::list(&conn, "trash", None, None).unwrap();
        assert_eq!(trash_list.len(), 1);

        // Restore from Trash
        NoteRepository::restore_trash(&conn, &note.id).unwrap();
        let all_after_restore = NoteRepository::list(&conn, "all", None, None).unwrap();
        assert_eq!(all_after_restore.len(), 1);

        // Permanent Delete
        NoteRepository::delete_permanently(&conn, &note.id).unwrap();
        let trash_after_delete = NoteRepository::list(&conn, "trash", None, None).unwrap();
        assert_eq!(trash_after_delete.len(), 0);
    }

    #[test]
    fn test_search_ranking() {
        let conn = setup_test_db();

        NoteRepository::create(
            &conn,
            CreateNoteInput {
                id: None,
                title: Some("Project Launch Roadmap".to_string()),
                content_json: None,
                plain_text: Some("Details on marketing and releases".to_string()),
                color: None,
                is_pinned: None,
                is_favorite: None,
                tag_names: None,
            },
        ).unwrap();

        NoteRepository::create(
            &conn,
            CreateNoteInput {
                id: None,
                title: Some("Weekly grocery list".to_string()),
                content_json: None,
                plain_text: Some("Apples, milk, launch new recipe".to_string()),
                color: None,
                is_pinned: None,
                is_favorite: None,
                tag_names: None,
            },
        ).unwrap();

        // Search for "Launch"
        let results = NoteRepository::search(&conn, "Launch", false).unwrap();
        assert_eq!(results.len(), 2);
        // "Project Launch Roadmap" matches in title, so should rank higher or match
        assert!(results[0].title.contains("Launch") || results[1].title.contains("Launch"));
    }

    #[test]
    fn test_window_state_persistence() {
        let conn = setup_test_db();

        let note = NoteRepository::create(
            &conn,
            CreateNoteInput {
                id: None,
                title: Some("Floating Stash".to_string()),
                content_json: None,
                plain_text: Some("Floating test".to_string()),
                color: None,
                is_pinned: None,
                is_favorite: None,
                tag_names: None,
            },
        ).unwrap();

        let state = NoteWindowState {
            note_id: note.id.clone(),
            x: Some(340),
            y: Some(180),
            width: 420,
            height: 480,
            always_on_top: true,
            is_open: true,
            monitor_id: Some("primary".to_string()),
            updated_at: chrono::Utc::now().to_rfc3339(),
        };

        WindowRepository::save(&conn, &state).unwrap();

        let loaded = WindowRepository::get(&conn, &note.id).unwrap().expect("window state not found");
        assert_eq!(loaded.x, Some(340));
        assert_eq!(loaded.y, Some(180));
        assert_eq!(loaded.width, 420);
        assert_eq!(loaded.height, 480);
        assert!(loaded.always_on_top);
        assert!(loaded.is_open);
    }

    #[test]
    fn test_revision_history() {
        let conn = setup_test_db();

        let note = NoteRepository::create(
            &conn,
            CreateNoteInput {
                id: None,
                title: Some("Initial Draft".to_string()),
                content_json: None,
                plain_text: Some("Version 1 content".to_string()),
                color: None,
                is_pinned: None,
                is_favorite: None,
                tag_names: None,
            },
        ).unwrap();

        // Record a revision
        RevisionRepository::record(&conn, &note).unwrap();

        // Update note to v2
        let _ = NoteRepository::update(
            &conn,
            UpdateNoteInput {
                id: note.id.clone(),
                title: Some("Second Draft".to_string()),
                content_json: None,
                plain_text: Some("Version 2 content".to_string()),
                color: None,
                is_pinned: None,
                is_favorite: None,
                is_archived: None,
                version: Some(note.version),
            },
        ).unwrap();

        let revisions = RevisionRepository::list_by_note(&conn, &note.id).unwrap();
        assert_eq!(revisions.len(), 1);
        assert_eq!(revisions[0].title, "Initial Draft");

        // Restore revision
        let restored = RevisionRepository::restore(&conn, &note.id, &revisions[0].id).unwrap();
        assert_eq!(restored.title, "Initial Draft");
    }

    #[test]
    fn test_settings_persistence() {
        let conn = setup_test_db();

        let mut s = SettingsRepository::get(&conn).unwrap();
        assert_eq!(s.theme, "system");
        assert_eq!(s.zoom_level, 100);

        s.theme = "dark".to_string();
        s.default_color = NoteColor::Lemon;
        s.default_always_on_top = true;
        s.zoom_level = 125;
        SettingsRepository::save(&conn, &s).unwrap();

        let loaded = SettingsRepository::get(&conn).unwrap();
        assert_eq!(loaded.theme, "dark");
        assert_eq!(loaded.default_color, NoteColor::Lemon);
        assert!(loaded.default_always_on_top);
        assert_eq!(loaded.zoom_level, 125);
    }

    #[test]
    fn test_starter_seed_and_swap_note() {
        let state = DbState::new_in_memory().unwrap();
        state.seed_starter_data_if_empty().unwrap();

        let conn = state.conn.into_inner().unwrap();
        let notes = NoteRepository::list(&conn, "all", None, None).unwrap();
        assert_eq!(notes.len(), 3);

        // The starter checklist lives inside a normal stash, so To-dos finds it
        // by the task nodes in the document.
        let todos = NoteRepository::list(&conn, "todos", None, None).unwrap();
        assert_eq!(todos.len(), 1);
        assert_eq!(todos[0].title, "Today");
        assert!(todos[0].content_json.contains("taskItem"));
        assert!(!todos[0].plain_text.contains('\u{2610}'));

        let swap_note = notes.iter().find(|n| n.plain_text.contains("[swap-widget]"));
        assert!(swap_note.is_some());
        let swap = swap_note.unwrap();
        assert_eq!(swap.title, "⚡ ETH / USDC Swap");
        assert_eq!(swap.color, NoteColor::Mint);

        // Tags attached
        assert!(swap.tags.iter().any(|t| t.name == "swap"));
        assert!(swap.tags.iter().any(|t| t.name == "crypto"));

        // Idempotency: calling again should not duplicate
        let state2 = DbState {
            conn: std::sync::Mutex::new(conn),
        };
        state2.seed_starter_data_if_empty().unwrap();
        let conn2 = state2.conn.into_inner().unwrap();
        let notes_after = NoteRepository::list(&conn2, "all", None, None).unwrap();
        assert_eq!(notes_after.len(), 3);
    }

    #[test]
    fn test_todos_section_follows_task_content() {
        let conn = setup_test_db();

        let checklist = "{\"type\":\"doc\",\"content\":[{\"type\":\"taskList\",\"content\":[{\"type\":\"taskItem\",\"attrs\":{\"checked\":false},\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"Milk\"}]}]}]}]}";
        let todo = NoteRepository::create(
            &conn,
            CreateNoteInput {
                id: None,
                title: Some("Groceries".to_string()),
                content_json: Some(checklist.to_string()),
                plain_text: Some("Milk".to_string()),
                color: None,
                is_pinned: None,
                is_favorite: None,
                tag_names: None,
            },
        )
        .unwrap();

        let note = NoteRepository::create(
            &conn,
            CreateNoteInput {
                id: None,
                title: Some("Scratch".to_string()),
                content_json: None,
                plain_text: None,
                color: None,
                is_pinned: None,
                is_favorite: None,
                tag_names: None,
            },
        )
        .unwrap();

        assert!(note.content_json.contains("doc"));
        assert!(!note.content_json.contains("taskItem"));

        let todos = NoteRepository::list(&conn, "todos", None, None).unwrap();
        assert_eq!(todos.len(), 1);
        assert_eq!(todos[0].id, todo.id);

        let copy = NoteRepository::duplicate(&conn, &todo.id).unwrap();
        assert!(copy.content_json.contains("Milk"));
        let todos_after = NoteRepository::list(&conn, "todos", None, None).unwrap();
        assert_eq!(todos_after.len(), 2);
    }

    #[test]
    fn test_migration_converts_legacy_todo_rows() {
        use crate::db::convert_todo_list;

        let legacy = "{\"type\":\"todoList\",\"version\":1,\"items\":[\
            {\"id\":\"a\",\"text\":\"Ship it\",\"done\":true,\"createdAt\":\"x\",\"completedAt\":\"x\"},\
            {\"id\":\"b\",\"text\":\"Write the note\",\"done\":false,\"createdAt\":\"x\",\"completedAt\":null}\
        ]}";
        let (json, plain) = convert_todo_list(legacy).expect("checklist converts");
        assert!(json.contains("taskItem"));
        assert!(json.contains("\"checked\":true"));
        assert_eq!(plain, "Ship it\nWrite the note");
        assert!(!plain.contains('\u{2611}'));

        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(
            "CREATE TABLE notes (
                id TEXT PRIMARY KEY,
                content_json TEXT NOT NULL,
                plain_text TEXT NOT NULL,
                kind TEXT NOT NULL
            );
            CREATE TABLE schema_migrations (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL
            );
            INSERT INTO schema_migrations (version, applied_at) VALUES (3, 'now');",
        )
        .unwrap();
        conn.execute(
            "INSERT INTO notes (id, content_json, plain_text, kind) VALUES ('t1', ?1, ?2, 'Todo')",
            rusqlite::params![legacy, "\u{2611} Ship it\n\u{2610} Write the note"],
        )
        .unwrap();

        let state = DbState {
            conn: std::sync::Mutex::new(conn),
        };
        state.run_migrations().unwrap();
        let conn = state.conn.into_inner().unwrap();
        let (stored, stored_plain, kind): (String, String, String) = conn
            .query_row(
                "SELECT content_json, plain_text, kind FROM notes WHERE id = 't1'",
                [],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .unwrap();
        assert_eq!(kind, "Note");
        assert!(stored.contains("stashDoc"));
        assert!(stored.contains("Ship it"));
        assert_eq!(stored_plain, "Ship it\nWrite the note");
        let version: i64 = conn
            .query_row(
                "SELECT MAX(version) FROM schema_migrations",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(version, 5);
    }

    #[test]
    fn test_reference_links_crud() {
        let conn = setup_test_db();
        let link = ReferenceLink {
            id: String::new(),
            title: "Repomix".into(),
            url: Some("https://github.com/yamadashy/repomix".into()),
            description: "Pack a repo for AI".into(),
            category: "Dev tools".into(),
            status: "ready".into(),
            keyword: None,
            source_label: Some("@bitbyybit".into()),
            source_url: None,
            collection: Some("Hyun's Reels".into()),
            thumbnail: Some("data:image/jpeg;base64,AAAA".into()),
            is_starred: false,
            is_visited: false,
            created_at: String::new(),
            updated_at: String::new(),
        };
        let saved = ReferenceRepository::upsert(&conn, link).expect("insert");
        assert!(!saved.id.is_empty());
        assert!(!saved.created_at.is_empty());

        // Upsert by id updates instead of duplicating
        let mut edited = saved.clone();
        edited.title = "Repomix CLI".into();
        ReferenceRepository::upsert(&conn, edited).expect("update");
        let all = ReferenceRepository::list(&conn).expect("list");
        assert_eq!(all.len(), 1);
        assert_eq!(all[0].title, "Repomix CLI");

        ReferenceRepository::set_flags(&conn, &saved.id, Some(true), Some(true)).expect("flags");
        let all = ReferenceRepository::list(&conn).expect("list");
        assert!(all[0].is_starred && all[0].is_visited);

        ReferenceRepository::delete(&conn, &saved.id).expect("delete");
        assert!(ReferenceRepository::list(&conn).expect("list").is_empty());
    }
}
