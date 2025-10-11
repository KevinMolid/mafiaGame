// components/FactoryCard.tsx
import React, { useState } from "react";
import Button from "./Button";
import Money from "../components/Typography/Money";

export type FactoryCardProps = {
  title: string;
  description: React.ReactNode;
  price: number;
  icon?: string;
  img?: string;
  onBuy: () => Promise<void> | void;
  productionText?: string;
  requirementText?: string;
  onInfo?: () => void;
  onDetails?: () => void;
  className?: string;
  busyText?: string;
};

export default function FactoryCard({
  title,
  description,
  price,
  icon,
  img,
  onBuy,
  productionText = "1 våpen/4 timer",
  requirementText = "Torpedo",
  onInfo,
  className = "",
  busyText = "Kjøper...",
}: FactoryCardProps) {
  const [busy, setBusy] = useState(false);

  const handleBuy = async () => {
    if (busy) return;
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
        "relative overflow-hidden rounded-xl border border-neutral-600 bg-neutral-900 h-96 w-64 shadow-xl " +
        className
      }
      style={{ minHeight: 280 }}
    >
      {icon && (
        <div className="absolute inset-0 flex items-center justify-center text-neutral-700">
          <i className={`fa-solid fa-${icon} text-9xl`} />
        </div>
      )}
      {img && (
        <div
          className="w-full absolute inset-0"
          style={{
            backgroundImage: `url(${img})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        ></div>
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
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40"
        style={{
          background:
            "linear-gradient(to bottom, rgba(23,23,23,0.9), rgba(23,23,23,0.0))",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col pt-4 pb-6 px-4">
        {/* Top row: tags left, info right */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            <span className="rounded-lg bg-sky-500/25 px-3 py-0.5 text-sky-200/70 text-sm font-medium border border-sky-300/50">
              Fabrikk
            </span>
            <span className="rounded-lg bg-yellow-500/25 px-3 py-0.5 text-yellow-200/70 text-sm font-medium border border-yellow-300/50">
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
          <div className="flex flex-col w-full gap-2">
            <Button
              onClick={handleBuy}
              disabled={busy}
              title={"Kjøp"}
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
