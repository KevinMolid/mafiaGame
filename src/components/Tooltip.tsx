import { ReactNode, useState } from "react";

interface TooltipInterface {
  children: ReactNode;
  label: string;
}

const Tooltip = ({ children, label }: TooltipInterface) => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const [active, setActive] = useState(false);

  const showTip = () => {
    timeout = setTimeout(() => {
      setActive(true);
    }, 400);
  };

  const hideTip = () => {
    clearInterval(timeout);
    setActive(false);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={showTip}
      onMouseLeave={hideTip}
    >
      {children}
      {active && (
        <span className="absolute bg-neutral-800 border border-neutral-600 px-2 py-1 z-10">
          {label}
        </span>
      )}
    </div>
  );
};

export default Tooltip;
