import { useState, useEffect } from "react";
import c1 from "/images/characters/Carlo/Carlo Capone.jpg";
import c2 from "/images/characters/Carlo/Carlo Capone Help.jpg";
import c4 from "/images/characters/Carlo/Carlo Capone Smiling.png";
import c5 from "/images/characters/Carlo/Carlo Capone Wave square.jpg";

import street from "/images/characters/Carlo/Dark Street.png";

import Main from "../../components/Main";
import Button from "../../components/Button";

type BaseScene = {
  image: string;
  alt?: string;
};

type Scene =
  | (BaseScene & { type: "narration"; text: string })
  | (BaseScene & { type: "dialogue"; speaker: string; text: string });

const scenes: Scene[] = [
  {
    type: "narration",
    text: "Det er mørkt i gaten...",
    image: street,
    alt: "Mørk gate",
  },
  {
    type: "narration",
    text: "Så hører du en rask pust, skritt, og en hes stemme...",
    image: street,
    alt: "Mørk gate med fottrinn i det fjerne",
  },
  {
    type: "dialogue",
    speaker: "Fremmed mann",
    text: "Oi! Der er du. Perfekt timing. Jeg trenger en… eh… assistent. En jeg kan skylde på hvis noe går galt.",
    image: c5,
    alt: "Fremmed mann som ber om hjelp",
  },
  {
    type: "dialogue",
    speaker: "Fremmed mann",
    text: "Du må velge deg et navn. Og du må velge en by å starte i. Men bare så du vet det…",
    image: c1,
    alt: "Fremmed mann som forklarer",
  },
  {
    type: "dialogue",
    speaker: "Fremmed mann",
    text: "…alle byene er farlige. Og alle byene trenger folk som deg.",
    image: c4,
    alt: "Fremmed mann som ler",
  },
  {
    type: "dialogue",
    speaker: "Fremmed mann",
    text: "La oss sette i gang. Hva vil du kalle deg? Og hvor tør du å starte?",
    image: c2,
    alt: "Fremmed mann som ser deg rett i øynene",
  },
];

const Intro = () => {
  const [index, setIndex] = useState(0);
  const currentScene = scenes[index];

  // Typewriter state
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    const fullText = currentScene.text;
    setDisplayedText("");

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayedText(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(interval);
      }
    }, 25); // speed (ms per character)

    return () => clearInterval(interval);
  }, [index, currentScene.text]);

  const showPrev = () => setIndex((i) => Math.max(0, i - 1));
  const showNext = () => setIndex((i) => Math.min(scenes.length - 1, i + 1));

  return (
    <Main>
      <div className="flex gap-8 items-center h-60">
        <img
          src={currentScene.image}
          alt={currentScene.alt ?? "Scene-bilde"}
          className="w-60 h-60 object-cover border border-neutral-600 grayscale"
        />

        {/* 2-row grid: text stays on top, buttons stay fixed at bottom */}
        <div className="flex-1 grid grid-rows-[1fr_auto] py-4 gap-4 h-full">
          {/* === Row 1: Dialogue OR Narration === */}
          <div className="space-y-2 self-start">
            {currentScene.type === "dialogue" && (
              <>
                <p className="font-semibold text-sm uppercase tracking-wide text-neutral-400">
                  {currentScene.speaker}
                </p>
                <p className="text-xl text-neutral-200 max-w-96">
                  {displayedText}
                </p>
              </>
            )}

            {currentScene.type === "narration" && (
              <p className="text-lg italic text-neutral-300 max-w-96 px-4 py-3">
                {displayedText}
              </p>
            )}
          </div>

          {/* === Row 2: Dots + Navigation Buttons === */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {scenes.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={[
                    "h-2.5 rounded-full transition-all duration-200",
                    i === index
                      ? "w-5 bg-neutral-400"
                      : "w-2.5 bg-neutral-600 hover:bg-neutral-400",
                  ].join(" ")}
                  aria-label={`Scene ${i + 1}`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={showPrev} disabled={index === 0}>
                Forrige
              </Button>
              <Button onClick={showNext} disabled={index === scenes.length - 1}>
                Neste
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Main>
  );
};

export default Intro;
