export type NoteColor =
  | "Paper"
  | "Sand"
  | "Lemon"
  | "Sage"
  | "Mint"
  | "Sky"
  | "Lavender"
  | "Rose"
  | "Graphite";

export interface ColorMeta {
  id: NoteColor;
  label: string;
  /** Swatch colour. Reads from the theme so dark mode is designed, not inverted. */
  dotColor: string;
  /** Surface + border + foreground for a stash painted in this colour. */
  surfaceClass: string;
}

export const NOTE_COLORS: ColorMeta[] = [
  {
    id: "Paper",
    label: "Paper",
    dotColor: "var(--stash-paper-dot)",
    surfaceClass:
      "bg-stash-paper-surface border-stash-paper-border text-stash-paper-fg",
  },
  {
    id: "Sand",
    label: "Sand",
    dotColor: "var(--stash-sand-dot)",
    surfaceClass:
      "bg-stash-sand-surface border-stash-sand-border text-stash-sand-fg",
  },
  {
    id: "Lemon",
    label: "Lemon",
    dotColor: "var(--stash-lemon-dot)",
    surfaceClass:
      "bg-stash-lemon-surface border-stash-lemon-border text-stash-lemon-fg",
  },
  {
    id: "Sage",
    label: "Sage",
    dotColor: "var(--stash-sage-dot)",
    surfaceClass:
      "bg-stash-sage-surface border-stash-sage-border text-stash-sage-fg",
  },
  {
    id: "Mint",
    label: "Mint",
    dotColor: "var(--stash-mint-dot)",
    surfaceClass:
      "bg-stash-mint-surface border-stash-mint-border text-stash-mint-fg",
  },
  {
    id: "Sky",
    label: "Sky",
    dotColor: "var(--stash-sky-dot)",
    surfaceClass:
      "bg-stash-sky-surface border-stash-sky-border text-stash-sky-fg",
  },
  {
    id: "Lavender",
    label: "Lavender",
    dotColor: "var(--stash-lavender-dot)",
    surfaceClass:
      "bg-stash-lavender-surface border-stash-lavender-border text-stash-lavender-fg",
  },
  {
    id: "Rose",
    label: "Rose",
    dotColor: "var(--stash-rose-dot)",
    surfaceClass:
      "bg-stash-rose-surface border-stash-rose-border text-stash-rose-fg",
  },
  {
    id: "Graphite",
    label: "Graphite",
    dotColor: "var(--stash-graphite-dot)",
    surfaceClass:
      "bg-stash-graphite-surface border-stash-graphite-border text-stash-graphite-fg",
  },
];

function metaFor(color: NoteColor): ColorMeta {
  return NOTE_COLORS.find((c) => c.id === color) ?? NOTE_COLORS[0];
}

/** Surface, border and foreground classes for a stash of this colour. */
export function getColorClass(color: NoteColor): string {
  return metaFor(color).surfaceClass;
}

/** The swatch colour, for dots and indicators. */
export function getColorDot(color: NoteColor): string {
  return metaFor(color).dotColor;
}

export function getColorLabel(color: NoteColor): string {
  return metaFor(color).label;
}
