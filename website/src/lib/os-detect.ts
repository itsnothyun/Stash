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

export const GITHUB_REPO = "https://github.com/prexc/stash";
export const LATEST_VERSION = "v0.1.0";

export const DOWNLOAD_PACKAGES: Record<OperatingSystem, PlatformDownloadInfo> = {
  windows: {
    os: "windows",
    osName: "Windows",
    badge: "Windows 10 / 11",
    primaryInstaller: {
      name: "Windows Setup Installer (.exe)",
      filename: "Stash_0.1.0_x64-setup.exe",
      ext: ".exe",
      arch: "x64 / x86_64",
      url: `${GITHUB_REPO}/releases/download/${LATEST_VERSION}/Stash_0.1.0_x64-setup.exe`,
      size: "8.4 MB",
    },
    secondaryInstaller: {
      name: "Windows Portable Standalone (.exe)",
      filename: "Stash_0.1.0_portable.exe",
      ext: ".exe",
      arch: "x64 (No installation required)",
      url: `${GITHUB_REPO}/releases/download/${LATEST_VERSION}/Stash_0.1.0_portable.exe`,
      size: "8.1 MB",
    },
    cliCommand: "winget install stash-app",
    cliLabel: "winget",
  },
  macos: {
    os: "macos",
    osName: "macOS",
    badge: "macOS 12+ Universal",
    primaryInstaller: {
      name: "Apple Silicon & Intel Disk Image (.dmg)",
      filename: "Stash_0.1.0_universal.dmg",
      ext: ".dmg",
      arch: "Universal (M1/M2/M3/M4 & Intel)",
      url: `${GITHUB_REPO}/releases/download/${LATEST_VERSION}/Stash_0.1.0_universal.dmg`,
      size: "9.2 MB",
    },
    cliCommand: "brew install --cask stash",
    cliLabel: "Homebrew",
  },
  linux: {
    os: "linux",
    osName: "Linux",
    badge: "Linux x64",
    primaryInstaller: {
      name: "Universal AppImage (.AppImage)",
      filename: "stash_0.1.0_amd64.AppImage",
      ext: ".AppImage",
      arch: "x86_64",
      url: `${GITHUB_REPO}/releases/download/${LATEST_VERSION}/stash_0.1.0_amd64.AppImage`,
      size: "12.8 MB",
    },
    secondaryInstaller: {
      name: "Debian / Ubuntu Package (.deb)",
      filename: "stash_0.1.0_amd64.deb",
      ext: ".deb",
      arch: "x86_64",
      url: `${GITHUB_REPO}/releases/download/${LATEST_VERSION}/stash_0.1.0_amd64.deb`,
      size: "10.4 MB",
    },
    cliCommand: "curl -fsSL https://stash.run/install.sh | bash",
    cliLabel: "curl",
  },
  unknown: {
    os: "unknown",
    osName: "Desktop",
    badge: "Windows & macOS",
    primaryInstaller: {
      name: "Windows Setup Installer (.exe)",
      filename: "Stash_0.1.0_x64-setup.exe",
      ext: ".exe",
      arch: "x64",
      url: `${GITHUB_REPO}/releases/download/${LATEST_VERSION}/Stash_0.1.0_x64-setup.exe`,
      size: "8.4 MB",
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
