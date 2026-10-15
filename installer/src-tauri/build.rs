use std::{
    env, fs,
    path::{Path, PathBuf},
};

fn main() {
    check_version_matches_app();
    pack_payload();
    tauri_build::build();
}

fn read_version(conf: &Path) -> String {
    let text = fs::read_to_string(conf)
        .unwrap_or_else(|e| panic!("failed to read {}: {e}", conf.display()));
    let json: serde_json::Value = serde_json::from_str(&text)
        .unwrap_or_else(|e| panic!("invalid JSON in {}: {e}", conf.display()));
    json["version"]
        .as_str()
        .unwrap_or_else(|| panic!("no version in {}", conf.display()))
        .to_string()
}

/// The setup must always ship the Stash version it claims to install.
fn check_version_matches_app() {
    let app_conf = Path::new("../../src-tauri/tauri.conf.json");
    let setup_conf = Path::new("tauri.conf.json");
    println!("cargo:rerun-if-changed={}", app_conf.display());
    println!("cargo:rerun-if-changed={}", setup_conf.display());

    let app = read_version(app_conf);
    let setup = read_version(setup_conf);
    let cargo = env::var("CARGO_PKG_VERSION").unwrap();
    if app != setup || app != cargo {
        panic!(
            "Stash Setup version mismatch: src-tauri/tauri.conf.json is {app}, \
             installer tauri.conf.json is {setup}, installer Cargo.toml is {cargo}. \
             Bump them together."
        );
    }
    println!("cargo:rustc-env=STASH_VERSION={app}");
}

/// Archive the staged Stash build (`payload/`, or `STASH_PAYLOAD_DIR`) into a
/// zstd tarball that `payload.rs` embeds. An empty directory still builds so
/// the UI can be developed without a release build of Stash.
fn pack_payload() {
    println!("cargo:rerun-if-env-changed=STASH_PAYLOAD_DIR");
    let dir = env::var_os("STASH_PAYLOAD_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("payload"));
    println!("cargo:rerun-if-changed={}", dir.display());

    let out = PathBuf::from(env::var("OUT_DIR").unwrap());
    let archive_path = out.join("payload.tar.zst");
    let file = fs::File::create(&archive_path).expect("create payload archive");
    let encoder = zstd::Encoder::new(file, 19).expect("zstd encoder");
    let mut builder = tar::Builder::new(encoder);
    builder.follow_symlinks(false);

    let mut unpacked_size: u64 = 0;
    let mut file_count: u64 = 0;
    if dir.is_dir() {
        add_dir(&mut builder, &dir, Path::new(""), &mut unpacked_size, &mut file_count);
    }
    builder
        .into_inner()
        .expect("finish tar")
        .finish()
        .expect("finish zstd");

    println!("cargo:rustc-env=STASH_PAYLOAD_SIZE={unpacked_size}");
    println!("cargo:rustc-env=STASH_PAYLOAD_FILES={file_count}");
}

fn add_dir<W: std::io::Write>(
    builder: &mut tar::Builder<W>,
    root: &Path,
    rel: &Path,
    size: &mut u64,
    count: &mut u64,
) {
    let mut entries: Vec<_> = fs::read_dir(root.join(rel))
        .expect("read payload dir")
        .map(|e| e.expect("payload entry"))
        .collect();
    entries.sort_by_key(|e| e.file_name());

    for entry in entries {
        let name = entry.file_name();
        // Keep the placeholder that holds the directory in git out of the archive.
        if rel.as_os_str().is_empty() && name == ".gitkeep" {
            continue;
        }
        let rel_path = rel.join(&name);
        let full = root.join(&rel_path);
        println!("cargo:rerun-if-changed={}", full.display());
        let meta = fs::symlink_metadata(&full).expect("payload metadata");
        if meta.is_dir() {
            builder.append_dir(&rel_path, &full).expect("append dir");
            add_dir(builder, root, &rel_path, size, count);
        } else {
            builder
                .append_path_with_name(&full, &rel_path)
                .expect("append file");
            *size += meta.len();
            *count += 1;
        }
    }
}
