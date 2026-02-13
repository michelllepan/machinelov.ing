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
const FONT_SIZE = 36;
const TITLE_FONT_SIZE = 36;
const MAX_TEXT_WIDTH = WIDTH - 400;
const TITLE = "machinelov.ing";

const valentines: Valentine[] = JSON.parse(
  readFileSync(join(__dirname, "../public/valentines.json"), "utf-8")
);

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
    WIDTH / 2,
    HEIGHT / 2,
    0,
    WIDTH / 2,
    HEIGHT / 2,
    Math.min(WIDTH, HEIGHT) / 2
  );
  gradient.addColorStop(0, "#FFDCC7");
  gradient.addColorStop(0.9, BG_COLOR);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Valentine text
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = `${FONT_SIZE}px "JetBrains Mono", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const lines = wrapText(ctx as any, v.message, MAX_TEXT_WIDTH);
  const lineHeight = FONT_SIZE * 1.4;
  const totalHeight = lines.length * lineHeight;
  const startY = (HEIGHT - totalHeight) / 2;

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], WIDTH / 2, startY + i * lineHeight + lineHeight / 2);
  }

  // Site title at bottom
  ctx.font = `${TITLE_FONT_SIZE}px "JetBrains Mono", monospace`;
  ctx.fillStyle = TEXT_COLOR;
  ctx.fillText(TITLE, WIDTH / 2, HEIGHT - 80);

  const buffer = canvas.toBuffer("image/png");
  writeFileSync(join(outDir, `v-${v.id}.png`), buffer);
  console.log(`Generated og/v-${v.id}.png`);
}

console.log(`Done! Generated ${valentines.length} OG images.`);
