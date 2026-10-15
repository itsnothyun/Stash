//! Minimal `major.minor.patch` comparison; pre-release suffixes are ignored.

use std::cmp::Ordering;

pub fn parse(v: &str) -> Option<(u64, u64, u64)> {
    let core = v.trim().trim_start_matches('v');
    let core = core.split(['-', '+']).next()?;
    let mut parts = core.split('.').map(|p| p.parse::<u64>());
    let major = parts.next()?.ok()?;
    let minor = parts.next().unwrap_or(Ok(0)).ok()?;
    let patch = parts.next().unwrap_or(Ok(0)).ok()?;
    Some((major, minor, patch))
}

/// Unparseable versions compare as older, so a broken record is replaced.
pub fn compare(a: &str, b: &str) -> Ordering {
    match (parse(a), parse(b)) {
        (Some(a), Some(b)) => a.cmp(&b),
        (None, Some(_)) => Ordering::Less,
        (Some(_), None) => Ordering::Greater,
        (None, None) => Ordering::Equal,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_common_forms() {
        assert_eq!(parse("0.1.1"), Some((0, 1, 1)));
        assert_eq!(parse("v1.2"), Some((1, 2, 0)));
        assert_eq!(parse("2.0.0-beta.1"), Some((2, 0, 0)));
        assert_eq!(parse("abc"), None);
    }

    #[test]
    fn compares() {
        assert_eq!(compare("0.1.0", "0.1.1"), Ordering::Less);
        assert_eq!(compare("0.10.0", "0.9.9"), Ordering::Greater);
        assert_eq!(compare("1.0.0", "1.0"), Ordering::Equal);
        assert_eq!(compare("junk", "0.0.1"), Ordering::Less);
    }
}
