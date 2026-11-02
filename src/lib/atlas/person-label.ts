/** How a person without a name is called on a map: by their place in the list. */
export const letterOf = (index: number): string => String.fromCharCode(65 + index)

/** The one label rule for a person on a map: their name, or "Person A" by position. */
export const personLabel = (name: string | null | undefined, index: number): string => name?.trim() || `Person ${letterOf(index)}`
