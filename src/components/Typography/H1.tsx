interface H1Interface {
  children: string;
}

const H1 = ({ children }: H1Interface) => {
  return <h1 className="text-4xl mb-6">{children}</h1>;
};

export default H1;
