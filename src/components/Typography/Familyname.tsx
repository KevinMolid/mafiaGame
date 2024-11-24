import { Link } from "react-router-dom";

const Familyname = ({ family }: any) => {
  return (
    <Link to={`/familie/profil/${family.id}`}>
      <strong className="text-neutral-400 hover:underline">
        {family.name}
      </strong>
    </Link>
  );
};

export default Familyname;
