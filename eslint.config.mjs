import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import tseslint from "typescript-eslint";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

const nextFiles = ["apps/{web,identity}/**/*.{js,jsx,ts,tsx}"];
const portalFiles = ["apps/portal/**/*.{js,jsx,ts,tsx}"];

const scope = (configs, files) => configs.map((config) => ({ ...config, files }));

export default [
  {
    ignores: [
      "**/.next/**",
      "**/dist/**",
      "**/node_modules/**",
      "**/next-env.d.ts",
      "**/staticfiles/**",
      "**/*.tsbuildinfo",
    ],
  },
  ...scope(compat.extends("next/core-web-vitals", "next/typescript"), nextFiles),
  { ...js.configs.recommended, files: portalFiles },
  ...scope(tseslint.configs.recommended, portalFiles),
  {
    files: portalFiles,
    rules: {
      "no-undef": "off",
    },
  },
];
