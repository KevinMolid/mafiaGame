interface ButtonInterface {
  children: string;
  onClick: () => void;
}

const Button = ({ children, onClick }: ButtonInterface) => {
  return (
    <button className="bg-sky-900 px-4 py-2" onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;
