import { useEffect, useMemo, useRef, useState } from "react";
import H2 from "../../components/Typography/H2";
import H3 from "../../components/Typography/H3";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";
import { useCharacter } from "../../CharacterContext";
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
// Deck / shoe
function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, suit });
  return deck;
}
function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
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
  let total = 0,
    aces = 0;
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

// ---------- Message shape & persistence ----------
type MessageShape =
  | { kind: "plain"; text: string }
  | { kind: "info"; text: string }
  | { kind: "warning"; text: string }
  | { kind: "win"; amount: number }
  | { kind: "lose"; amount: number }
  | { kind: "push"; amount: number }
  | { kind: "dealer_bust"; amount: number }
  | { kind: "player_bust"; amount: number };

function renderMessageFromShape(shape: MessageShape): React.ReactNode {
  const $ = (v: number) => (
    <>
      <i className="fa-solid fa-dollar-sign"></i> <strong>{fmt(v)}</strong>
    </>
  );
  switch (shape.kind) {
    case "win":
      return <p>Du vant {$(shape.amount)}!</p>;
    case "lose":
      return <p>Du tapte {$(shape.amount)}.</p>;
    case "push":
      return <p>Uavgjort – du fikk {$(shape.amount)} tilbake.</p>;
    case "dealer_bust":
      return <p>Dealer bust! Du vant {$(shape.amount)}!</p>;
    case "player_bust":
      return <p>Bust! Du tapte {$(shape.amount)}.</p>;
    case "warning":
      return <p>{shape.text}</p>;
    case "info":
      return <p>{shape.text}</p>;
    default:
      return <p>{shape.text}</p>;
  }
}

type PersistedState = {
  phase: Phase;
  betAmount: number | "";
  effectiveBet: number;
  playerHand: Card[];
  dealerHand: Card[];
  shoe: Card[];
  message: string; // plain, for fallback
  messageShape: MessageShape; // new: reconstruct JSX from this
  messageType: "success" | "failure" | "info" | "warning";
};

const STORAGE_KEY_BASE = "blackjack:state";
const isCard = (c: any): c is Card =>
  !!c && RANKS.includes(c.rank) && SUITS.includes(c.suit);
