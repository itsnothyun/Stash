//! The Stash build embedded at compile time by `build.rs`.

use std::{
    fs,
    io::{self, Read},
    path::Path,
};

pub static ARCHIVE: &[u8] = include_bytes!(concat!(env!("OUT_DIR"), "/payload.tar.zst"));
pub const VERSION: &str = env!("STASH_VERSION");
const UNPACKED_SIZE: &str = env!("STASH_PAYLOAD_SIZE");
const FILE_COUNT: &str = env!("STASH_PAYLOAD_FILES");

/// Bytes the installed files occupy once extracted.
pub fn unpacked_size() -> u64 {
    UNPACKED_SIZE.parse().unwrap_or(0)
}

pub fn is_empty() -> bool {
    FILE_COUNT == "0"
}

/// Counts compressed bytes consumed so extraction can report progress.
struct Counting<'a, R, F: FnMut(u64)> {
    inner: R,
    read: u64,
    on_read: &'a mut F,
}

impl<R: Read, F: FnMut(u64)> Read for Counting<'_, R, F> {
    fn read(&mut self, buf: &mut [u8]) -> io::Result<usize> {
        let n = self.inner.read(buf)?;
        self.read += n as u64;
        (self.on_read)(self.read);
        Ok(n)
    }
}

/// Extract `archive` (a zstd tarball) into `dest`, reporting 0.0..=1.0.
pub fn extract(archive: &[u8], dest: &Path, mut progress: impl FnMut(f64)) -> io::Result<()> {
    fs::create_dir_all(dest)?;
    let total = archive.len().max(1) as f64;
    let mut last_reported = -1.0;
    let mut on_read = |read: u64| {
        let fraction = read as f64 / total;
        // Throttle to whole percents; the UI cannot show finer steps anyway.
        if fraction - last_reported >= 0.01 || fraction >= 1.0 {
            last_reported = fraction;
            progress(fraction.min(1.0));
        }
    };
    let counting = Counting {
        inner: archive,
        read: 0,
        on_read: &mut on_read,
    };
    let decoder = zstd::Decoder::new(counting)?;
    let mut tar = tar::Archive::new(decoder);
    tar.set_preserve_permissions(true);
    tar.set_overwrite(true);
    tar.unpack(dest)?;
    Ok(())
}

#[cfg(test)]
pub mod tests {
    use super::*;

    /// Build a small archive in memory, mirroring what `build.rs` produces.
    pub fn sample_archive(files: &[(&str, &[u8])]) -> Vec<u8> {
        let mut encoder = zstd::Encoder::new(Vec::new(), 3).unwrap();
        {
            let mut builder = tar::Builder::new(&mut encoder);
            for (name, data) in files {
                let mut header = tar::Header::new_gnu();
                header.set_size(data.len() as u64);
                header.set_mode(0o755);
                header.set_cksum();
                builder.append_data(&mut header, name, *data).unwrap();
            }
            builder.finish().unwrap();
        }
        encoder.finish().unwrap()
    }

    #[test]
    fn extracts_files_and_reports_completion() {
        let archive = sample_archive(&[("stash.exe", b"binary"), ("res/a.txt", b"hello")]);
        let dir = tempfile::tempdir().unwrap();
        let mut last = 0.0;
        extract(&archive, dir.path(), |f| last = f).unwrap();
        assert_eq!(fs::read(dir.path().join("stash.exe")).unwrap(), b"binary");
        assert_eq!(fs::read(dir.path().join("res/a.txt")).unwrap(), b"hello");
        assert!((last - 1.0).abs() < f64::EPSILON);
    }

    #[test]
    fn rejects_corrupt_archive() {
        let dir = tempfile::tempdir().unwrap();
        assert!(extract(b"not an archive", dir.path(), |_| {}).is_err());
    }
}
