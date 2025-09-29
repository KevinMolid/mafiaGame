import { ReactNode } from "react";

interface MainInterface {
  children: ReactNode;
  img?: string;
}

const Main = ({ children, img }: MainInterface) => {
  return (
    <main
      className="px-4 sm:px-6 lg:px-8 xl:px-12 pt-4 sm:pt-6 lg:pt-8 xl:pt-12 pb-24 text-stone-400 flex-grow"
      style={{
        backgroundImage: img ? `url('/${img}.jpg')` : `url('/MafiaBg.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundPositionY: img === "dead" ? "center" : "top",
      }}
    >
      {children}
    </main>
  );
};

export default Main;