const isPhase = (p: any): p is Phase =>
  ["betting", "dealt", "player", "dealer", "settled"].includes(p);

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

    // messageShape fallback
    const messageShape: MessageShape =
      obj.messageShape && typeof obj.messageShape === "object"
        ? obj.messageShape
        : { kind: "plain", text: message };

    return {
      phase: obj.phase,
      betAmount,
      effectiveBet,
      playerHand,
      dealerHand,
      shoe,
      message,
      messageShape,
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

  // Shoe
  const initialShoe = useMemo(() => buildShoe(6), []);
  const shoeRef = useRef<Card[]>(initialShoe);

  // Round state
  const [phase, setPhase] = useState<Phase>("betting");
  const [betAmount, setBetAmount] = useState<number | "">("");
  const [effectiveBet, setEffectiveBet] = useState<number>(0);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [message, setMessage] = useState<React.ReactNode>("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "info" | "warning"
  >("info");
  const [messageText, setMessageText] = useState<string>(""); // persisted plain
  const [messageShape, setMessageShape] = useState<MessageShape>({
    // persisted shape
    kind: "plain",
    text: "",
  });

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
      setMessage(renderMessageFromShape(loaded.messageShape)); // ← rebuild JSX after reload
      setMessageText(loaded.message);
      setMessageShape(loaded.messageShape);
      setMessageType(loaded.messageType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Persist helper
  const persistNow = (overrides: Partial<PersistedState> = {}) => {
    const toSave: PersistedState = {
      phase,
      betAmount,
      effectiveBet,
      playerHand,
      dealerHand,
      message: messageText,
      messageShape, // persist the shape
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

  // Helper to set rich UI message + plain + shape (shape drives reload rendering)
  const setMsg = (
    node: React.ReactNode,
    plain: string,
    shape: MessageShape
  ) => {
    setMessage(node);
    setMessageText(plain);
    setMessageShape(shape);
    persistNow({ message: plain, messageShape: shape });
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
    persistNow({ shoe: next });
    return taken;
  };

  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = sanitizeInt(e.target.value);
    const next = cleaned === "" ? "" : parseInt(cleaned, 10);
    setBetAmount(next);
    persistNow({ betAmount: next });
  };

  // Reset state for a new hand
  const resetRound = (reshuffleIfNeeded = true) => {
    if (reshuffleIfNeeded && shoeRef.current.length < CUT_CARD_REMAINING) {
      shoeRef.current = buildShoe(6);
    }
    setPlayerHand([]);
    setDealerHand([]);
    setEffectiveBet(0);
    setMessage("");
    setMessageText("");
    setMessageShape({ kind: "plain", text: "" });
    setMessageType("info");
    setPhase("betting");
    persistNow({
      playerHand: [],
      dealerHand: [],
      effectiveBet: 0,
      message: "",
      messageShape: { kind: "plain", text: "" },
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
      setMsg(<p>Du må være logget inn.</p>, "Du må være logget inn.", {
        kind: "warning",
        text: "Du må være logget inn.",
      });
      return;
    }
    if (betAmount === "" || betAmount <= 0) {
      setMessageType("warning");
      setMsg(
        <p>Skriv inn en gyldig innsats.</p>,
        "Skriv inn en gyldig innsats.",
        { kind: "warning", text: "Skriv inn en gyldig innsats." }
      );
      return;
    }
    if ((betAmount as number) < 100) {
      setMessageType("warning");
      setMsg(<p>Du må satse minst $100!</p>, "Du må satse minst $100!", {
        kind: "warning",
        text: "Du må satse minst $100!",
      });
      return;
    }
    if (userMoney < (betAmount as number)) {
      setMessageType("warning");
      setMsg(<p>Du har ikke nok penger.</p>, "Du har ikke nok penger.", {
        kind: "warning",
        text: "Du har ikke nok penger.",
      });
      return;
    }

    const debited = await tryDebit(betAmount as number);
    if (!debited) {
      setMessageType("failure");
      setMsg(
        <p>Klarte ikke å reservere innsatsen. Prøv igjen.</p>,
        "Klarte ikke å reservere innsatsen. Prøv igjen.",
        {
          kind: "plain",
          text: "Klarte ikke å reservere innsatsen. Prøv igjen.",
        }
      );
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

    persistNow({
      playerHand: nextPlayer,
      dealerHand: nextDealer,
      effectiveBet: nextEffective,
      phase: "dealt",
      message: "",
      messageShape: { kind: "plain", text: "" },
      messageType: "info",
    });

    const playerBJ = isBlackjack(nextPlayer);
    const dealerBJ = isBlackjack(nextDealer);

    if (playerBJ || dealerBJ) {
      if (playerBJ && dealerBJ) {
        const plain = `Uavgjort: Begge har Blackjack. Du fikk ${fmt(
          nextEffective
        )} tilbake.`;
        setMsg(
          <p>
            Uavgjort: Begge har Blackjack. Du fikk{" "}
            <strong>{fmt(nextEffective)}</strong> tilbake.
          </p>,
          plain,
          { kind: "push", amount: nextEffective }
        );
        await settleImmediate("push");
      } else if (playerBJ) {
        const win = Math.floor((betAmount as number) * 1.5);
        const plain = `Blackjack! Du vinner ${fmt(win)} (3:2).`;
        setMsg(
          <p>
            Blackjack! Du vinner <strong>{fmt(win)}</strong> (3:2).
          </p>,
          plain,
          { kind: "win", amount: win }
        );
        await settleImmediate("playerBJ");
      } else {
        const plain = `Dealer har Blackjack. Du tapte ${fmt(nextEffective)}.`;
        setMsg(
          <p>
            Dealer har Blackjack. Du tapte <strong>{fmt(nextEffective)}</strong>
            .
          </p>,
          plain,
          { kind: "lose", amount: nextEffective }
        );
        await settleImmediate("dealerBJ");
      }
      return;
    }

    setPhase("player");
    setMessageType("info");
    setMsg(
      <p>Din tur: Trekk kort / Stå / Doble innsats</p>,
      "Din tur: Trekk kort / Stå / Doble innsats",
      { kind: "info", text: "Din tur: Trekk kort / Stå / Doble innsats" }
    );
  };

  const hit = () => {
    if (phase !== "player") return;
    const [card] = drawFromShoe(1);
    const next = [...playerHand, card];
    setPlayerHand(next);

    let nextPhase: Phase = phase;
    let nextType: PersistedState["messageType"] = messageType;
    let plain = messageText;
    let node: React.ReactNode = message;
    let shape = messageShape;

    const { total } = handValue(next);
    if (total > 21) {
      nextType = "failure";
      plain = `Bust! Du tapte ${fmt(effectiveBet)}.`;
      node = (
        <p>
          Bust! Du tapte <i className="fa-solid fa-dollar-sign"></i>{" "}
          <strong>{fmt(effectiveBet)}</strong>.
        </p>
      );
      shape = { kind: "player_bust", amount: effectiveBet };
      nextPhase = "settled";
      setMessageType(nextType);
      setMessage(node);
      setMessageText(plain);
      setMessageShape(shape);
      setPhase(nextPhase);
    }

    persistNow({
      playerHand: next,
      phase: nextPhase,
      message: plain,
      messageShape: shape,
      messageType: nextType,
    });
  };

  const stand = () => {
    if (phase !== "player" && phase !== "dealt") return;
    setPhase("dealer");
    persistNow({ phase: "dealer" });
    // Pass snapshots to avoid stale state issues
    dealerPlay([...playerHand], effectiveBet);
  };

  const double = async () => {
    if (phase !== "player") return;
    if (playerHand.length !== 2) {
      setMessageType("warning");
      setMsg(
        <p>Du kan bare dobele på to kort.</p>,
        "Du kan bare dobele på to kort.",
        { kind: "warning", text: "Du kan bare dobele på to kort." }
      );
      return;
    }
    if (!characterRef || betAmount === "") return;

    if (userMoney < (betAmount as number)) {
      setMessageType("warning");
      setMsg(
        <p>Du har ikke nok penger til å doble.</p>,
        "Du har ikke nok penger til å doble.",
        { kind: "warning", text: "Du har ikke nok penger til å doble." }
      );
      return;
    }
    const debited = await tryDebit(betAmount as number);
    if (!debited) {
      setMessageType("failure");
      setMsg(
        <p>Klarte ikke å reservere doblingsbeløpet.</p>,
        "Klarte ikke å reservere doblingsbeløpet.",
        { kind: "plain", text: "Klarte ikke å reservere doblingsbeløpet." }
      );
      return;
    }

    const nextEffective = effectiveBet * 2 || (betAmount as number) * 2;
    setEffectiveBet(nextEffective);

    const [card] = drawFromShoe(1);
    const next = [...playerHand, card];
    setPlayerHand(next);

    let nextPhase: Phase = "dealer";
    let nextType: PersistedState["messageType"] = messageType;
    let plain = messageText;
    let node: React.ReactNode = message;
    let shape = messageShape;

    const { total } = handValue(next);
    if (total > 21) {
      nextType = "failure";
      plain = `Bust etter dobling. Du tapte ${fmt(nextEffective)}.`;
      node = (
        <p>
          Bust etter dobling. Du tapte{" "}
          <i className="fa-solid fa-dollar-sign"></i>{" "}
          <strong>{fmt(nextEffective)}</strong>.
        </p>
      );
      shape = { kind: "player_bust", amount: nextEffective };
      nextPhase = "settled";
      setMessageType(nextType);
      setMessage(node);
      setMessageText(plain);
      setMessageShape(shape);
      setPhase(nextPhase);
    } else {
      setPhase("dealer");
    }

    persistNow({
      effectiveBet: nextEffective,
      playerHand: next,
      phase: nextPhase,
      message: plain,
      messageShape: shape,
      messageType: nextType,
    });

    if (nextPhase !== "settled") {
      // Pass snapshots to avoid stale state issues
      dealerPlay(next, nextEffective);
    }
  };

  // Dealer plays: Stand on all 17 (including soft 17)
  const dealerPlay = async (playerSnapshot: Card[], eff: number) => {
    let d = [...dealerHand];
    while (true) {
      const hv = handValue(d);
      if (hv.total < 17) {
        const [c] = drawFromShoe(1);
        d = [...d, c];
      } else break;
    }
    setDealerHand(d);

    const p = handValue(playerSnapshot).total;
    const dv = handValue(d).total;

    let nextPhase: Phase = "settled";
    let nextType: PersistedState["messageType"] = "info";
    let nextMsgNode: React.ReactNode = "";
    let nextMsgPlain = "";
    let nextShape: MessageShape = { kind: "plain", text: "" };

    if (!characterRef) {
      setPhase(nextPhase);
      persistNow({ dealerHand: d, phase: nextPhase });
      return;
    }

    if (dv > 21) {
      await credit(eff * 2);
      nextType = "success";
      nextShape = { kind: "dealer_bust", amount: eff };
      nextMsgPlain = `Dealer bust! Du vant ${fmt(eff)}!`;
      nextMsgNode = renderMessageFromShape(nextShape);
    } else if (p > dv) {
      await credit(eff * 2);
      nextType = "success";
      nextShape = { kind: "win", amount: eff };
      nextMsgPlain = `Du vant ${fmt(eff)}!`;
      nextMsgNode = renderMessageFromShape(nextShape);
    } else if (p < dv) {
      nextType = "failure";
      nextShape = { kind: "lose", amount: eff };
      nextMsgPlain = `Du tapte ${fmt(eff)}.`;
      nextMsgNode = renderMessageFromShape(nextShape);
    } else {
      await credit(eff);
      nextType = "info";
      nextShape = { kind: "push", amount: eff };
      nextMsgPlain = `Uavgjort – du fikk ${fmt(eff)} tilbake.`;
      nextMsgNode = renderMessageFromShape(nextShape);
    }

    setMessageType(nextType);
    setMessage(nextMsgNode);
    setMessageText(nextMsgPlain);
    setMessageShape(nextShape);
    setPhase(nextPhase);

    persistNow({
      dealerHand: d,
      phase: nextPhase,
      message: nextMsgPlain,
      messageShape: nextShape,
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

        {/* Bet input */}
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
          Innsats: <i className="fa-solid fa-dollar-sign"></i>{" "}
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
