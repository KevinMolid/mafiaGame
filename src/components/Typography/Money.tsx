type MoneyProps = {
  amount: number | null | undefined;
  locale?: string;
  className?: string;
};

export default function Money({
  amount,
  locale = "nb-NO",
  className = "",
}: MoneyProps) {
  const value = Number.isFinite(Number(amount)) ? Number(amount) : 0;

  return (
    <strong
      className={`text-yellow-400 ${className}`}
      title={value.toLocaleString(locale)}
    >
      <i className="fa-solid fa-dollar-sign"></i> {value.toLocaleString(locale)}
    </strong>
  );
}
