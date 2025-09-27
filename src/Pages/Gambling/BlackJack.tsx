import { useEffect, useMemo, useRef, useState } from "react";
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

// ---------- Images ----------
const SUIT_SLUG: Record<Suit, "clubs" | "hearts" | "diamonds" | "spades"> = {
  "♣": "clubs",
  "♥": "hearts",
  "♦": "diamonds",
  "♠": "spades",
};

const RANK_SLUG: Record<Rank, string> = {
  A: "ace",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  "10": "10",
  J: "jack",
  Q: "queen",
  K: "king",
};

const CARD_BACK = "/images/cards/card_back.png";

function cardSrc(card: Card) {
  return `/images/cards/${RANK_SLUG[card.rank]}_of_${SUIT_SLUG[card.suit]}.png`;
}

function CardImg({
  card,
  hidden = false,
  title,
}: {
  card?: Card;
  hidden?: boolean;
  title?: string;
}) {
  const src = hidden || !card ? CARD_BACK : cardSrc(card);
  const alt = hidden || !card ? "Kortets bakside" : `${card.rank}${card.suit}`;
  return (
    <img
      src={src}
      alt={alt}
      title={title ?? alt}
      loading="lazy"
      className="h-24 w-auto rounded-sm shadow-sm border border-neutral-700 bg-neutral-800"
    />
  );
}

function HandRow({
  cards,
  hideHole = false,
}: {
  cards: Card[];
  hideHole?: boolean;
}) {
  return (
    <div className="flex gap-2 items-center flex-wrap">
      {cards.map((c, i) => (
        <CardImg key={i} card={c} hidden={hideHole && i === 1} />
      ))}
    </div>
  );
}
// -----------------------------

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

function handValue(cards: Card[]) {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    if (!c) continue;
    total += rawCardValue(c.rank);
    if (c.rank === "A") aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  const isSoft =
    cards.some((c) => c?.rank === "A") && total <= 21 && aces > 0
      ? true
      : false;
  return { total, isSoft };
}

function isBlackjack(cards: Card[]) {
  return cards.length === 2 && handValue(cards).total === 21;
}

const CUT_CARD_REMAINING = 52; // reshuffle when shoe drops below 1 deck

// ---------- Persistence ----------
type PersistedState = {
  phase: Phase;
  betAmount: number | "";
  effectiveBet: number;
  playerHand: Card[];
  dealerHand: Card[];
  shoe: Card[];
  message: string;
  messageType: "success" | "failure" | "info" | "warning";
};

const STORAGE_KEY_BASE = "blackjack:state";

const isCard = (c: any): c is Card =>
  !!c && RANKS.includes(c.rank) && SUITS.includes(c.suit);

const isPhase = (p: any): p is Phase =>
  p === "betting" ||
  p === "dealt" ||
  p === "player" ||
  p === "dealer" ||
  p === "settled";

function safeParseState(json: string | null): PersistedState | null {
  if (!json) return null;
  try {
    const obj = JSON.parse(json);
    if (!isPhase(obj.phase)) return null;

    const betAmount =
      obj.betAmount === "" || typeof obj.betAmount === "number"
        ? obj.betAmount
        : "";
    const effectiveBet =
      typeof obj.effectiveBet === "number" && obj.effectiveBet >= 0
        ? obj.effectiveBet
        : 0;

    const playerHand = Array.isArray(obj.playerHand)
      ? obj.playerHand.filter(isCard)
      : [];
    const dealerHand = Array.isArray(obj.dealerHand)
      ? obj.dealerHand.filter(isCard)
      : [];
    const shoe = Array.isArray(obj.shoe)
      ? obj.shoe.filter(isCard)
      : buildShoe(6);

    const messageType: PersistedState["messageType"] =
      obj.messageType === "success" ||
      obj.messageType === "failure" ||
      obj.messageType === "info" ||
      obj.messageType === "warning"
        ? obj.messageType
        : "info";

    const message = typeof obj.message === "string" ? obj.message : "";

    return {
      phase: obj.phase,
      betAmount,
      effectiveBet,
      playerHand,
      dealerHand,
      shoe,
      message,
      messageType,
    };
  } catch {
    return null;
  }
}
// ----------------------------------

