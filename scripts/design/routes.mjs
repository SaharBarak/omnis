/**
 * The pages the Figma print covers (docs/redesign/FIGMA_PRINT.md §1), in the
 * groups the file's site page sections them by. Every route is read as a
 * visitor, with no session.
 */

export const ROUTE_GROUPS = /** @type {const} */ ([{ group: 'Wireframes', routes: ['/lab/bento/wireframes'] }]);

/** Every route, in group order. */
export const ROUTES = ROUTE_GROUPS.flatMap((entry) => entry.routes);

/** A route's file stem: `home` for the root, the path with `_` for `/` otherwise. */
export const stemOf = (route) => (route === '/' ? 'home' : route.slice(1).replaceAll('/', '_'));
