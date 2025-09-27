import { useMemo, useState } from "react";
import H2 from "../../components/Typography/H2";
import H3 from "../../components/Typography/H3";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";

import { useCharacter } from "../../CharacterContext";

// Firestore money updates
import { getFirestore, doc, updateDoc, increment } from "firebase/firestore";

const db = getFirestore();

// --- Helpers ---
const sanitizeInt = (s: string) => s.replace(/[^\d]/g, "");
const fmt = (n: number) => n.toLocaleString("nb-NO");

// Card types
type Suit = "♠" | "♥" | "♦" | "♣";
type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";
type Card = { rank: Rank; suit: Suit };

type Phase = "betting" | "dealt" | "player" | "dealer" | "settled";

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const RANKS: Rank[] = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

// Build a single 52-card deck
function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, suit });
  return deck;
}

// Fisher-Yates
function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// Build a shoe with N decks
function buildShoe(numDecks = 6): Card[] {
  const shoe: Card[] = [];
  for (let i = 0; i < numDecks; i++) shoe.push(...buildDeck());
  shuffle(shoe);
  return shoe;
}

// Value helpers
function rawCardValue(rank: Rank): number {
  if (rank === "A") return 11;
  if (rank === "K" || rank === "Q" || rank === "J" || rank === "10") return 10;
  return parseInt(rank, 10);
}

// Returns best total <=21 if possible, otherwise minimum total (will be >21)
function handValue(cards: Card[]) {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    total += rawCardValue(c.rank);
    if (c.rank === "A") aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  const isSoft =
    cards.some((c) => c.rank === "A") && total <= 21 && aces > 0 ? true : false;
  return { total, isSoft };
}

function isBlackjack(cards: Card[]) {
  return cards.length === 2 && handValue(cards).total === 21;
}

function formatCards(cards: Card[]) {
  return cards.map((c) => `${c.rank}${c.suit}`).join(" ");
}

const CUT_CARD_REMAINING = 52; // reshuffle when shoe drops below 1 deck

