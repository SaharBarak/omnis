import coreWebVitals from "eslint-config-next/core-web-vitals";
import importX from "eslint-plugin-import-x";

/**
 * eslint-config-next v16 registers react-hooks / react / import / jsx-a11y
 * scoped to this glob. Override objects MUST reuse the same `files` scope:
 * an unscoped override applies to files (e.g. *.cjs bundles) where those
 * plugins are not registered, which breaks config resolution.
 */
const SOURCE_FILES = ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"];

export default [
  {
    // Scope lint to app source (src/) + packages/scraper/src.
    // Build output (.next is ignored by eslint-config-next, .open-next is
    // NOT) contains huge bundled *.js/*.cjs files that blow up lint time
    // and memory, so ignore all generated/non-source trees explicitly.
    ignores: [
      "**/node_modules/",
      ".next/",
      ".open-next/",
      ".wrangler/",
      "public/",
      "drizzle/",
      "workers/",
      "scripts/",
      "content/",
      "docs/",
      "specs/",
      "bugs/",
      // root-level config files (next.config.mjs, drizzle.config.ts, ...)
      "*.mjs",
      "*.js",
      "*.ts",
      "*.d.ts",
    ],
  },
  ...coreWebVitals,
  {
    // Import hygiene via eslint-plugin-import-x (maintained, flat-config
    // native fork of eslint-plugin-import). Only syntax-level rules are
    // enabled -- none of them require a module resolver, so no TS-resolver
    // cost per file (the classic eslint-plugin-import OOM on this repo).
    files: SOURCE_FILES,
    plugins: { "import-x": importX },
    rules: {
      // warn (not error): ordering violations are pervasive/pre-existing;
      // rule is autofixable and can be ratcheted to error later without
      // mass-editing the redesign branch now.
      "import-x/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling", "index"],
          ],
        },
      ],
      "import-x/no-duplicates": "warn",
      "import-x/first": "error",
    },
  },
  {
    files: SOURCE_FILES,
    rules: {
      "@next/next/no-img-element": "off",
      // Downgrade new strict React Compiler rules to warnings for now
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/refs": "warn",
    },
  },
];
