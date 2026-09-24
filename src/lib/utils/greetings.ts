import { invoke } from "@tauri-apps/api/core";
import { isTauri } from "@/lib/tauri/window-manager";

let cachedUsername: string | null = null;

export async function getSystemUsername(): Promise<string> {
  if (cachedUsername) return cachedUsername;

  if (isTauri()) {
    try {
      const name = await invoke<string>("get_system_username");
      if (name && name.trim()) {
        cachedUsername = name.trim();
        return cachedUsername;
      }
    } catch {
      // Fallback
    }
  }

  // Web or fallback
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("stash:username");
    if (stored) {
      cachedUsername = stored;
      return stored;
    }
  }

  return "Explorer";
}

export function getQuirkyGreeting(username: string): { title: string; subtitle: string } {
  const hour = new Date().getHours();
  const cleanName = username && username !== "Friend" && username !== "Explorer" ? username : "there";

  if (hour >= 5 && hour < 12) {
    const options = [
      { title: `Morning, ${cleanName}! ☕`, subtitle: "Time to empty that big brain onto the canvas." },
      { title: `Rise & stash, ${cleanName} 🥐`, subtitle: "Capture thoughts before the morning coffee kicks in." },
      { title: `Good morning, ${cleanName} ☀️`, subtitle: "Ready to turn fleeting sparks into finished work?" },
    ];
    return options[hour % options.length];
  }

  if (hour >= 12 && hour < 17) {
    const options = [
      { title: `Afternoon hustle, ${cleanName} ⚡`, subtitle: "Don't let the good thoughts slip away in the noise." },
      { title: `Hey ${cleanName}! 🍕`, subtitle: "Keep the momentum going, one quick note at a time." },
      { title: `In the flow, ${cleanName} 🧠`, subtitle: "All your stashes, organized and zero-friction." },
    ];
    return options[hour % options.length];
  }

  if (hour >= 17 && hour < 22) {
    const options = [
      { title: `Evening, ${cleanName} 🌙`, subtitle: "Unwind, reflect, and stash your daily wins." },
      { title: `Golden hour sparks, ${cleanName} ✨`, subtitle: "Wrap up loose ends and set tomorrow up for greatness." },
      { title: `Peace of mind, ${cleanName} 🍵`, subtitle: "Everything you stashed is safe and sound." },
    ];
    return options[hour % options.length];
  }

  // Late night / Night owl (22 - 4)
  const options = [
    { title: `Midnight architect, ${cleanName} 🦉`, subtitle: "Night owl mode active. Thoughts hit different after dark." },
    { title: `Still creating, ${cleanName}? 🌌`, subtitle: "Stash the sparks now so you can sleep with a clear mind." },
    { title: `Burning the midnight oil, ${cleanName} 💡`, subtitle: "Quick captures for late-night breakthroughs." },
  ];
  return options[hour % options.length];
}