const BlackJack = () => {
  const { userCharacter } = useCharacter();

  // Shoe
  const initialShoe = useMemo(() => buildShoe(6), []);
  const [shoe, setShoe] = useState<Card[]>(initialShoe);

  // Round state
  const [phase, setPhase] = useState<Phase>("betting");
  const [betAmount, setBetAmount] = useState<number | "">("");
  const [effectiveBet, setEffectiveBet] = useState<number>(0); // includes Double
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [message, setMessage] = useState<React.ReactNode>("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "info" | "warning"
  >("info");

  const userMoney = (userCharacter as any)?.stats?.money ?? 0;
  const characterId = userCharacter?.id;
  const characterRef = characterId ? doc(db, "Characters", characterId) : null;

  // Draw a card from the shoe (mutates shoe)
  const drawCard = () => {
    if (shoe.length === 0) {
      const newShoe = buildShoe(6);
      setShoe(newShoe);
      return newShoe.pop()!;
    }
    const c = shoe[shoe.length - 1];
    setShoe(shoe.slice(0, -1));
    return c;
  };

  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = sanitizeInt(e.target.value);
    if (cleaned === "") setBetAmount("");
    else setBetAmount(parseInt(cleaned, 10));
  };

  // Reset state for a new hand (keep shoe)
  const resetRound = (reshuffleIfNeeded = true) => {
    if (reshuffleIfNeeded && shoe.length < CUT_CARD_REMAINING) {
      setShoe(buildShoe(6));
    }
    setPlayerHand([]);
    setDealerHand([]);
    setEffectiveBet(0);
    setMessage("");
    setMessageType("info");
    setPhase("betting");
  };

  // ---- Money helpers ----
  const tryDebit = async (amount: number) => {
    if (!characterRef) return false;
    // optimistic check vs current money snapshot:
    if (userMoney < amount) return false;
    try {
      await updateDoc(characterRef, { "stats.money": increment(-amount) });
      return true;
    } catch (e) {
      console.error("Debit failed:", e);
      return false;
    }
  };

  const credit = async (amount: number) => {
    if (!characterRef) return;
    try {
      await updateDoc(characterRef, { "stats.money": increment(amount) });
    } catch (e) {
      console.error("Credit failed:", e);
    }
  };

  const settleImmediate = async (outcome: "push" | "playerBJ" | "dealerBJ") => {
    if (betAmount === "" || !characterRef) {
      setPhase("settled");
      return;
    }
    if (outcome === "push") {
      await credit(effectiveBet); // return stake
      setMessageType("info");
    } else if (outcome === "playerBJ") {
      // pay 3:2 => total back 2.5x stake (we already debited 1x on deal)
      const payout = Math.floor(betAmount * 2.5);
      await credit(payout);
      setMessageType("success");
    } else {
      // dealer BJ – nothing returned (stake already debited)
      setMessageType("failure");
    }
    setPhase("settled");
  };

  const deal = async () => {
    if (!characterRef) {
      setMessageType("warning");
      setMessage("Du må være logget inn.");
      return;
    }
    if (betAmount === "" || betAmount <= 0) {
      setMessageType("warning");
      setMessage("Skriv inn en gyldig innsats.");
      return;
    }
    if (betAmount < 100) {
      setMessageType("warning");
      setMessage("Du må satse minst $100!");
      return;
    }
    if (userMoney < betAmount) {
      setMessageType("warning");
      setMessage(`Du har ikke nok penger.`);
      return;
    }

    // Debit the stake up-front
    const debited = await tryDebit(betAmount);
    if (!debited) {
      setMessageType("failure");
      setMessage("Klarte ikke å reservere innsatsen. Prøv igjen.");
      return;
    }

    // fresh hand; optionally reshuffle if low
    if (shoe.length < CUT_CARD_REMAINING) {
      setShoe(buildShoe(6));
    }
    const p1 = drawCard();
    const d1 = drawCard();
    const p2 = drawCard();
    const d2 = drawCard();

    const player = [p1, p2];
    const dealer = [d1, d2];

    setPlayerHand(player);
    setDealerHand(dealer);
    setEffectiveBet(betAmount);
    setPhase("dealt");

    // Instant outcomes
    const playerBJ = isBlackjack(player);
    const dealerBJ = isBlackjack(dealer);

    if (playerBJ || dealerBJ) {
      if (playerBJ && dealerBJ) {
        setMessage("Uavgjort: Begge har Blackjack.");
        await settleImmediate("push");
      } else if (playerBJ) {
        const win = Math.floor(betAmount * 1.5);
        setMessage(
          <>
            Blackjack! Du vinner <strong>{fmt(win)}</strong> (3:2).
          </>
        );
        await settleImmediate("playerBJ");
      } else {
        setMessage("Dealer har Blackjack. Du taper.");
        await settleImmediate("dealerBJ");
      }
      return;
    }

    setPhase("player");
    setMessageType("info");
    setMessage("Din tur: Trekk kort / Stå / Doble innsats");
  };

  const hit = () => {
    if (phase !== "player") return;
    const card = drawCard();
    const next = [...playerHand, card];
    setPlayerHand(next);
    const { total } = handValue(next);
    if (total > 21) {
      setMessageType("failure");
      setMessage("Bust! Du taper.");
      setPhase("settled");
    }
  };

  const stand = () => {
    if (phase !== "player" && phase !== "dealt") return;
    setPhase("dealer");
    dealerPlay();
  };

  // Double (one card only, then stand). Will only proceed if player can afford an extra stake.
  const double = async () => {
    if (phase !== "player") return;
    if (playerHand.length !== 2) {
      setMessageType("warning");
      setMessage("Du kan bare dobele på to kort.");
      return;
    }
    if (!characterRef || betAmount === "") return;

    // Need to debit an *additional* original bet
    if (userMoney < betAmount) {
      setMessageType("warning");
      setMessage("Du har ikke nok penger til å doble.");
      return;
    }
    const debited = await tryDebit(betAmount);
    if (!debited) {
      setMessageType("failure");
      setMessage("Klarte ikke å reservere doblingsbeløpet.");
      return;
    }

    // Increase bet
    setEffectiveBet((b) => b * 2);
    const card = drawCard();
    const next = [...playerHand, card];
    setPlayerHand(next);

    const { total } = handValue(next);
    if (total > 21) {
      setMessageType("failure");
      setMessage("Bust etter dobling. Du taper.");
      setPhase("settled");
      return;
    }
    // otherwise dealer plays
    setPhase("dealer");
    dealerPlay();
  };

  // Dealer plays: Stand on all 17 (including soft 17)
  const dealerPlay = async () => {
    let d = [...dealerHand];
    while (true) {
      const hv = handValue(d);
      if (hv.total < 17) {
        d = [...d, drawCard()];
      } else {
        break; // stand on 17+ (S17)
      }
    }
    setDealerHand(d);

    const p = handValue(playerHand).total;
    const dv = handValue(d).total;

    if (!characterRef) {
      setPhase("settled");
      return;
    }

    if (dv > 21) {
      // Dealer bust – player wins even money
      await credit(effectiveBet * 2);
      setMessageType("success");
      setMessage("Dealer bust! Du vinner din innsats.");
      setPhase("settled");
      return;
    }

    if (p > dv) {
      await credit(effectiveBet * 2);
      setMessageType("success");
      setMessage("Du vinner!");
    } else if (p < dv) {
      // lose – nothing to credit (stake already debited)
      setMessageType("failure");
      setMessage("Du taper.");
    } else {
      // push – return stake
      await credit(effectiveBet);
      setMessageType("info");
      setMessage("Uavgjort!");
    }
    setPhase("settled");
  };

  const canDouble = phase === "player" && playerHand.length === 2;
  const canDeal = phase === "betting";
  const canAct = phase === "player";

  const playerVal = handValue(playerHand).total;
  const dealerUpCard = dealerHand[0];

  return (
    <div className="flex flex-col gap-4">
      <H2>BlackJack</H2>

      {message && <InfoBox type={messageType}>{message}</InfoBox>}

      {/* Bet input (only editable in betting phase) */}
      <div>
        <H3>Hvor mye vil du satse?</H3>
        <input
          className="bg-transparent border-b border-neutral-600 py-1 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
          type="text"
          placeholder="Beløp"
          value={
            betAmount === "" ? "" : Number(betAmount).toLocaleString("nb-NO")
          }
          onChange={handleBetChange}
          disabled={!canDeal}
        />
        {canDeal && betAmount !== "" && betAmount > userMoney && (
          <p className="text-sm text-red-300 mt-1">Du har ikke nok penger.</p>
        )}
        {canDeal && betAmount !== "" && betAmount < 100 && (
          <p className="text-sm text-red-300 mt-1">Du må satse minst $100!</p>
        )}
      </div>

      {/* Table */}
      <div className="rounded border border-neutral-700 p-4 bg-neutral-900">
        {/* Dealer */}
        <div className="mb-4">
          <div className="font-semibold mb-1">Dealer</div>
          <div className="text-xl">
            {dealerHand.length === 0
              ? "—"
              : phase === "player" || phase === "dealt"
              ? `${
                  dealerUpCard ? `${dealerUpCard.rank}${dealerUpCard.suit}` : ""
                }  [🂠]`
              : formatCards(dealerHand)}
          </div>
          {(phase === "dealer" || phase === "settled") && (
            <div className="text-sm text-neutral-300">
              Sum: {dealerHand.length ? handValue(dealerHand).total : "—"}
            </div>
          )}
        </div>

        {/* Player */}
        <div className="mb-2">
          <div className="font-semibold mb-1">Spiller</div>
          <div className="text-xl">
            {playerHand.length ? formatCards(playerHand) : "—"}
          </div>
          {playerHand.length > 0 && (
            <div className="text-sm text-neutral-300">Sum: {playerVal}</div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Button
            onClick={deal}
            disabled={
              !canDeal ||
              betAmount === "" ||
              betAmount < 100 ||
              betAmount > userMoney
            }
          >
            Del ut
          </Button>
          <Button onClick={hit} disabled={!canAct}>
            Trekk kort
          </Button>
          <Button onClick={stand} disabled={!canAct}>
            Stå
          </Button>
          <Button
            onClick={double}
            disabled={
              !canDouble ||
              betAmount === "" ||
              // require enough funds to place the additional original bet
              userMoney < (betAmount as number)
            }
          >
            Doble innsats
          </Button>
          {phase === "settled" && (
            <Button style="secondary" onClick={() => resetRound()}>
              Ny runde
            </Button>
          )}
        </div>

        {/* Bet & status */}
        <div className="mt-3 text-sm text-neutral-300">
          Innsats:{" "}
          <strong>
            {effectiveBet
              ? fmt(effectiveBet)
              : betAmount === ""
              ? 0
              : fmt(betAmount as number)}
          </strong>
          {!!effectiveBet && effectiveBet !== betAmount && " (doblet)"}
        </div>
      </div>
    </div>
  );
};

export default BlackJack;
