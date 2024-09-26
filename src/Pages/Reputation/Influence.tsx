import H1 from "../../components/Typography/H1";

const Influence = () => {
  return (
    <>
      <H1>Influence</H1>

      <aside className="grid grid-cols-4 gap-6 border border-neutral-700 px-6 py-4 pb-6 mb-6">
        <h2 className="col-span-full text-2xl text-stone-500 leading-none">
          Reputation
        </h2>
        <article>
          <h3>
            <i className="fa-solid fa-shield"></i> Police Force
          </h3>
          <div className="h-3 bg-neutral-800">
            <div className="h-3 bg-blue-400 w-2/4"></div>
          </div>
        </article>
        <article>
          <h3>
            <i className="fa-solid fa-landmark"></i> Political Corruption
          </h3>
          <div className="h-3 bg-neutral-800">
            <div className="h-3 bg-red-400 w-1/4"></div>
          </div>
        </article>
        <article>
          <h3>
            <i className="fa-solid fa-gun"></i> Street Gangs
          </h3>
          <div className="h-3 bg-neutral-800">
            <div className="h-3 bg-yellow-400 w-3/4"></div>
          </div>
        </article>
        <article>
          <h3>
            <i className="fa-solid fa-leaf"></i> Community Organizations
          </h3>
          <div className="h-3 bg-neutral-800">
            <div className="h-3 bg-green-400 w-1/12"></div>
          </div>
        </article>
      </aside>

      <div className="grid grid-cols-2 gap-6 border border-neutral-700 px-6 py-4 pb-6 mb-6">
        <div className="flex gap-4 items-center">
          <i className="fa-solid fa-shield text-6xl text-stone-500"></i>
          <div>
            <h2 className="text-2xl">Police Force</h2>
            <p className="text-stone-400">
              Gain favor with law enforcement to reduce scrutiny and gain
              protection.
            </p>
          </div>
        </div>
        <ul>
          <li>Bribe a Cop</li>
          <li>Provide a Tip</li>
          <li>Protect a Police Informant</li>
          <li>Fund a Charity Event</li>
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-6 border border-neutral-700 px-6 py-4 pb-6 mb-6">
        <div className="flex gap-4 items-center">
          <i className="fa-solid fa-landmark text-6xl text-stone-500"></i>
          <div>
            <h2 className="text-2xl">Political Corruption</h2>
            <p className="text-stone-400">
              Gain favor with politicians or corrupt officials to gain influence
              and power.
            </p>
          </div>
        </div>
        <ul>
          <li>Bribe a Politician</li>
          <li>Rig an Election</li>
          <li>Influence Policy Decisions</li>
          <li>Blackmail a Politician</li>
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-6 border border-neutral-700 px-6 py-4 pb-6 mb-6">
        <div className="flex gap-4 items-center">
          <i className="fa-solid fa-gun text-6xl text-stone-500"></i>
          <div>
            <h2 className="text-2xl">Street Gangs</h2>
            <p className="text-stone-400">
              Build respect and loyalty with local gangs for muscle and
              street-level influence.
            </p>
          </div>
        </div>
        <ul>
          <li>Recruit Gang Members</li>
          <li>Sell Guns/Drugs</li>
          <li>Organize a Turf War</li>
          <li>Fix a Gang Problem</li>
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-6 border border-neutral-700 px-6 py-4 pb-6 mb-6">
        <div className="flex gap-4 items-center">
          <i className="fa-solid fa-leaf text-6xl text-stone-500"></i>
          <div>
            <h2 className="text-2xl">Community Organizations</h2>
            <p className="text-stone-400">
              Gain respect and influence by appearing as a protector or
              benefactor to the community.
            </p>
          </div>
        </div>
        <ul>
          <li>Donate to a Local Charity</li>
          <li>Host a Community Event</li>
          <li>Protect a Local Business</li>
          <li>Influence Community Leaders</li>
        </ul>
      </div>
    </>
  );
};

export default Influence;
