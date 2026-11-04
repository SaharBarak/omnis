/** Small counts spelled out for copy, so a sentence that counts something stays true when the count changes. */
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'] as const

/** `n` in words up to twelve, past that in figures (the usual style-guide cut). */
export const spelled = (n: number): string => WORDS[n] ?? String(n)

/** The same, with a capital, to open a sentence. */
export const Spelled = (n: number): string => {
  const word = spelled(n)
  return word.charAt(0).toUpperCase() + word.slice(1)
}
