type ItemTileProps = {
  name: string;
  img: string;
  tier: number;
  size?: string;
};

const ItemTile = ({ name, img, tier, size }: ItemTileProps) => {
  return (
    <div
      className={`flex ${
        size === "small" ? "h-12 w-12" : "h-16 w-16"
      } border-2 rounded-xl cursor-pointer ${
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
    >
      {img ? (
        <img
          src={img}
          alt={name ?? "Item"}
          className="w-full h-full object-cover rounded-xl"
        />
      ) : null}
    </div>
  );
};

export default ItemTile;
