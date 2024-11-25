import H2 from "../components/Typography/H2";
import H3 from "../components/Typography/H3";

const Blacklist = () => {
  return (
    <div>
      <H2>Kontakter</H2>
      <p>Her er en liste over kontaktene dine.</p>
      <div className="grid grid-cols-2 mt-4 gap-8">
        <div className="border-r border-neutral-700 min-h-40">
          <H3>
            <i className="fa-solid fa-user-group"></i> Venner
          </H3>
        </div>
        <div>
          <H3>
            <i className="fa-solid fa-skull-crossbones"></i> Svarteliste
          </H3>
        </div>
      </div>
    </div>
  );
};

export default Blacklist;
