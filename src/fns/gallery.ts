import { createServerFn } from "@tanstack/react-start";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const GALLERY_DIR = join(process.cwd(), "public", "gallery");
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

export const getGalleryImagesFn = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const files = await readdir(GALLERY_DIR);
    return files
      .filter((f) => IMAGE_EXTENSIONS.has(f.toLowerCase().slice(f.lastIndexOf("."))))
      .sort((a, b) => a.localeCompare(b))
      .map((file) => ({
        src: `/gallery/${file}`,
        alt: file
          .replace(/\.[^.]+$/, "")
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
      }));
  } catch {
    return [];
  }
});
