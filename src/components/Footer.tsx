import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="absolute flex justify-center gap-4 w-full bottom-0 bg-transparent text-stone-500 text-sm px-8 py-4 text-center">
      <p>
        <Link to="/salgsvilkaar">Salgsvilkår</Link>
      </p>
      <p>
        <Link to="/spillguide">Spillguide</Link>
      </p>
      <p>
        <Link to="/support">Support</Link>
      </p>
    </footer>
  );
};

export default Footer;
