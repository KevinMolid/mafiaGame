// components/RankUpModal.tsx
import Button from "./Button";
import H2 from "./Typography/H2";
import H3 from "./Typography/H3";

import { RankRewardConfig, unlockLabels } from "../config/GameConfig";

type RankUpModalProps = {
  data: {
    rank: number;
    rankName: string;
    reward: RankRewardConfig | null;
  };
  onClose: () => void;
};

const RankUpModal = ({ data, onClose }: RankUpModalProps) => {
  const { rankName, reward } = data;

  const money = reward?.money ?? 0;
  const diamonds = reward?.diamonds ?? 0;
  const unlocks = reward?.unlocks ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-neutral-900 text-neutral-100 rounded-xl shadow-2xl p-6 w-full max-w-md border border-neutral-700">
        <H2>Ny rank oppnådd</H2>
        <p className="text-lg mb-4">
          Gratulerer, du har blitt{" "}
          <span className="font-semibold text-amber-300">{rankName}</span>!
        </p>

        {(money > 0 || diamonds > 0) && (
          <div className="mb-4 bg-neutral-800 rounded-lg p-3 border border-neutral-700">
            <H3>Belønning:</H3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {money > 0 && <li>{money.toLocaleString("nb-NO")} kr</li>}
              {diamonds > 0 && <li>{diamonds} diamanter</li>}
            </ul>
          </div>
        )}

        {unlocks.length > 0 && (
          <div className="mb-4 bg-neutral-800 rounded-lg p-3 border border-emerald-700">
            <H3>Nytt innhold låst opp:</H3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {unlocks.map((key) => (
                <li key={key}>{unlockLabels[key] ?? key}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-center mt-2">
          <Button onClick={onClose}>Fortsett</Button>
        </div>
      </div>
    </div>
  );
};

export default RankUpModal;
