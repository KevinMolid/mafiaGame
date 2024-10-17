import { ReactNode } from "react";

interface MainInterface {
  children: ReactNode;
  img?: string;
}

const Main = ({ children, img }: MainInterface) => {
  return (
    <main
      className={"pb-24 sm:pb-24 p-4 sm:p-12 text-stone-400 flex-grow "}
      style={{
        backgroundImage: img ? `url('/${img}.jpg')` : undefined,
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
