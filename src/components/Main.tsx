import { ReactNode } from "react";

import DropdownMenu from "./DropdownLeft";

interface MainInterface {
  children: ReactNode;
  img?: string;
}

const Main = ({ children, img }: MainInterface) => {
  return (
    <div className="relative flex-grow">
      <DropdownMenu />

      <main
        className="px-4 sm:px-8 md:px-12 pt-4 sm:pt-8 md:pt-12 pb-24 text-stone-400"
        style={{
          backgroundImage: img ? `url('/${img}.jpg')` : `url('/MafiaBg.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundPositionY: "top",
        }}
      >
        {children}
      </main>
    </div>
  );
};

export default Main;
