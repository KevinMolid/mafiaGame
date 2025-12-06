import React from "react";
import Button from "../components/Button";

interface ShopBoxProps {
  title: string;
  image: string;
  price: number;
  currencyIcon: string;
  priceColor: string;
  selected: boolean;
  onSelect: () => void;
  onBuy: () => void;
  isBuying?: boolean;
}

const ShopBox: React.FC<ShopBoxProps> = ({
  title,
  image,
  price,
  currencyIcon,
  priceColor,
  selected,
  onSelect,
  onBuy,
  isBuying = false,
}) => (
  <li
    onClick={onSelect}
    className={
      "border p-4 flex-1 flex-grow text-center cursor-pointer flex flex-col justify-center select-none " +
      (selected
        ? "col-span-2 row-start-2 bg-neutral-900 border-neutral-600 text-neutral-200"
        : "bg-neutral-800 hover:bg-neutral-700 border-transparent")
    }
  >
    <p className="text-center mb-4">{title}</p>
    <img src={image} className="mb-4" alt={title} />
    <p className={selected ? `${priceColor}` : "text-neutral-400"}>
      <i className={currencyIcon}></i>{" "}
      <strong>{price.toLocaleString("nb-NO")}</strong>
    </p>
    {selected && (
      <div className="mt-2">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onBuy();
          }}
          disabled={isBuying}
        >
          {isBuying ? "Kjøper..." : "Kjøp"}
        </Button>
      </div>
    )}
  </li>
);

export default ShopBox;
