/** How far into the viewport an element must come before an entrance or a sequence plays. */
export const ENTER_MARGIN = '0px 0px -12% 0px'

/** True while any part of the element is on screen: a reader may already see it, so nothing hides it. */
export const inView = (el: Element): boolean => {
  const { top, bottom } = el.getBoundingClientRect()
  return top < window.innerHeight && bottom > 0
}
