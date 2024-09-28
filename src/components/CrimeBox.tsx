import { ReactNode } from "react";

interface CrimeBoxInterface {
  children: ReactNode;
  heading: string;
  img: string;
  onClick: () => void;
}

const CrimeBox = ({ children, heading, img, onClick }: CrimeBoxInterface) => {
  return (
    <article className="grid grid-cols-1 grid-rows-1 w-72 h-40 bg-neutral-950 items-center text-center rounded-lg">
      <img
        className="w-full h-full object-cover col-start-1 row-start-1 rounded-lg"
        src={img}
        alt=""
      />
      <div
        className="w-full h-full bg-black/60 hover:bg-black/30 col-start-1 row-start-1 rounded-lg hover:cursor-pointer transition-all border border-neutral-600 hover:border-neutral-300"
        onClick={onClick}
      ></div>
      <div className="col-start-1 row-start-1 pointer-events-none">
        <p className="text-2xl font-bold tracking-wider">{heading}</p>
        <p className="text-stone-300">{children}</p>
      </div>
    </article>
  );
};

export default CrimeBox;
