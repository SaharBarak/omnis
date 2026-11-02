/** A scene's one call to action, chosen by the page that renders it. */
export interface SceneAction {
  readonly href: string
  readonly label: string
}
