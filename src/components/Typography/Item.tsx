interface ItemProps {
  name: string;
  tier: number;
  [key: string]: any; // Allows for additional attributes
}

const Item = (item: ItemProps) => {
  return (
    <span
      className={
        "font-bold inline-flex bg-neutral-800 py-1 px-4 rounded-full " +
        (item.tier == 1
          ? "text-neutral-400"
          : item.tier == 2
          ? "text-green-400"
          : item.tier == 3
          ? "text-blue-400"
          : item.tier == 4
          ? "text-purple-400"
          : item.tier == 5
          ? "text-yellow-400"
          : "")
      }
    >
      {item.name}
    </span>
  );
};

export default Item;
