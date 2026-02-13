"use client";

import { useState, useEffect, useRef, useMemo } from "react";

const PATTERN = "<3";
const COLS = 160;
const ROWS = 60;
const THRESHOLD = 12;
const MESSAGE_WIDTH = 36;

interface Valentine {
  id: number;
  message: string;
}

interface CellData {
  char: string;
  isMessage: boolean;
}

function wrapText(text: string, width: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (line && line.length + 1 + word.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? line + " " + word : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export default function Home() {
  const [valentines, setValentines] = useState<Valentine[]>([]);
  const [currentValentine, setCurrentValentine] = useState<Valentine | null>(
    null
  );
  const [metrics, setMetrics] = useState<{
    charWidth: number;
    lineHeight: number;
  } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef<Set<string>>(new Set());
  const messageCellsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetch("/valentines.json")
      .then((res) => res.json())
      .then((data) => {
        setValentines(data);
        if (data.length > 0) {
          setCurrentValentine(data[Math.floor(Math.random() * data.length)]);
        }
      });
  }, []);

  // Measure character dimensions once
  useEffect(() => {
    if (metrics) return;
    const container = gridRef.current;
    if (!container) return;
    const firstRow = container.children[0] as HTMLElement;
    const firstSpan = firstRow?.children[0] as HTMLElement;
    if (!firstRow || !firstSpan) return;
    setMetrics({
      charWidth: firstSpan.getBoundingClientRect().width,
      lineHeight: firstRow.getBoundingClientRect().height,
    });
  });

  // Build grid with message embedded
  const { grid, messageCells } = useMemo(() => {
    const cells: CellData[][] = Array.from({ length: ROWS }, (_, row) => {
      const offset = row % PATTERN.length;
      const line = PATTERN.repeat(Math.ceil((COLS + offset) / PATTERN.length));
      return line
        .slice(offset, offset + COLS)
        .split("")
        .map((char) => ({ char, isMessage: false }));
    });

    const msgCells = new Set<string>();

    if (currentValentine && metrics) {
      const centerCol = Math.floor(
        window.innerWidth / 2 / metrics.charWidth
      );
      const centerRow = Math.floor(
        window.innerHeight / 2 / metrics.lineHeight
      );
      const lines = wrapText(currentValentine.message, MESSAGE_WIDTH);
      const startRow = Math.floor(centerRow - lines.length / 2);

      for (let i = 0; i < lines.length; i++) {
        const text = lines[i];
        const startCol = Math.floor(centerCol - text.length / 2);
        for (let j = 0; j < text.length; j++) {
          const r = startRow + i;
          const c = startCol + j;
          if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
            cells[r][c] = { char: text[j], isMessage: true };
            msgCells.add(`${r}-${c}`);
          }
        }
      }
    }

    return { grid: cells, messageCells: msgCells };
  }, [currentValentine, metrics]);

  // Clean up revealed hearts when valentine changes
  useEffect(() => {
    const container = gridRef.current;
    if (container) {
      for (const key of visibleRef.current) {
        const [r, c] = key.split("-").map(Number);
        const span = container.children[r]?.children[c] as HTMLElement;
        if (span) span.style.opacity = "0";
      }
    }
    visibleRef.current = new Set();
    messageCellsRef.current = messageCells;
  }, [messageCells]);

  // Mousemove handler
  useEffect(() => {
    const container = gridRef.current;
    if (!container || !metrics) return;

    const { charWidth, lineHeight } = metrics;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const minCol = Math.max(0, Math.floor((mx - THRESHOLD) / charWidth));
      const maxCol = Math.min(
        COLS - 1,
        Math.ceil((mx + THRESHOLD) / charWidth)
      );
      const minRow = Math.max(0, Math.floor((my - THRESHOLD) / lineHeight));
      const maxRow = Math.min(
        ROWS - 1,
        Math.ceil((my + THRESHOLD) / lineHeight)
      );

      const newVisible = new Set<string>();

      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          const key = `${r}-${c}`;
          if (messageCellsRef.current.has(key)) continue;
          const cx = c * charWidth + charWidth / 2;
          const cy = r * lineHeight + lineHeight / 2;
          const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
          if (dist <= THRESHOLD) {
            newVisible.add(key);
          }
        }
      }

      for (const key of visibleRef.current) {
        if (!newVisible.has(key)) {
          const [r, c] = key.split("-").map(Number);
          const span = container.children[r]?.children[c] as HTMLElement;
          if (span) span.style.opacity = "0";
        }
      }

      for (const key of newVisible) {
        if (!visibleRef.current.has(key)) {
          const [r, c] = key.split("-").map(Number);
          const span = container.children[r]?.children[c] as HTMLElement;
          if (span) span.style.opacity = "1";
        }
      }

      visibleRef.current = newVisible;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [metrics]);

  const getNewValentine = () => {
    if (valentines.length === 0) return;

    let newValentine;
    do {
      newValentine = valentines[Math.floor(Math.random() * valentines.length)];
    } while (valentines.length > 1 && newValentine.id === currentValentine?.id);

    setCurrentValentine(newValentine);
  };

  return (
    <>
      <div
        ref={gridRef}
        className="fixed inset-0 overflow-hidden select-none pointer-events-none"
        style={{ lineHeight: "1.2" }}
      >
        {grid.map((row, r) => (
          <div key={r} style={{ whiteSpace: "pre" }}>
            {row.map((cell, c) => (
              <span
                key={c}
                style={{
                  opacity: cell.isMessage ? 1 : 0,
                  color: cell.isMessage ? undefined : "#E57FA9",
                }}
              >
                {cell.char}
              </span>
            ))}
          </div>
        ))}
      </div>
      {currentValentine && (
        <div className="fixed bottom-0 left-0 right-0 pb-12 text-center pointer-events-none">
          <button
            onClick={getNewValentine}
            className="pointer-events-auto px-2.5 py-1 border-2 border-current rounded-lg"
          >
            new valentine
          </button>
        </div>
      )}
    </>
  );
}
