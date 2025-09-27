import React from "react";

type ItemProps = React.HTMLAttributes<HTMLSpanElement> & {
  name: string;
  tier?: number; // make it optional; default below
};

const TIER_CLASSES: Record<number, string> = {
  1: "text-neutral-400",
  2: "text-emerald-400",
  3: "text-sky-400",
  4: "text-violet-400",
  5: "text-amber-300",
};

const Item = ({ name, tier = 1, className = "", ...rest }: ItemProps) => {
  const color = TIER_CLASSES[tier] ?? "text-neutral-300";
  return (
    <span className={`font-bold inline-flex ${color} ${className}`} {...rest}>
      {name}
    </span>
  );
};

export default Item;
