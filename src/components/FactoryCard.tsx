// components/FactoryCard.tsx
import React, { useState } from "react";
import Button from "./Button";
import Money from "../components/Typography/Money";

export type FactoryCardProps = {
  /** Title, e.g. "Våpenfabrikk" */
  title: string;
  /** Short description (can be string or JSX) */
  description: React.ReactNode;
  /** Price in whole currency units */
  price: number;
  /** Background image URL (optional) */
  imgSrc?: string;
  /** Called when the user clicks buy. Can be async. */
  onBuy: () => Promise<void> | void;
  /** Disable buying (e.g. not enough money) */
  disabled?: boolean;
  /** Already owned (shows a badge and disables buy) */
  owned?: boolean;
  /** Optional: production text shown at the bottom */
  productionText?: string; // e.g. "1 våpen/4 timer"
  /** Optional: requirement text shown at the bottom */
  requirementText?: string; // e.g. "Torpedo"
  /** Optional: info button click */
  onInfo?: () => void;
  /** Optional: details button click */
  onDetails?: () => void;
  /** Optional className for outer wrapper */
  className?: string;
  /** Custom text while purchasing */
  busyText?: string;
};

export default function FactoryCard({
  title,
  description,
  price,
  imgSrc,
  onBuy,
  disabled = false,
  owned = false,
  productionText = "1 våpen/4 timer",
  requirementText = "Torpedo",
  onInfo,
  onDetails,
  className = "",
  busyText = "Kjøper...",
}: FactoryCardProps) {
  const [busy, setBusy] = useState(false);

  const canBuy = !busy && !disabled && !owned;

  const handleBuy = async () => {
    if (!canBuy) return;
    try {
      setBusy(true);
      await onBuy();
    } finally {
      setBusy(false);
    }
  };

  return (
    <article
      className={
        "relative overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900/60 h-[400px] max-w-[300px] shadow-xl " +
        className
      }
      style={{ minHeight: 280 }}
    >
      {/* Background image layer */}
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{
          backgroundImage: imgSrc ? `url(${imgSrc})` : "none",
        }}
        aria-hidden="true"
      />
      {/* Fallback if no image */}
      {!imgSrc && (
        <div className="absolute inset-0 flex items-center justify-center text-neutral-600">
          <i className="fa-solid fa-industry text-4xl" />
        </div>
      )}
      {/* Scrim for readability */}
      <div className="absolute inset-0 bg-neutral-950/60" aria-hidden="true" />
      {/* Bottom gradient for extra contrast near controls */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
        style={{
          background:
            "linear-gradient(to top, rgba(23,23,23,0.9), rgba(23,23,23,0.0))",
        }}
      />

      {/* Owned ribbon */}
      {owned && (
        <span className="absolute right-2 top-2 z-20 rounded-md border-2 border-neutral-400 bg-neutral-800 px-2 py-0.5 text-xs font-semibold uppercase text-neutral-200">
          Eier
        </span>
      )}

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col pt-2 pb-6 px-3 md:px-4">
        {/* Top row: tags left, info right */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            <span className="rounded-lg bg-neutral-800/80 px-3 py-0.5 text-xs font-medium border border-neutral-700">
              Fabrikk
            </span>
            <span className="rounded-lg bg-neutral-800/80 px-3 py-0.5 text-xs font-medium border border-neutral-700">
              Nivå 1
            </span>
          </div>
          <Button
            type="button"
            style="help"
            size="small-square"
            onClick={onInfo}
            title="Info"
            aria-label="Info"
          >
            <i className="fa-regular fa-question" />
          </Button>
        </div>

        {/* Title & description */}
        <header className="mt-2">
          <h2 className="text-2xl font-bold leading-tight text-white">
            {title}
          </h2>
        </header>
        <p className="mt-1 leading-snug">{description}</p>

        {/* Spacer for middle of card */}
        <div className="flex-1" />

        {/* Bottom: production & requirement */}
        <div className="mt-2 mb-2 flex gap-2 justify-between text-sm text-neutral-300">
          <div className="flex-1">
            <div className="text-neutral-400">Produksjon:</div>
            <strong className="text-neutral-200">{productionText}</strong>
          </div>
          <div className="flex-1">
            <div className="text-neutral-400">Krav:</div>
            <strong className="text-neutral-200">{requirementText}</strong>
          </div>
        </div>

        <div className="text-lg">
          <strong className="mr-1 text-neutral-200">Pris:</strong>
          <Money amount={price} />
        </div>

        {/* Price + actions */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button
              style="secondary"
              onClick={onDetails}
              title="Se detaljer"
              type="button"
            >
              Detaljer
            </Button>

            <Button
              onClick={handleBuy}
              disabled={!canBuy}
              title={
                owned
                  ? "Du eier allerede denne fabrikken"
                  : disabled
                  ? "Du kan ikke kjøpe denne akkurat nå"
                  : "Kjøp"
              }
              type="button"
            >
              {busy ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" /> {busyText}
                </>
              ) : (
                <>Kjøp</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
