import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="bg-neutral-950 px-8 py-4 flex justify-between items-center">
      <img
        className="h-14"
        src="src\assets\LogoV1.png"
        alt="MafiaReign Logo: Fight for Dominance"
      />
      <nav>
        <ul className="flex gap-6">
          <li className="text-stone-400 hover:text-stone-200">About</li>
          <li className="text-stone-400 hover:text-stone-200">Forum</li>
          <li className="text-stone-400 hover:text-stone-200">Leaderboard</li>
          <li className="text-stone-400 hover:text-stone-200">
            <Link to="/login">Log in / Sign up</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
