/**
 * Hands inline properties back to the stylesheet once the motion that
 * borrowed them is done, so nothing a finished animation set outlives it.
 */
export const release = (el: ElementCSSInlineStyle, properties: readonly string[]): void => {
  for (const property of properties) el.style.removeProperty(property)
}
