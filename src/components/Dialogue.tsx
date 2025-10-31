import { useEffect, useState } from "react";
import Button from "./Button";

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
    // if no lines, do nothing
    if (lines.length === 0) return;

    // if we're on the last line, finish
    if (isLast) {
      onComplete?.();
      return;
    }

    const next = i + 1;
    setI(next);
    onNext?.(next);
  }

  function goPrev() {
    if (lines.length === 0 || isFirst) return;
    const prev = i - 1;
    setI(prev);
  }

  // Keyboard: Enter/Space/ArrowRight => Neste/Ferdig, ArrowLeft => Forrige
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
  }, [i, lines.length, isLast]); // include isLast so effect has latest logic

  if (!lines || lines.length === 0) return null;

  return (
    <div className={`w-[300px] ${className}`}>
      <img
        src={imageSrc}
        alt={imageAlt}
        className="w-[300px] h-[225px] object-cover object-top rounded-lg border border-neutral-600 mb-1"
      />

      {speaker && (
        <p className="font-medium bg-neutral-800 text-neutral-200 py-1 px-2 text-center rounded-lg border border-neutral-600">
          {speaker}
        </p>
      )}

      {/* Click text box to go next */}
      <button
        type="button"
        onClick={goNext}
        className="w-full text-neutral-200 text-lg min-h-32 text-center p-2"
        aria-label={isLast ? "Ferdig" : "Neste linje"}
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
                idx === i ? "bg-neutral-400" : "bg-neutral-600"
              }`}
              aria-hidden
            />
          ))}
        </div>

        <div className="flex gap-1">
          <Button
            type="button"
            size="small"
            style="black"
            onClick={goPrev}
            disabled={isFirst}
          >
            Forrige
          </Button>
          <Button type="button" size="small" style="black" onClick={goNext}>
            {isLast ? "Ferdig" : "Neste"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dialogue;
