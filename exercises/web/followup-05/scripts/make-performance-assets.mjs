import { mkdirSync, writeFileSync } from "node:fs";
const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="180" viewBox="0 0 640 180"><rect width="640" height="180" fill="#edf4ff"/><circle cx="320" cy="90" r="60" fill="#165a9c"/></svg>';
mkdirSync("public", { recursive: true });
writeFileSync("public/banner-optimized.svg", svg);
writeFileSync(
  "public/banner-original.svg",
  svg.replace(
    "</svg>",
    "<!--" + "unused metadata ".repeat(12000) + "--></svg>",
  ),
);
console.log("Generated original/optimized SVG fixtures");
