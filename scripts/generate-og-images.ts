import { createCanvas } from "canvas";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

interface Valentine {
  id: number;
  message: string;
}

const WIDTH = 1200;
const HEIGHT = 630;
const BG_COLOR = "#ffeff4";
const TEXT_COLOR = "#B2004A";
const FONT_SIZE = 48;
const TITLE_FONT_SIZE = 48;
const PADDING = 50; // Spacing from edges
const MAX_TEXT_WIDTH = WIDTH - (PADDING * 2) - 300;
const TITLE = "machinelov.ing";

const data = JSON.parse(
  readFileSync(join(__dirname, "../public/valentines.json"), "utf-8")
);
const valentines: Valentine[] = [...data.mild, ...data.spicy];

const outDir = join(__dirname, "../public/og");
mkdirSync(outDir, { recursive: true });

function wrapText(
  ctx: ReturnType<typeof createCanvas>["getContext"],
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if ((ctx as any).measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

for (const v of valentines) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  // Background with radial gradient
  const gradient = ctx.createRadialGradient(
    WIDTH / 3,
    HEIGHT / 3,
    0,
    WIDTH / 2,
    HEIGHT / 2,
    Math.min(WIDTH, HEIGHT) / 1.5
  );
  gradient.addColorStop(0, "#FFDCC7");
  gradient.addColorStop(0.9, BG_COLOR);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Valentine text (top-left)
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = `${FONT_SIZE}px "JetBrains Mono", monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  const lines = wrapText(ctx as any, v.message, MAX_TEXT_WIDTH);
  const lineHeight = FONT_SIZE * 1.4;

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], PADDING, PADDING + i * lineHeight);
  }

  // Site title (bottom-right)
  ctx.font = `${TITLE_FONT_SIZE}px "JetBrains Mono", monospace`;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = TEXT_COLOR;
  ctx.fillText(TITLE, WIDTH - PADDING, HEIGHT - PADDING);

  const buffer = canvas.toBuffer("image/jpeg");
  writeFileSync(join(outDir, `v-${v.id}.jpeg`), buffer);
  console.log(`Generated og/v-${v.id}.jpeg`);
}

console.log(`Done! Generated ${valentines.length} OG images.`);
