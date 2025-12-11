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
    if (lines.length === 0) return;

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
  }, [i, lines.length, isLast]);

  if (!lines || lines.length === 0) return null;

  const isScene = !speaker;

  return (
    <div className={`w-full ${className}`}>
      {/* Bildet alene */}
      <img
        src={imageSrc}
        alt={imageAlt}
        className="w-full max-h-[calc(80vh-10rem)] object-cover"
      />

      {/* Tekst + knapper under bildet */}
      <div className="w-full text-neutral-100 px-4 py-8 flex flex-col items-center gap-3">
        {/* Speaker (bare i dialog-modus) */}
        {!isScene && (
          <p className="font-medium text-3xl border-b border-white/40 w-full max-w-48 text-center">
            {speaker}
          </p>
        )}

        {/* Rad: Forrige | TEKST | Neste */}
        <div className="w-full max-w-xl mx-auto flex items-center gap-2">
          {/* Forrige-knapp (venstre) */}
          <div className="shrink-0">
            {!isFirst && (
              <Button
                type="button"
                size="small"
                style="black"
                onClick={goPrev}
                disabled={isFirst}
              >
                Forrige
              </Button>
            )}
          </div>

          {/* Klikkbart tekstfelt (midt) */}
          <button
            type="button"
            onClick={goNext}
            className="flex-1 text-center px-2 py-1"
            aria-label={isLast ? "Ferdig" : "Neste linje"}
          >
            <div className="h-[4rem] overflow-y-auto px-1">
              {isScene ? (
                <p className="text-xl sm:text-2xl font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] leading-snug">
                  {lines[i]}
                </p>
              ) : (
                <p className="text-lg sm:text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] leading-snug">
                  {lines[i]}
                </p>
              )}
            </div>
          </button>

          {/* Neste / Ferdig (høyre) */}
          <div className="shrink-0">
            <Button type="button" size="small" style="black" onClick={goNext}>
              {isLast ? "Ferdig" : "Neste"}
            </Button>
          </div>
        </div>

        {/* Prikker under teksten */}
        <div className="mt-1 flex justify-center gap-1">
          {lines.map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5 w-1.5 rounded-full ${
                idx === i ? "bg-neutral-300" : "bg-neutral-600"
              }`}
              aria-hidden
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dialogue;
