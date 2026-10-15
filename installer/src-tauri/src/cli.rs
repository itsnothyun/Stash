//! Command-line flags, used by Apps & Features (`--uninstall`) and by
//! scripted installs such as winget (`--silent`).

use std::path::PathBuf;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Cli {
    pub uninstall: bool,
    pub silent: bool,
    pub dir: Option<PathBuf>,
    pub desktop_shortcut: bool,
    pub start_menu: bool,
    pub launch_at_login: bool,
    pub delete_data: bool,
}

impl Default for Cli {
    fn default() -> Self {
        Self {
            uninstall: false,
            silent: false,
            dir: None,
            desktop_shortcut: true,
            start_menu: true,
            launch_at_login: false,
            delete_data: false,
        }
    }
}

pub fn parse<I: IntoIterator<Item = String>>(args: I) -> Result<Cli, String> {
    let mut cli = Cli::default();
    let mut args = args.into_iter();
    while let Some(arg) = args.next() {
        match arg.as_str() {
            "--uninstall" => cli.uninstall = true,
            "--silent" => cli.silent = true,
            "--no-desktop-shortcut" => cli.desktop_shortcut = false,
            "--no-start-menu" => cli.start_menu = false,
            "--launch-at-login" => cli.launch_at_login = true,
            "--delete-data" => cli.delete_data = true,
            "--dir" => {
                let value = args.next().ok_or("--dir needs a path")?;
                cli.dir = Some(PathBuf::from(value));
            }
            other => {
                if let Some(value) = other.strip_prefix("--dir=") {
                    cli.dir = Some(PathBuf::from(value));
                } else {
                    return Err(format!("unknown argument: {other}"));
                }
            }
        }
    }
    Ok(cli)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn p(args: &[&str]) -> Result<Cli, String> {
        parse(args.iter().map(|s| s.to_string()))
    }

    #[test]
    fn defaults_without_flags() {
        assert_eq!(p(&[]).unwrap(), Cli::default());
    }

    #[test]
    fn parses_all_flags() {
        let cli = p(&[
            "--silent",
            "--uninstall",
            "--dir",
            "C:\\Apps\\Stash",
            "--no-desktop-shortcut",
            "--no-start-menu",
            "--launch-at-login",
            "--delete-data",
        ])
        .unwrap();
        assert!(cli.silent && cli.uninstall && cli.launch_at_login && cli.delete_data);
        assert!(!cli.desktop_shortcut && !cli.start_menu);
        assert_eq!(cli.dir, Some(PathBuf::from("C:\\Apps\\Stash")));
    }

    #[test]
    fn parses_dir_with_equals() {
        assert_eq!(p(&["--dir=/tmp/x"]).unwrap().dir, Some(PathBuf::from("/tmp/x")));
    }

    #[test]
    fn rejects_unknown_and_missing_value() {
        assert!(p(&["--bogus"]).is_err());
        assert!(p(&["--dir"]).is_err());
    }
}
