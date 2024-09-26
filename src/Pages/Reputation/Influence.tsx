import H1 from "../../components/Typography/H1";

const Influence = () => {
  return (
    <main className="p-12">
      <H1>Influence</H1>
      <aside className="grid grid-cols-4 gap-6 border border-neutral-700 px-6 py-4 pb-6">
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
    </main>
  );
};

export default Influence;
