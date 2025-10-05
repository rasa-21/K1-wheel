// простая утилита для обрезки текста
export function shortText(text, max = 14) {
  if (!text) return "—"
  return text.length > max ? text.slice(0, max - 1) + "…" : text
}
