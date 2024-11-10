import { ReactNode } from "react";

interface MainInterface {
  children: ReactNode;
  img?: string;
}

const Main = ({ children, img }: MainInterface) => {
  return (
    <main
      className="px-4 sm:px-8 lg:px-12 pt-4 sm:pt-8 lg:pt-12 pb-24 text-stone-400 flex-grow"
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
  );
};

export default Main;
