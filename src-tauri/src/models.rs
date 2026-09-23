use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum NoteColor {
    Paper,
    Sand,
    Lemon,
    Sage,
    Mint,
    Sky,
    Lavender,
    Rose,
    Graphite,
}

impl Default for NoteColor {
    fn default() -> Self {
        NoteColor::Paper
    }
}

impl ToString for NoteColor {
    fn to_string(&self) -> String {
        match self {
            NoteColor::Paper => "Paper".to_string(),
            NoteColor::Sand => "Sand".to_string(),
            NoteColor::Lemon => "Lemon".to_string(),
            NoteColor::Sage => "Sage".to_string(),
            NoteColor::Mint => "Mint".to_string(),
            NoteColor::Sky => "Sky".to_string(),
            NoteColor::Lavender => "Lavender".to_string(),
            NoteColor::Rose => "Rose".to_string(),
            NoteColor::Graphite => "Graphite".to_string(),
        }
    }
}

impl From<&str> for NoteColor {
    fn from(s: &str) -> Self {
        match s {
            "Sand" => NoteColor::Sand,
            "Lemon" => NoteColor::Lemon,
            "Sage" => NoteColor::Sage,
            "Mint" => NoteColor::Mint,
            "Sky" => NoteColor::Sky,
            "Lavender" => NoteColor::Lavender,
            "Rose" => NoteColor::Rose,
            "Graphite" => NoteColor::Graphite,
            _ => NoteColor::Paper,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Tag {
    pub id: String,
    pub name: String,
    pub color: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Note {
    pub id: String,
    pub title: String,
    pub content_json: String,
    pub plain_text: String,
    pub color: NoteColor,
    pub is_pinned: bool,
    pub is_favorite: bool,
    pub is_archived: bool,
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
    pub sort_index: Option<i64>,
    pub version: i64,
    #[serde(default)]
    pub tags: Vec<Tag>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateNoteInput {
    pub id: Option<String>,
    pub title: Option<String>,
    pub content_json: Option<String>,
    pub plain_text: Option<String>,
    pub color: Option<NoteColor>,
    pub is_pinned: Option<bool>,
    pub is_favorite: Option<bool>,
    pub tag_names: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateNoteInput {
    pub id: String,
    pub title: Option<String>,
    pub content_json: Option<String>,
    pub plain_text: Option<String>,
    pub color: Option<NoteColor>,
    pub is_pinned: Option<bool>,
    pub is_favorite: Option<bool>,
    pub is_archived: Option<bool>,
    pub version: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteWindowState {
    pub note_id: String,
    pub x: Option<i32>,
    pub y: Option<i32>,
    pub width: i32,
    pub height: i32,
    pub always_on_top: bool,
    pub is_open: bool,
    pub monitor_id: Option<String>,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Revision {
    pub id: String,
    pub note_id: String,
    pub title: String,
    pub content_json: String,
    pub plain_text: String,
    pub version: i64,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub theme: String,
    pub default_color: NoteColor,
    pub default_always_on_top: bool,
    pub launch_at_startup: bool,
    pub close_to_tray: bool,
    pub restore_open_notes: bool,
    pub global_shortcut: String,
    /// The welcome carousel has been dismissed. Until then the library window
    /// opens on it, including the first launch after this setting appears.
    #[serde(default)]
    pub has_completed_onboarding: bool,
    #[serde(default = "default_zoom")]
    pub zoom_level: u32,
}

fn default_zoom() -> u32 {
    100
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            theme: "system".to_string(),
            default_color: NoteColor::Paper,
            default_always_on_top: false,
            launch_at_startup: false,
            close_to_tray: true,
            restore_open_notes: true,
            global_shortcut: "CommandOrControl+Shift+N".to_string(),
            has_completed_onboarding: false,
            zoom_level: 100,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportData {
    pub version: String,
    pub exported_at: String,
    pub notes: Vec<Note>,
    pub tags: Vec<Tag>,
    pub window_states: Vec<NoteWindowState>,
}
