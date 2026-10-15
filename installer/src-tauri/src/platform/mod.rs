//! Everything OS-specific sits behind the same set of free functions plus an
//! [`crate::install::Integrations`] implementation, re-exported as `Native`.

#[cfg(windows)]
mod windows;
#[cfg(windows)]
pub use self::windows::{Windows as Native, *};

#[cfg(not(windows))]
mod macos;
#[cfg(not(windows))]
pub use self::macos::{MacOs as Native, *};
