import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execFileSync } from "node:child_process";

// Regenerate the media manifest whenever the dev server or a build starts,
// so dropping files into public/music, public/video or public/subtitles is
// reflected without any manual step.
function manifestPlugin() {
  const run = () => {
    try {
      execFileSync("node", ["scripts/generate-manifest.mjs"], { stdio: "inherit" });
    } catch (e) {
      console.warn("[manifest] generation failed:", e);
    }
  };
  return {
    name: "viktor-manifest",
    buildStart() {
      run();
    },
    configureServer() {
      run();
    },
  };
}

// Relative base => the same build works on GitHub Pages (project subpath)
// and on any custom hosting served from the domain root.
export default defineConfig({
  base: "./",
  plugins: [react(), manifestPlugin()],
});
