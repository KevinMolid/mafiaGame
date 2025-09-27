import { useEffect, useState } from "react";

type DialogueProps = {
  imageSrc: string;
  imageAlt?: string;
  speaker?: string;
  lines: string[];
  startIndex?: number;
  onNext?(index: number): void;
  onComplete?(): void; // fires when landing on last line
  className?: string;
};

const Dialogue = ({
  imageSrc,
  imageAlt = "",
  speaker,
  lines,
  startIndex = 0,
  onNext,
  onComplete,
  className = "",
}: DialogueProps) => {
  const [i, setI] = useState(
    Math.min(startIndex, Math.max(0, lines.length - 1))
  );

  const isFirst = i <= 0;
  const isLast = i >= lines.length - 1;

  function goNext() {
    if (lines.length === 0 || isLast) return;
    const next = i + 1;
    setI(next);
    onNext?.(next);
  }

  function goPrev() {
    if (lines.length === 0 || isFirst) return;
    const prev = i - 1;
    setI(prev);
  }

  // Keyboard: Enter/Space/ArrowRight => Neste, ArrowLeft => Forrige
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, lines.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Optional: fire onComplete when user reaches the last line
  useEffect(() => {
    if (i === lines.length - 1) onComplete?.();
  }, [i, lines.length, onComplete]);

  if (!lines || lines.length === 0) return null;

  return (
    <div className={`w-[200px] ${className}`}>
      <img
        src={imageSrc}
        alt={imageAlt}
        className="w-[200px] h-[150px] object-cover border-2 border-slate-400"
      />

      {speaker && (
        <p className="font-medium bg-gradient-to-b from-slate-400 to-slate-700 text-white py-0.5 px-2 text-center border-b-2 border-slate-600 mb-1">
          {speaker}
        </p>
      )}

      {/* Click text box to go next */}
      <button
        type="button"
        onClick={goNext}
        className="w-full border bg-slate-800 text-white text-center border-neutral-600 p-2"
        aria-label="Neste linje"
        disabled={isLast}
      >
        <span>{lines[i]}</span>
      </button>

      <div className="mt-1 flex items-center justify-between">
        {/* Progress dots */}
        <div className="flex gap-1">
          {lines.map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5 w-1.5 rounded-full ${
                idx === i ? "bg-white" : "bg-slate-500"
              }`}
              aria-hidden
            />
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={isFirst}
            className="text-sm px-2 py-0.5 border border-slate-500 rounded disabled:opacity-50 hover:bg-slate-700 disabled:hover:bg-transparent"
          >
            Forrige
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={isLast}
            className="text-sm px-2 py-0.5 border border-slate-500 rounded disabled:opacity-50 hover:bg-slate-700 disabled:hover:bg-transparent"
          >
            Neste
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dialogue;
