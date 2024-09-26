const Infobar = () => {
  return (
    <section className="bg-neutral-700 px-8 py-2 flex gap-6 text-stone-400">
      <div className="flex items-center gap-2">
        <i className="fa-solid fa-heart"></i>
        <div className="bg-neutral-800 h-2 w-36">
          <div className="bg-green-500 h-2 w-36"></div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <p className="text-sm font-bold">XP</p>
        <div className="bg-neutral-800 h-2 w-36">
          <div className="bg-gray-400 h-2 w-3/4"></div>
        </div>
      </div>
    </section>
  );
};

export default Infobar;
