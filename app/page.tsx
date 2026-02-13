"use client";

import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";

const PATTERN = "<3";
const COLS = 160;
const ROWS = 60;
const THRESHOLD = 12;
const MESSAGE_WIDTH = 36;
const BUTTON_TEXT = "new valentine";
const BUTTON_PADDING_COLS = 1; // chars of horizontal padding inside the border

interface Valentine {
  id: number;
  message: string;
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

// Static background grid — never re-renders
const bgRows: string[] = Array.from({ length: ROWS }, (_, row) => {
  const offset = row % PATTERN.length;
  const line = PATTERN.repeat(Math.ceil((COLS + offset) / PATTERN.length));
  return line.slice(offset, offset + COLS);
});

// Precompute heart start columns per row (where '<' begins a full '<3')
const heartPositions: [number, number][] = [];
for (let r = 0; r < ROWS; r++) {
  const row = bgRows[r];
  for (let c = 0; c < COLS - 1; c++) {
    if (row[c] === "<" && row[c + 1] === "3") {
      heartPositions.push([r, c]);
    }
  }
}

const BackgroundGrid = memo(function BackgroundGrid() {
  return (
    <>
      {bgRows.map((row, r) => (
        <div key={r} style={{ whiteSpace: "pre" }}>
          {row.split("").map((char, c) => (
            <span
              key={c}
              style={{
                opacity: 0,
                color: "#E57FA9",
                transition: "opacity 1s ease-in-out",
              }}
            >
              {char}
            </span>
          ))}
        </div>
      ))}
    </>
  );
});

function computeMessagePosition(
  lines: string[],
  charWidth: number,
  lineHeight: number
) {
  const centerCol = Math.floor(window.innerWidth / 2 / charWidth);
  const centerRow = Math.floor(window.innerHeight / 2 / lineHeight);
  const startRow = Math.floor(centerRow - lines.length / 2);

  const msgCells = new Set<string>();
  for (let i = 0; i < lines.length; i++) {
    const startCol = Math.floor(centerCol - lines[i].length / 2);
    for (let j = 0; j < lines[i].length; j++) {
      const r = startRow + i;
      const c = startCol + j;
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
        msgCells.add(`${r}-${c}`);
      }
    }
  }

  // Button row: ~5 rows from the bottom of the visible area
  const totalVisibleRows = Math.floor(window.innerHeight / lineHeight);
  const buttonRow = Math.min(totalVisibleRows - 5, ROWS - 1);
  const buttonTextLen = BUTTON_TEXT.length + BUTTON_PADDING_COLS * 2;
  const buttonStartCol = Math.floor(centerCol - buttonTextLen / 2);

  // Mark button cells as message cells so hover doesn't reveal hearts behind them
  const bRow = buttonRow;
  if (bRow >= 0 && bRow < ROWS) {
    for (let j = 0; j < buttonTextLen; j++) {
      const c = buttonStartCol + j;
      if (c >= 0 && c < COLS) {
        msgCells.add(`${bRow}-${c}`);
      }
    }
  }

  return {
    startRow,
    centerCol,
    messageCells: msgCells,
    top: startRow * lineHeight,
    buttonRow,
    buttonStartCol,
  };
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
  const [messagePos, setMessagePos] = useState<{
    top: number;
    startRow: number;
    centerCol: number;
    buttonRow: number;
    buttonStartCol: number;
  } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef<Set<string>>(new Set());
  const messageCellsRef = useRef<Set<string>>(new Set());

  const lines = useMemo(
    () => (currentValentine ? wrapText(currentValentine.message, MESSAGE_WIDTH) : []),
    [currentValentine]
  );

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

  // Recalculate message position on resize or valentine change
  const updatePosition = useCallback(() => {
    if (!metrics || lines.length === 0) return;
    const pos = computeMessagePosition(lines, metrics.charWidth, metrics.lineHeight);

    // Hide any revealed hearts that now overlap with message cells
    const container = gridRef.current;
    if (container) {
      for (const key of visibleRef.current) {
        if (pos.messageCells.has(key)) {
          const [r, c] = key.split("-").map(Number);
          const span = container.children[r]?.children[c] as HTMLElement;
          if (span) span.style.opacity = "0";
        }
      }
      // Remove those keys from visible set
      for (const key of pos.messageCells) {
        visibleRef.current.delete(key);
      }
    }

    messageCellsRef.current = pos.messageCells;
    setMessagePos({
      top: pos.top,
      startRow: pos.startRow,
      centerCol: pos.centerCol,
      buttonRow: pos.buttonRow,
      buttonStartCol: pos.buttonStartCol,
    });
  }, [metrics, lines]);

