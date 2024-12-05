import { ReactNode } from "react";

interface InfoBoxInterface {
  children: ReactNode;
  type: "success" | "failure" | "important" | "warning" | "info";
}

const InfoBox = ({ children, type }: InfoBoxInterface) => {
  const types = {
    success: "bg-green-300 border-green-600 text-green-800",
    failure: "bg-red-300 border-red-600 text-red-800",
    important: "bg-blue-300 border-blue-600 text-blue-800",
    warning: "bg-yellow-300 border-yellow-600 text-yellow-800",
    info: "bg-slate-300 border-slate-600 text-slate-800",
  };

  // Fallback to 'red' if color is not in the defined colorClasses
  const selectedType = types[type];

  return (
    <div className={`border py-2 px-4 rounded-lg mb-6 ${selectedType}`}>
      {children}
    </div>
  );
};

export default InfoBox;
