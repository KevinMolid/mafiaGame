import Tooltip from "./Tooltip";

const Infobar = () => {
  return (
    <section className="bg-neutral-700 px-8 py-2 flex gap-6 justify-center text-stone-400">
      <div className="flex items-center gap-2">
        <i className="fa-solid fa-heart"></i>
        <Tooltip label="Health bar">
          <div className="bg-neutral-800 h-2 w-36">
            <div className="bg-green-500 h-2 w-36"></div>
          </div>
        </Tooltip>
      </div>

      <div className="flex items-center gap-2">
        <p className="text-sm font-bold">XP</p>
        <Tooltip label="Experience points">
          <div className="bg-neutral-800 h-2 w-36">
            <div className="bg-gray-400 h-2 w-3/4"></div>
          </div>
        </Tooltip>
      </div>

      <div className="flex items-center gap-2">
        <i className="fa-solid fa-location-dot"></i>
        <Tooltip label="Your location">
          <p>New York City</p>
        </Tooltip>
      </div>

      <div className="flex items-center gap-2">
        <i className="fa-solid fa-dollar-sign"></i>
        <p>334.221</p>
      </div>

      <div className="flex items-center gap-2">
        <i className="fa-solid fa-shield-halved"></i>
        <p>84%</p>
      </div>
    </section>
  );
};

export default Infobar;
