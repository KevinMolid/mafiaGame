import { ReactNode } from "react";

interface CrimeBoxInterface {
  children: ReactNode;
  heading: string;
  img: string;
  onClick: () => void;
  isSelected: boolean;
}

const CrimeBox = ({
  children,
  heading,
  img,
  onClick,
  isSelected,
}: CrimeBoxInterface) => {
  return (
    <article className="grid grid-cols-1 grid-rows-1 w-72 h-40 bg-neutral-950 items-center text-center rounded-lg">
      <img
        className="w-full h-full object-cover col-start-1 row-start-1 rounded-lg"
        src={img}
        alt=""
      />
      <div
        className={`w-full h-full border ${
          isSelected
            ? "bg-black/30 border-neutral-300"
            : "bg-black/60 hover:bg-black/30 border border-neutral-700 hover:border-neutral-500"
        } col-start-1 row-start-1 rounded-lg transition-all cursor-pointer`}
        onClick={onClick}
      ></div>
      <div className="col-start-1 row-start-1 pointer-events-none text-stone-300">
        <p className="text-2xl font-bold tracking-wider text-white">
          {heading}
        </p>
        {children}
      </div>
    </article>
  );
};

export default CrimeBox;
