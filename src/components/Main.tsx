import { ReactNode } from "react";

interface MainInterface {
  children: ReactNode;
}

const Main = ({ children }: MainInterface) => {
  return (
    <main
      className="pb-24 sm:pb-24 p-4 sm:p-12 text-stone-400 flex-grow 
    bg-[url('/PrisonBg.jpg')] bg-cover"
    >
      {children}
    </main>
  );
};

export default Main;
