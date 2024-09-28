import { ReactNode } from "react";

interface CrimeBoxInterface {
  children: ReactNode;
  img: string;
}

const CrimeBox = ({ children, img }: CrimeBoxInterface) => {
  return (
    <article className="grid grid-cols-1 grid-rows-1 w-72 h-40 bg-neutral-950 border border-neutral-600 hover:border-neutral-300 items-center text-center rounded-lg">
      <img
        className="w-full h-full object-cover col-start-1 row-start-1 rounded-lg"
        src={img}
        alt=""
      />
      <div className="w-full h-full bg-black/60 hover:bg-black/30 col-start-1 row-start-1 rounded-lg"></div>
      <p className="col-start-1 row-start-1 text-2xl font-bold tracking-wider">
        {children}
      </p>
    </article>
  );
};

export default CrimeBox;
