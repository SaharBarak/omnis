/**
 * Display-string casing.
 *
 * Material 3 is sentence case everywhere and no M3 type role carries a
 * text-transform, so casing is the copy's own job. Most engine values already
 * arrive properly cased ('Supportive', 'Standard', 'Family') and need nothing.
 * The lowercase unions — an element, a modality, an insight type, a synastry
 * aspect — are identifiers, not prose, and this is what lifts them into it.
 */
export function sentenceCase(value: string): string {
  if (value.length === 0) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/**
 * The one or two letters that stand in for a person wherever there is no photo
 * — list rows, avatars, the map's stars, the members of a circle.
 *
 * This is the one place in the app that still shouts, and legitimately: initials
 * are uppercase. It had been copy-pasted into nine files.
 *
 * The '·' fallback matters — a person whose name is whitespace, or a single
 * emoji, still has to render *something* inside a 56dp circle.
 */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter((part) => part.length > 0)
  const first = parts[0]?.[0] ?? ''
  const second = parts[1]?.[0] ?? ''
  return `${first}${second}`.toUpperCase() || '·'
}
