import { Link } from "react-router-dom";

const Familyname = ({ family }: any) => {
  return (
    <Link to={`/family/profile/${family.id}`}>
      <strong className="text-white hover:underline">{family.name}</strong>
    </Link>
  );
};

export default Familyname;
