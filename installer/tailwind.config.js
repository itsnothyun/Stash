import path from "path";
import { fileURLToPath } from "url";
import app from "../tailwind.config.js";

const here = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('tailwindcss').Config} */
export default {
  presets: [app],
  content: [
    path.join(here, "index.html"),
    path.join(here, "ui/**/*.{ts,tsx}"),
    path.join(here, "../src/components/ui/button.tsx"),
    // globals.css @applies a few app classes; scan the app so they resolve.
    path.join(here, "../src/styles/**/*.css"),
  ],
};
