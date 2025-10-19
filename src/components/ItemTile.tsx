type ItemTileProps = {
  name: string;
  img: string;
  tier: number;
  size?: "small" | "default";
  qty?: number; // show badge when > 1
};

const ItemTile = ({
  name,
  img,
  tier,
  size = "default",
  qty,
}: ItemTileProps) => {
  const boxSize = size === "small" ? "h-12 w-12" : "h-16 w-16";
  const badgePadding = size === "small" ? "px-1 py-0" : "px-1.5 py-0.5";
  const badgeText = size === "small" ? "text-base" : "text-lg";

  return (
    <div
      className={`relative flex ${boxSize} border-2 rounded-xl cursor-pointer ${
        tier === 1
          ? "border-neutral-400 shadow-lg shadow-neutral-500/25"
          : tier === 2
          ? "border-emerald-400 shadow-lg shadow-neutral-500/25"
          : tier === 3
          ? "border-sky-400 shadow-lg shadow-sky-500/25"
          : tier === 4
          ? "border-purple-400 shadow-lg shadow-purple-500/25"
          : tier === 5
          ? "border-yellow-400 shadow-lg shadow-yellow-500/25"
          : ""
      }`}
      aria-label={qty && qty > 1 ? `${name} × ${qty}` : name}
      title={qty && qty > 1 ? `${name} × ${qty}` : name}
    >
      {img ? (
        <img
          src={img}
          alt={name || "Item"}
          className="w-full h-full object-cover rounded-xl"
        />
      ) : null}

      {qty !== undefined && qty > 1 && (
        <span
          className={`absolute bottom-0 right-0 rounded-xl ${badgePadding} ${badgeText} font-semibold
                    text-neutral-100`}
        >
          {qty}
        </span>
      )}
    </div>
  );
};

export default ItemTile;
