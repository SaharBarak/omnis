/**
 * The settings the plan does not carry, injected by the build
 * (build-plugin.mjs) from config.mjs, so the plugin holds no copy of them.
 */

export interface Settings {
  /** The shared plugin data namespace every key the plugin writes lives in. */
  readonly namespace: string;
  /** ms a request to the receiver may take before the plugin stops waiting. */
  readonly timeoutMs: number;
  /** The scale a route frame's PNG is exported at. */
  readonly exportScale: number;
  /** px between the blocks, the sections and the frames in them that the plugin lays out, and around what a section holds. */
  readonly gutter: number;
  /** px between the variants of a component set. */
  readonly spacing: number;
  /** The panel. */
  readonly panel: { readonly title: string; readonly width: number; readonly height: number };
  /**
   * The printer's stamp: a digest of the main thread as built with every
   * other setting. A unit's stored hash is its plan's under it, so a change
   * to how the plugin prints reprints every unit, as a change to the plan does.
   */
  readonly printer: string;
}

declare global {
  /** Replaced by the build with the settings object. */
  const PRINT_SETTINGS: Settings;
}

export const SETTINGS: Settings = PRINT_SETTINGS;
