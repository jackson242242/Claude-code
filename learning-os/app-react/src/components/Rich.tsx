import { createElement } from "react";

export function fmt(s = ""): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}

/** Render content text with **bold** and line breaks. Content is authored by us (no XSS risk). */
export function Rich({ text, tag = "div", className }: {
  text: string; tag?: "div" | "span" | "p"; className?: string;
}) {
  return createElement(tag, { className, dangerouslySetInnerHTML: { __html: fmt(text) } });
}
