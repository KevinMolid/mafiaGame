import React from "react";
import H2 from "../../components/Typography/H2";
import Button from "../../components/Button";

type Props = {
  onSell: () => void | Promise<void>;
  processing?: boolean;
};

const Narcotics: React.FC<Props> = ({ onSell, processing = false }) => {
  return (
    <div>
      <H2>Narkolab</H2>
      <p className="mb-4">
        Produser narkotika som kan gi forskjellige fordeler i spillet.
      </p>

      {/* optional confirmation to avoid accidental sells */}
      <Button
        style="danger"
        onClick={() => {
          if (processing) return;
          if (confirm("Er du sikker på at du vil selge denne fabrikken?")) {
            onSell();
          }
        }}
        disabled={processing}
      >
        {processing ? "Behandler..." : "Selg"}
      </Button>
    </div>
  );
};

export default Narcotics;
