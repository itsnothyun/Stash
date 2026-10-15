export type OperatingSystem = "windows" | "macos" | "linux" | "unknown";

export interface PlatformDownloadInfo {
  os: OperatingSystem;
  osName: string;
  badge: string;
  primaryInstaller: {
    name: string;
    filename: string;
    ext: ".exe" | ".dmg" | ".AppImage" | ".deb";
    arch: string;
    url: string;
    size: string;
  };
  secondaryInstaller?: {
    name: string;
    filename: string;
    ext: string;
    arch: string;
    url: string;
    size: string;
  };
  cliCommand: string;
  cliLabel: string;
}

export const GITHUB_REPO = "https://github.com/itsnothyun/Stash";
export const LATEST_VERSION = "v0.1.3";

export const DOWNLOAD_PACKAGES: Record<OperatingSystem, PlatformDownloadInfo> = {
  windows: {
    os: "windows",
    osName: "Windows",
    badge: "Windows 10 / 11",
    primaryInstaller: {
      name: "Stash Setup (.exe)",
      filename: "Stash-Setup-0.1.3.exe",
      ext: ".exe",
      arch: "x64 / x86_64",
      url: `${GITHUB_REPO}/releases/download/${LATEST_VERSION}/Stash-Setup-0.1.3.exe`,
      size: "11.0 MB",
    },
    cliCommand: "winget install stash-app",
    cliLabel: "winget",
  },
  macos: {
    os: "macos",
    osName: "macOS",
    badge: "macOS 12+ Universal",
    primaryInstaller: {
      name: "Stash Setup Disk Image (.dmg)",
      filename: "Stash-Setup-0.1.3.dmg",
      ext: ".dmg",
      arch: "Universal (M1/M2/M3/M4 & Intel)",
      url: `${GITHUB_REPO}/releases/download/${LATEST_VERSION}/Stash-Setup-0.1.3.dmg`,
      size: "27.9 MB",
    },
    cliCommand: "brew install --cask stash",
    cliLabel: "Homebrew",
  },
  linux: {
    os: "linux",
    osName: "Linux",
    badge: "Linux x64",
    primaryInstaller: {
      name: "Build from source (no Linux build yet)",
      filename: "stash_0.1.3_amd64.AppImage",
      ext: ".AppImage",
      arch: "x86_64",
      url: `${GITHUB_REPO}/releases`,
      size: "N/A",
    },
    cliCommand: "curl -fsSL https://stash.run/install.sh | bash",
    cliLabel: "curl",
  },
  unknown: {
    os: "unknown",
    osName: "Desktop",
    badge: "Windows & macOS",
    primaryInstaller: {
      name: "Stash Setup (.exe)",
      filename: "Stash-Setup-0.1.3.exe",
      ext: ".exe",
      arch: "x64",
      url: `${GITHUB_REPO}/releases/download/${LATEST_VERSION}/Stash-Setup-0.1.3.exe`,
      size: "11.0 MB",
    },
    cliCommand: "winget install stash-app",
    cliLabel: "winget",
  },
};

export function detectUserOS(): OperatingSystem {
  if (typeof window === "undefined" || !navigator) return "windows";

  const userAgent = (navigator.userAgent || "").toLowerCase();
  const platform = (navigator.platform || "").toLowerCase();

  if (userAgent.includes("win") || platform.includes("win")) {
    return "windows";
  }
  if (userAgent.includes("mac") || platform.includes("mac")) {
    return "macos";
  }
  if (userAgent.includes("linux") || platform.includes("linux")) {
    return "linux";
  }

  return "windows"; // Default fallback
}
