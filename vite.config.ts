import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    plugins: ["typescript", "unicorn", "oxc"],
    categories: { correctness: "error" },
    env: { builtin: true },
    options: { typeAware: true, typeCheck: true },
  },
  fmt: { singleQuote: false, semi: true, sortPackageJson: true },
  staged: {
    "*": "vp check --fix",
  },
});
