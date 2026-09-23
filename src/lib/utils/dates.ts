import { format, formatDistanceToNowStrict, isToday, isYesterday } from "date-fns";

export function formatNoteDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";

    const now = new Date();
    const diffHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) {
      if (diffHours < 0.05) return "Just now";
      return formatDistanceToNowStrict(d, { addSuffix: true });
    }

    if (isToday(d)) {
      return format(d, "h:mm a");
    }

    if (isYesterday(d)) {
      return "Yesterday";
    }

    if (d.getFullYear() === now.getFullYear()) {
      return format(d, "MMM d");
    }

    return format(d, "MMM d, yyyy");
  } catch {
    return "";
  }
}