  useEffect(() => {
    updatePosition();
  }, [updatePosition]);

  useEffect(() => {
    if (!metrics) return;
    const handleResize = () => updatePosition();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [metrics, updatePosition]);

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
  }, [currentValentine]);

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
          if (span) {
            span.style.transition = "none";
            span.style.opacity = "0";
          }
        }
      }

      for (const key of newVisible) {
        if (!visibleRef.current.has(key)) {
          const [r, c] = key.split("-").map(Number);
          const span = container.children[r]?.children[c] as HTMLElement;
          if (span) {
            span.style.transition = "none";
            span.style.opacity = "1";
          }
        }
      }

      visibleRef.current = newVisible;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [metrics]);

  // Twinkle effect — randomly fade hearts in and out
  useEffect(() => {
    const container = gridRef.current;
    if (!container || !metrics) return;

    const { charWidth, lineHeight } = metrics;
    const visibleCols = Math.floor(window.innerWidth / charWidth);
    const visibleRows = Math.floor(window.innerHeight / lineHeight);
    const visibleHearts = heartPositions.filter(
      ([r, c]) => r < visibleRows && c < visibleCols
    );

    // ~0.2% of visible hearts twinkling at any moment
    const count = Math.max(1, Math.floor(visibleHearts.length * 0.002));
    const TWINKLE_IN = 1000;
    const TWINKLE_HOLD = 500;
    const TWINKLE_OUT = 1000;
    const CYCLE = TWINKLE_IN + TWINKLE_HOLD + TWINKLE_OUT;
    // Stagger new twinkles so `count` are always active
    const interval = CYCLE / count;

    const twinkleOne = () => {
      const [r, c] = visibleHearts[Math.floor(Math.random() * visibleHearts.length)];
      // Skip if either char overlaps message or is currently hover-revealed
      const k1 = `${r}-${c}`;
      const k2 = `${r}-${c + 1}`;
      if (
        messageCellsRef.current.has(k1) || messageCellsRef.current.has(k2) ||
        visibleRef.current.has(k1) || visibleRef.current.has(k2)
      ) return;

      const rowEl = container.children[r];
      if (!rowEl) return;
      const span1 = rowEl.children[c] as HTMLElement;
      const span2 = rowEl.children[c + 1] as HTMLElement;
      if (!span1 || !span2) return;

      // Restore transition for twinkle and fade in
      span1.style.transition = "opacity 1s ease-in-out";
      span2.style.transition = "opacity 1s ease-in-out";
      span1.style.opacity = "0.7";
      span2.style.opacity = "0.7";

      // Fade out after hold
      setTimeout(() => {
        // Only fade out if not currently hover-revealed
        if (!visibleRef.current.has(k1)) span1.style.opacity = "0";
        if (!visibleRef.current.has(k2)) span2.style.opacity = "0";
      }, TWINKLE_IN + TWINKLE_HOLD);
    };

    const id = setInterval(twinkleOne, interval);
    return () => clearInterval(id);
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
        style={{ lineHeight: "1.2", backgroundImage: "radial-gradient(ellipse 400px 250px at center, #ffd0b090 0%, transparent 100%)" }}
      >
        <BackgroundGrid />
        {metrics && messagePos && lines.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: messagePos.top,
              left: 0,
              right: 0,
              lineHeight: "1.2",
              whiteSpace: "pre",
            }}
          >
            {lines.map((line, i) => {
              const startCol = Math.floor(messagePos.centerCol - line.length / 2);
              return (
                <div key={i} style={{ whiteSpace: "pre" }}>
                  {/* Invisible spacer to align to grid column */}
                  <span style={{ visibility: "hidden" }}>
                    {bgRows[messagePos.startRow + i]?.slice(0, startCol) ?? ""}
                  </span>
                  {line}
                </div>
              );
            })}
          </div>
        )}
        {metrics && messagePos && currentValentine && (
          <button
            onClick={getNewValentine}
            className="pointer-events-auto border-2 border-current rounded-lg bg-transparent hover:-translate-y-0.5 hover:bg-[#FFCFB0] transition-all duration-200"
            style={{
              position: "absolute",
              top: messagePos.buttonRow * metrics.lineHeight - 8,
              left: (messagePos.buttonStartCol) * metrics.charWidth,
              padding: "6px 10px",
              lineHeight: "1.2",
              whiteSpace: "pre",
              cursor: "pointer",
              float: "left",
            }}
          >
            {BUTTON_TEXT}
          </button>
        )}
      </div>
    </>
  );
}