const BlackJack = () => {
  const { userCharacter } = useCharacter();
  const userId = userCharacter?.id ?? "anon";
  const storageKey = `${STORAGE_KEY_BASE}:${userId}`;

  // Shoe in a ref (we mutate it and persist explicitly)
  const initialShoe = useMemo(() => buildShoe(6), []);
  const shoeRef = useRef<Card[]>(initialShoe);

  // Round state
  const [phase, setPhase] = useState<Phase>("betting");
  const [betAmount, setBetAmount] = useState<number | "">("");
  const [effectiveBet, setEffectiveBet] = useState<number>(0);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "info" | "warning"
  >("info");

  // Money
  const userMoney = (userCharacter as any)?.stats?.money ?? 0;
  const characterId = userCharacter?.id;
  const characterRef = characterId ? doc(db, "Characters", characterId) : null;

  // Load once per user
  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    const loaded = safeParseState(raw);
    if (loaded) {
      shoeRef.current = loaded.shoe.length ? loaded.shoe : buildShoe(6);
      setPhase(loaded.phase);
      setBetAmount(loaded.betAmount);
      setEffectiveBet(loaded.effectiveBet);
      setPlayerHand(loaded.playerHand);
      setDealerHand(loaded.dealerHand);
      setMessage(loaded.message);
      setMessageType(loaded.messageType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // --- Persist helper that writes EXACT values we want (avoid stale state) ---
  const persistNow = (overrides: Partial<PersistedState> = {}) => {
    const toSave: PersistedState = {
      phase,
      betAmount,
      effectiveBet,
      playerHand,
      dealerHand,
      message,
      messageType,
      shoe: shoeRef.current,
      ...overrides,
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(toSave));
    } catch (e) {
      console.warn("Could not persist blackjack state:", e);
    }
  };

  // Draw N cards and persist the shoe immediately
  const drawFromShoe = (n: number): Card[] => {
    let pool = shoeRef.current;

    if (!pool || pool.length < n || pool.length < CUT_CARD_REMAINING) {
      pool = buildShoe(6);
    }

    const next = [...pool];
    const taken: Card[] = [];
    for (let i = 0; i < n; i++) {
      const c = next.pop();
      if (c) taken.push(c);
    }
    while (taken.length < n) {
      const refill = buildShoe(6);
      next.push(...refill);
      const c = next.pop();
      if (c) taken.push(c);
    }

    shoeRef.current = next;
    // persist deck immediately, using current (possibly soon-to-change) state
    persistNow({ shoe: next });
    return taken;
  };

  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = sanitizeInt(e.target.value);
    const next = cleaned === "" ? "" : parseInt(cleaned, 10);
    setBetAmount(next);
    persistNow({ betAmount: next });
  };

  // Reset state for a new hand (keep shoe; reshuffle if low)
  const resetRound = (reshuffleIfNeeded = true) => {
    if (reshuffleIfNeeded && shoeRef.current.length < CUT_CARD_REMAINING) {
      shoeRef.current = buildShoe(6);
    }
    setPlayerHand([]);
    setDealerHand([]);
    setEffectiveBet(0);
    setMessage("");
    setMessageType("info");
    setPhase("betting");
    persistNow({
      playerHand: [],
      dealerHand: [],
      effectiveBet: 0,
      message: "",
      messageType: "info",
      phase: "betting",
      shoe: shoeRef.current,
    });
  };

  // ---- Money helpers ----
  const tryDebit = async (amount: number) => {
    if (!characterRef) return false;
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
      persistNow({ phase: "settled" });
      return;
    }
    let nextMessageType: PersistedState["messageType"] = messageType;

    if (outcome === "push") {
      await credit(effectiveBet);
      nextMessageType = "info";
    } else if (outcome === "playerBJ") {
      const payout = Math.floor((betAmount as number) * 2.5);
      await credit(payout);
      nextMessageType = "success";
    } else {
      nextMessageType = "failure";
    }
    setMessageType(nextMessageType);
    setPhase("settled");
    persistNow({ phase: "settled", messageType: nextMessageType });
  };

  const deal = async () => {
    if (!characterRef) {
      setMessageType("warning");
      setMessage("Du må være logget inn.");
      persistNow({ messageType: "warning", message: "Du må være logget inn." });
      return;
    }
    if (betAmount === "" || betAmount <= 0) {
      setMessageType("warning");
      setMessage("Skriv inn en gyldig innsats.");
      persistNow({
        messageType: "warning",
        message: "Skriv inn en gyldig innsats.",
      });
      return;
    }
    if ((betAmount as number) < 100) {
      setMessageType("warning");
      setMessage("Du må satse minst $100!");
      persistNow({
        messageType: "warning",
        message: "Du må satse minst $100!",
      });
      return;
    }
    if (userMoney < (betAmount as number)) {
      setMessageType("warning");
      setMessage("Du har ikke nok penger.");
      persistNow({
        messageType: "warning",
        message: "Du har ikke nok penger.",
      });
      return;
    }

    const debited = await tryDebit(betAmount as number);
    if (!debited) {
      setMessageType("failure");
      setMessage("Klarte ikke å reservere innsatsen. Prøv igjen.");
      persistNow({
        messageType: "failure",
        message: "Klarte ikke å reservere innsatsen. Prøv igjen.",
      });
      return;
    }

    if (shoeRef.current.length < CUT_CARD_REMAINING) {
      shoeRef.current = buildShoe(6);
      persistNow({ shoe: shoeRef.current });
    }

    const [p1, d1, p2, d2] = drawFromShoe(4);
    const nextPlayer = [p1, p2];
    const nextDealer = [d1, d2];
    const nextEffective = betAmount as number;

    setPlayerHand(nextPlayer);
    setDealerHand(nextDealer);
    setEffectiveBet(nextEffective);
    setPhase("dealt");

    // Persist the "dealt" state first
    persistNow({
      playerHand: nextPlayer,
      dealerHand: nextDealer,
      effectiveBet: nextEffective,
      phase: "dealt",
      message: "",
      messageType: "info",
    });

    const playerBJ = isBlackjack(nextPlayer);
    const dealerBJ = isBlackjack(nextDealer);

    if (playerBJ || dealerBJ) {
      if (playerBJ && dealerBJ) {
        const msg = `Uavgjort: Begge har Blackjack. Du fikk ${fmt(
          nextEffective
        )} tilbake.`;
        setMessage(msg);
        persistNow({ message: msg });
        await settleImmediate("push");
      } else if (playerBJ) {
        const win = Math.floor((betAmount as number) * 1.5);
        const msg = `Blackjack! Du vinner ${fmt(win)} (3:2).`;
        setMessage(msg);
        persistNow({ message: msg });
        await settleImmediate("playerBJ");
      } else {
        const msg = `Dealer har Blackjack. Du tapte ${fmt(nextEffective)}.`;
        setMessage(msg);
        persistNow({ message: msg });
        await settleImmediate("dealerBJ");
      }
      return;
    }

    setPhase("player");
    setMessageType("info");
    const msg = "Din tur: Trekk kort / Stå / Doble innsats";
    setMessage(msg);
    persistNow({ phase: "player", messageType: "info", message: msg });
  };

  const hit = () => {
    if (phase !== "player") return;
    const [card] = drawFromShoe(1);
    const next = [...playerHand, card];
    setPlayerHand(next);

    let nextPhase: Phase = phase;
    let nextMsg = message;
    let nextType: PersistedState["messageType"] = messageType;

    const { total } = handValue(next);
    if (total > 21) {
      nextType = "failure";
      nextMsg = `Bust! Du tapte ${fmt(effectiveBet)}.`;
      nextPhase = "settled";
      setMessageType(nextType);
      setMessage(nextMsg);
      setPhase(nextPhase);
    }

    persistNow({
      playerHand: next,
      phase: nextPhase,
      message: nextMsg,
      messageType: nextType,
    });
  };

  const stand = () => {
    if (phase !== "player" && phase !== "dealt") return;
    setPhase("dealer");
    persistNow({ phase: "dealer" });
    dealerPlay();
  };

  const double = async () => {
    if (phase !== "player") return;
    if (playerHand.length !== 2) {
      setMessageType("warning");
      const msg = "Du kan bare dobele på to kort.";
      setMessage(msg);
      persistNow({ messageType: "warning", message: msg });
      return;
    }
    if (!characterRef || betAmount === "") return;

    if (userMoney < (betAmount as number)) {
      setMessageType("warning");
      const msg = "Du har ikke nok penger til å doble.";
      setMessage(msg);
      persistNow({ messageType: "warning", message: msg });
      return;
    }
    const debited = await tryDebit(betAmount as number);
    if (!debited) {
      setMessageType("failure");
      const msg = "Klarte ikke å reservere doblingsbeløpet.";
      setMessage(msg);
      persistNow({ messageType: "failure", message: msg });
      return;
    }

    const nextEffective = effectiveBet * 2 || (betAmount as number) * 2;
    setEffectiveBet(nextEffective);

    const [card] = drawFromShoe(1);
    const next = [...playerHand, card];
    setPlayerHand(next);

    let nextPhase: Phase = "dealer";
    let nextMsg = message;
    let nextType: PersistedState["messageType"] = messageType;

    const { total } = handValue(next);
    if (total > 21) {
      nextType = "failure";
      nextMsg = `Bust etter dobling. Du tapte ${fmt(nextEffective)}.`;
      nextPhase = "settled";
      setMessageType(nextType);
      setMessage(nextMsg);
      setPhase(nextPhase);
    } else {
      setPhase("dealer");
    }

    persistNow({
      effectiveBet: nextEffective,
      playerHand: next,
      phase: nextPhase,
      message: nextMsg,
      messageType: nextType,
    });

    if (nextPhase !== "settled") {
      dealerPlay();
    }
  };

  // Dealer plays: Stand on all 17 (including soft 17)
  const dealerPlay = async () => {
    let d = [...dealerHand];
    while (true) {
      const hv = handValue(d);
      if (hv.total < 17) {
        const [c] = drawFromShoe(1);
        d = [...d, c];
      } else {
        break;
      }
    }
    setDealerHand(d);

    const p = handValue(playerHand).total;
    const dv = handValue(d).total;

    let nextPhase: Phase = "settled";
    let nextMsg = "";
    let nextType: PersistedState["messageType"] = "info";

    if (!characterRef) {
      setPhase(nextPhase);
      persistNow({ dealerHand: d, phase: nextPhase });
      return;
    }

    if (dv > 21) {
      await credit(effectiveBet * 2);
      nextType = "success";
      nextMsg = `Dealer bust! Du vant ${fmt(effectiveBet)}!`;
    } else if (p > dv) {
      await credit(effectiveBet * 2);
      nextType = "success";
      nextMsg = `Du vant ${fmt(effectiveBet)}!`;
    } else if (p < dv) {
      nextType = "failure";
      nextMsg = `Du tapte ${fmt(effectiveBet)}.`;
    } else {
      await credit(effectiveBet);
      nextType = "info";
      nextMsg = `Uavgjort – du fikk ${fmt(effectiveBet)} tilbake.`;
    }

    setMessageType(nextType);
    setMessage(nextMsg);
    setPhase(nextPhase);

    persistNow({
      dealerHand: d,
      phase: nextPhase,
      message: nextMsg,
      messageType: nextType,
    });
  };

  const canDouble = phase === "player" && playerHand.length === 2;
  const canDeal = phase === "betting";
  const canAct = phase === "player";

  const playerVal = handValue(playerHand).total;

  return (
    <div className="flex flex-col">
      <H2>BlackJack</H2>

      {message && <InfoBox type={messageType}>{message}</InfoBox>}

      {/* Table */}
      <div className="rounded border border-neutral-700 p-4 bg-neutral-900">
        {dealerHand.length !== 0 && (
          <div>
            {/* Dealer */}
            <div className="mb-4">
              <div className="font-semibold mb-1">Dealer</div>
              {dealerHand.length === 0 ? (
                <div className="text-neutral-400">—</div>
              ) : (
                <HandRow
                  cards={dealerHand}
                  hideHole={phase === "player" || phase === "dealt"}
                />
              )}
              {(phase === "dealer" || phase === "settled") && (
                <div className="text-sm text-neutral-300">
                  Sum: {dealerHand.length ? handValue(dealerHand).total : "—"}
                </div>
              )}
            </div>

            {/* Player */}
            <div className="mb-2">
              <div className="font-semibold mb-1">Dine kort</div>
              {playerHand.length ? (
                <HandRow cards={playerHand} />
              ) : (
                <div className="text-neutral-400">—</div>
              )}
              {playerHand.length > 0 && (
                <div className="text-sm text-neutral-300">Sum: {playerVal}</div>
              )}
            </div>
          </div>
        )}
        {/* Bet input (only editable in betting phase) */}
        {phase === "betting" && (
          <div>
            <H3>Hvor mye vil du satse?</H3>
            <input
              className="bg-transparent border-b border-neutral-600 py-1 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
              type="text"
              placeholder="Beløp"
              value={
                betAmount === ""
                  ? ""
                  : Number(betAmount).toLocaleString("nb-NO")
              }
              onChange={handleBetChange}
              disabled={!canDeal}
            />
            {canDeal &&
              betAmount !== "" &&
              (betAmount as number) > userMoney && (
                <p className="text-sm text-red-300 mt-1">
                  Du har ikke nok penger.
                </p>
              )}
            {canDeal && betAmount !== "" && (betAmount as number) < 100 && (
              <p className="text-sm text-red-300 mt-1">
                Du må satse minst $100!
              </p>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Button
            onClick={deal}
            disabled={
              !canDeal ||
              betAmount === "" ||
              (betAmount as number) < 100 ||
              (betAmount as number) > userMoney
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
              userMoney < (betAmount as number)
            }
          >
            Doble innsats
          </Button>
          {phase === "settled" && (
            <Button onClick={() => resetRound()}>Ny runde</Button>
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
