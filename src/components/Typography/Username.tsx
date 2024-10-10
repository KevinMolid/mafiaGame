import { Link } from "react-router-dom";

const Username = ({ character }: any) => {
  return (
    <Link to={`/profile/${character.id}`}>
      <strong className="text-white hover:underline">
        {character.username}
      </strong>
    </Link>
  );
};

export default Username;
