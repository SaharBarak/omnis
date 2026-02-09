import coreWebVitals from "eslint-config-next/core-web-vitals";

export default [
  ...coreWebVitals,
  {
    rules: {
      "@next/next/no-img-element": "off",
      // Downgrade new strict React Compiler rules to warnings for now
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/refs": "warn",
      "import/no-anonymous-default-export": "warn",
    },
  },
];
