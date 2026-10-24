const esbuild = require("esbuild-wasm");
const fs = require("node:fs");
const path = require("node:path");
process.chdir(__dirname);
async function main() {
  if (process.argv.includes("--test")) {
    fs.mkdirSync(".test-build", { recursive: true });
    await esbuild.build({
      entryPoints: ["src/domain.ts"],
      bundle: true,
      platform: "node",
      format: "cjs",
      outfile: ".test-build/domain.cjs",
    });
    return;
  }
  fs.mkdirSync("dist", { recursive: true });
  fs.cpSync("public", "dist", { recursive: true });
  await esbuild.build({
    entryPoints: ["src/main.tsx"],
    bundle: true,
    outfile: "dist/app.js",
    platform: "browser",
    format: "iife",
    target: ["es2020"],
    minify: true,
    sourcemap: false,
    define: { "process.env.NODE_ENV": '"production"' },
    loader: { ".ttf": "file", ".woff": "file" },
    assetNames: "assets/[name]-[hash]",
  });
  console.log("Built dist/ entirely from local dependencies.");
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
