import type { PortableTextBlock } from "@portabletext/types";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://jordigarreta.com").replace(/\/$/, "");
export const SITE_NAME = "Jordi Garreta";
export const SITE_TITLE = "Jordi Garreta — Creative Developer";
export const SITE_DESCRIPTION =
  "Jordi Garreta is a creative developer based in Barcelona, building interactive, high-craft websites with Three.js, WebGL and motion design.";

export function portableTextToPlainText(blocks: PortableTextBlock[] = [], maxLength = 160): string {
  const text = (blocks || [])
    .map((block) => {
      if (block._type !== "block" || !("children" in block)) return "";
      return (block.children as { text?: string }[]).map((child) => child.text || "").join("");
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}
