// StreetRacing.tsx
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import H3 from "../components/Typography/H3";
import Box from "../components/Box";
import Button from "../components/Button";
import Item from "../components/Typography/Item";
import InfoBox from "../components/InfoBox";
import Username from "../components/Typography/Username";

import racingBadgeI from "/images/streetracing/RacingIsmall.png";
import racingBadgeII from "/images/streetracing/RacingIIsmall.png";
import racingBadgeIII from "/images/streetracing/RacingIIIsmall.png";
import racingBadgeIV from "/images/streetracing/RacingIVsmall.png";
import racingBadgeV from "/images/streetracing/RacingVsmall.png";

import { useCharacter } from "../CharacterContext";
import { getCarByKey, getCarByName } from "../Data/Cars";

// GTA-style helpers for damage/value display
import { dmgPercent, valueAfterDamage } from "../Functions/RewardFunctions";

// Firestore
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  where,
  doc,
  serverTimestamp,
  runTransaction,
  updateDoc,
  getDoc,
} from "firebase/firestore";

const db = getFirestore();

type CarDoc = {
  id: string;
  key?: string;
  name?: string;
  brand?: string;
  model?: string;
  hp?: number;
  value?: number;
  tier?: number;
  city?: string;
  img?: string | null;
  damage?: number; // 0–100
  [k: string]: any;
  inRace?: {
    raceId: string;
    role: "creator" | "challenger";
    since: any; // Firestore Timestamp
  } | null;
};

type MsgType = "success" | "failure" | "info" | "warning";

type RaceStatus = "open" | "in_progress" | "finished" | "archived";

type RaceDoc = {
  id: string;
  city: string | null;
  status: RaceStatus;
  createdAt: any;
  acceptedAt?: any;
  finishedAt?: any;
  creator: {
    id: string;
    username: string;
    carId: string;
    car: {
      name: string;
      hp?: number | null;
      value?: number | null;
      tier?: number;
      img?: string | null;
      damage?: number | null;
    };
    done?: boolean; // <- player acknowledged
  };
  challenger?: {
    id: string;
    username: string;
    carId: string;
    car: {
      name: string;
      hp?: number | null;
      value?: number | null;
      tier?: number;
      img?: string | null;
      damage?: number | null;
    };
    done?: boolean; // <- player acknowledged
  };
  winnerId?: string;
  result?: { totalCreator: number; totalChallenger: number };
  effects?: {
    creator: { ratingDelta: number; damageDelta: number };
    challenger: { ratingDelta: number; damageDelta: number };
  };
};

// ---------- tiny deterministic RNG helpers (for stage logs) ----------
function strHash(s: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// ------------ Win / Loss helpers -----------------------
function winDelta(r: number) {
  if (r < 500) return 5;
  if (r < 1000) return 4;
  if (r < 1500) return 3;
  if (r < 2000) return 2;
  return 1;
}
function lossDelta(r: number) {
  if (r < 500) return -1;
  if (r < 1000) return -2;
  if (r < 1500) return -3;
  if (r < 2000) return -4;
  return -5;
}

// ------------ Damage helpers ---------------------------
const randDamage = () => Math.floor(Math.random() * 15) + 1; // 1..15

// ------------ Tooltip helpers --------------------------
const clamp0to100 = (n: any) => Math.min(100, Math.max(0, Number(n ?? 0)));

function renderCarTooltip(args: {
  hp?: number | null;
  damage?: number | null;
  value?: number | null;
}) {
  const hp = args.hp ?? null;
  const dmg = dmgPercent(args.damage); // normalized % as in GTA
  const baseVal = args.value ?? null;
  const valAfter =
    baseVal != null ? valueAfterDamage(Number(baseVal) || 0, dmg) : null;

  return (
    <div>
      {hp != null && (
        <p>
          Effekt: <strong className="text-neutral-200">{hp} hk</strong>
        </p>
      )}
      <p>
        Skade: <strong className="text-neutral-200">{dmg}%</strong>
      </p>
      {valAfter != null && (
        <p>
          Verdi:{" "}
          <strong className="text-neutral-200">
            <i className="fa-solid fa-dollar-sign"></i>{" "}
            {Number(valAfter).toLocaleString("nb-NO")}
          </strong>
        </p>
      )}
    </div>
  );
}

const StreetRacing = () => {
  const { userCharacter } = useCharacter();

  // still use character location to filter the garage
  const currentCity = (userCharacter as any)?.location;

  const [carsInCity, setCarsInCity] = useState<CarDoc[]>([]);
  const [activeCarId, setActiveCarId] = useState<string | null>(null);

  const [newRaceMessage, setNewRaceMesssage] = useState<React.ReactNode>("");
  const [newRacemessageType, setNewRaceMessageType] = useState<MsgType>("info");

  const [openRaces, setOpenRaces] = useState<RaceDoc[]>([]);
  const [myOpenRace, setMyOpenRace] = useState<RaceDoc | null>(null);

  // Unacknowledged finished race for me (blocks create/accept)
  const [myPendingFinished, setMyPendingFinished] = useState<RaceDoc | null>(
    null
  );

  // Accept-flow UI states
  const [pendingRace, setPendingRace] = useState<RaceDoc | null>(null);
  const [acceptCarId, setAcceptCarId] = useState<string | null>(null);

  const [racingStats, setRacingStats] = useState({
    rating: 0,
    wins: 0,
    losses: 0,
  });

  useEffect(() => {
    if (!userCharacter?.id) return;
    const ref = doc(db, "Characters", userCharacter.id);
    return onSnapshot(ref, (snap) => {
      const d = snap.data() || {};
      setActiveCarId(d?.activeCarId ?? null);

      const rs = d?.racingStats || {};
      setRacingStats({
        rating: Number(rs?.rating ?? 0),
        wins: Number(rs?.wins ?? 0),
        losses: Number(rs?.losses ?? 0),
      });
    });
  }, [userCharacter?.id]);

  // Race animation UI
  type RaceView = {
    raceId: string;
    creator: {
      id: string;
      username: string;
      img?: string | null;
      hp: number;
      tier: number;
      name: string;
      damage?: number;
      value?: number;
    };
    challenger: {
      id: string;
      username: string;
      img?: string | null;
      hp: number;
      tier: number;
      name: string;
      damage?: number;
      value?: number;
    };
    winnerId: string;
    effects?: {
      creator: { ratingDelta: number; damageDelta: number };
      challenger: { ratingDelta: number; damageDelta: number };
    };
  } | null;

  const [raceView, setRaceView] = useState<RaceView>(null);
  const [racePositions, setRacePositions] = useState<{
    creator: number;
    challenger: number;
  }>({
    creator: 0,
    challenger: 0,
  });
  const rafRef = useRef<number | null>(null);
  const raceStartRef = useRef<number | null>(null);
  const speedsRef = useRef<{ creator: number; challenger: number }>({
    creator: 0.2,
    challenger: 0.2,
  });
  const raceOverRef = useRef(false);

  // Subscribe to character for activeCarId (used when creating your own challenge)
  useEffect(() => {
    if (!userCharacter?.id) return;
    const ref = doc(db, "Characters", userCharacter.id);
    return onSnapshot(ref, (snap) => {
      const d = snap.data() || {};
      setActiveCarId(d?.activeCarId ?? null);
    });
  }, [userCharacter?.id]);

  // Subscribe to cars in current city
  useEffect(() => {
    if (!userCharacter?.id || !currentCity) {
      setCarsInCity([]);
      return;
    }
    const carsCol = collection(db, "Characters", userCharacter.id, "cars");
    const qCity = query(carsCol, where("city", "==", currentCity));
    return onSnapshot(
      qCity,
      (snap) => {
        const arr: CarDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setCarsInCity(arr);
      },
      () => setCarsInCity([])
    );
  }, [userCharacter?.id, currentCity]);

  // Subscribe to ALL open challenges
  useEffect(() => {
    const qOpen = query(
      collection(db, "Streetraces"),
      where("status", "==", "open")
    );
    return onSnapshot(qOpen, (snap) => {
      const arr: RaceDoc[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setOpenRaces(arr);
    });
  }, []);

  // Subscribe to MY open challenge
  useEffect(() => {
    if (!userCharacter?.id) {
      setMyOpenRace(null);
      return;
    }
    const qMine = query(
      collection(db, "Streetraces"),
      where("status", "==", "open"),
      where("creator.id", "==", userCharacter.id)
    );
    return onSnapshot(qMine, (snap) => {
      const docs = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as RaceDoc[];
      setMyOpenRace(docs[0] ?? null);
    });
  }, [userCharacter?.id]);

  // Subscribe to my UNACKNOWLEDGED finished race (two queries merged client-side)
  useEffect(() => {
    if (!userCharacter?.id) {
      setMyPendingFinished(null);
      return;
    }

    const qAsCreator = query(
      collection(db, "Streetraces"),
      where("status", "==", "finished"),
      where("creator.id", "==", userCharacter.id)
    );
    const qAsChallenger = query(
      collection(db, "Streetraces"),
      where("status", "==", "finished"),
      where("challenger.id", "==", userCharacter.id)
    );

    let latestCreator: RaceDoc[] = [];
    let latestChallenger: RaceDoc[] = [];

    const mergeAndSet = () => {
      // Only races where *I* haven’t acknowledged yet
      const mine = [
        ...latestCreator.filter((r) => !r.creator?.done),
        ...latestChallenger.filter((r) => !r.challenger?.done),
      ];
      // pick the most recent unfinished (or null)
      const next =
        mine.sort(
          (a, b) =>
            (b.finishedAt?.toMillis?.() ?? 0) -
            (a.finishedAt?.toMillis?.() ?? 0)
        )[0] ?? null;
      setMyPendingFinished(next);
    };

    const unsub1 = onSnapshot(qAsCreator, (snap) => {
      latestCreator = snap.docs.map(
        (d) => ({ id: d.id, ...(d.data() as any) } as RaceDoc)
      );
      mergeAndSet();
    });

    const unsub2 = onSnapshot(qAsChallenger, (snap) => {
      latestChallenger = snap.docs.map(
        (d) => ({ id: d.id, ...(d.data() as any) } as RaceDoc)
      );
      mergeAndSet();
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [userCharacter?.id]);

  // Prepare garage with catalog meta
  const withCatalog = (c: CarDoc) => {
    const catalog = c.key ? getCarByKey(c.key) : getCarByName(c.name || "");
    const damage = clamp0to100(c.damage);
    return {
      ...c,
      img: c.img ?? catalog?.img ?? null,
      hp: c.hp ?? catalog?.hp ?? null,
      value: c.value ?? catalog?.value ?? null,
      tier: c.tier ?? catalog?.tier ?? 1,
      damage,
      displayName:
        c.name || [c.brand, c.model].filter(Boolean).join(" ") || "Bil",
    };
  };

  const enriched = useMemo(() => carsInCity.map(withCatalog), [carsInCity]);
  const hasUsableCar = enriched.some((c) => (c.damage ?? 0) < 100);

  const activeCar = useMemo(
    () =>
      activeCarId ? enriched.find((c) => c.id === activeCarId) || null : null,
    [activeCarId, enriched]
  );

  // Persist active car selection (for creating your own challenge)
  const setActiveCar = useCallback(
    async (carId: string) => {
      if (!userCharacter?.id) return;
      setActiveCarId(carId); // optimistic
      try {
        await updateDoc(doc(db, "Characters", userCharacter.id), {
          activeCarId: carId,
        });
      } catch (e) {
        setNewRaceMesssage("Kunne ikke sette aktiv bil.");
        setNewRaceMessageType("failure");
      }
    },
    [userCharacter?.id]
  );

  // Start my challenge (blocked if I have one, or if I have an unacknowledged finished race)
  async function handleStartRace() {
    if (!userCharacter?.id || !activeCar) return;
    if ((activeCar.damage ?? 0) >= 100) {
      return;
    }

    try {
      await runTransaction(db, async (tx) => {
        // Re-read my chosen car inside the tx
        const carRef = doc(
          db,
          "Characters",
          userCharacter.id,
          "cars",
          activeCar.id
        );
        const carSnap = await tx.get(carRef);
        if (!carSnap.exists()) throw new Error("Bilen finnes ikke lenger.");
        const car = carSnap.data() as any;

        if (car.inRace) throw new Error("Denne bilen er allerede i et løp.");

        // Create race with fixed id so we can reference it from the car lock
        const raceRef = doc(collection(db, "Streetraces"));

        tx.set(raceRef, {
          status: "open" as RaceStatus,
          createdAt: serverTimestamp(),
          city: userCharacter.location ?? null,
          creator: {
            id: userCharacter.id,
            username: userCharacter.username ?? "Ukjent",
            carId: activeCar.id,
            car: {
              name: activeCar.displayName,
              hp: activeCar.hp ?? null,
              value: activeCar.value ?? null,
              tier: activeCar.tier ?? 1,
              img: activeCar.img ?? null,
              damage: activeCar.damage ?? 0,
            },
            done: false,
          },
        });

        // Lock the car
        tx.update(carRef, {
          inRace: {
            raceId: raceRef.id,
            role: "creator",
            since: serverTimestamp(),
          },
        });
      });

      setNewRaceMesssage(
        "Utfordring startet! Den er nå synlig for andre spillere."
      );
      setNewRaceMessageType("success");
    } catch (e: any) {
      console.error(e);
      setNewRaceMesssage(e?.message || "Klarte ikke å starte løp.");
      setNewRaceMessageType("failure");
    }
  }

  // Cancel my open challenge (unlock my car + delete race)
  async function handleCancelMyRace() {
    if (!myOpenRace || !userCharacter?.id) return;
    try {
      await runTransaction(db, async (tx) => {
        const raceRef = doc(db, "Streetraces", myOpenRace.id);
        const raceSnap = await tx.get(raceRef);
        if (!raceSnap.exists()) return;

        const v = raceSnap.data() as any;
        if (v.status !== "open") {
          throw new Error("Kan ikke avbryte nå.");
        }

        const creatorCarId = v?.creator?.carId;
        if (creatorCarId) {
          const creatorCarRef = doc(
            db,
            "Characters",
            userCharacter.id,
            "cars",
            creatorCarId
          );
          const creatorCarSnap = await tx.get(creatorCarRef);
          if (creatorCarSnap.exists()) {
            tx.update(creatorCarRef, { inRace: null });
          }
        }

        tx.delete(raceRef);
      });

      setNewRaceMesssage("Utfordringen ble avbrutt.");
      setNewRaceMessageType("success");
    } catch (e) {
      console.error(e);
      setNewRaceMesssage("Kunne ikke avbryte utfordringen.");
      setNewRaceMessageType("failure");
    }
  }

  // Click "Ta utfordringen" → switch into take-on view (selection) mode
  function beginAcceptFlow(r: RaceDoc) {
    if (!hasUsableCar) {
      setNewRaceMesssage("Du trenger en bil for å delta.");
      setNewRaceMessageType("warning");
      return;
    }
    if (myOpenRace) {
      setNewRaceMesssage(
        "Du kan ikke ta en utfordring mens du har en aktiv utfordring."
      );
      setNewRaceMessageType("warning");
      return;
    }
    if (myPendingFinished) {
      setNewRaceMesssage(
        "Fullfør/avslutt det aktive løpet før du tar en ny utfordring."
      );
      setNewRaceMessageType("warning");
      return;
    }
    setPendingRace(r);
    setAcceptCarId(null); // must select
  }

  // Confirm acceptance after user picked a car
  async function confirmAcceptRace() {
    if (!pendingRace || !userCharacter?.id || !acceptCarId) return;
    const car = enriched.find((c) => c.id === acceptCarId);
    if (!car) {
      setNewRaceMesssage("Ugyldig bilvalg.");
      setNewRaceMessageType("failure");
      return;
    }
    if ((car.damage ?? 0) >= 100) {
      setNewRaceMesssage("Valgt bil har 100% skade og kan ikke brukes.");
      setNewRaceMessageType("warning");
      return;
    }

    const ref = doc(db, "Streetraces", pendingRace.id);

    try {
      // Transaction: claim race + set challenger + pick winner + apply damage + update rating
      await runTransaction(db, async (tx) => {
        // --- READS ---------------------------------------------------------
        const raceSnap = await tx.get(ref);
        if (!raceSnap.exists()) throw new Error("Løpet finnes ikke.");
        const v = raceSnap.data() as any;
        if (v.status !== "open")
          throw new Error("Utfordringen er allerede tatt.");
        if (v.creator?.id === userCharacter.id)
          throw new Error("Du kan ikke ta din egen utfordring.");

        const creatorRef = doc(db, "Characters", v.creator.id);
        const challengerRef = doc(db, "Characters", userCharacter.id);

        const creatorCarId = v?.creator?.carId;
        if (typeof creatorCarId !== "string" || !creatorCarId) {
          throw new Error("Motstanderens bil-ID mangler på løpet.");
        }

        const creatorCarRef = doc(
          db,
          "Characters",
          v.creator.id,
          "cars",
          creatorCarId
        );
        const challengerCarRef = doc(
          db,
          "Characters",
          userCharacter.id,
          "cars",
          car.id
        );

        const [creatorSnap, challengerSnap, creatorCarSnap, challengerCarSnap] =
          await Promise.all([
            tx.get(creatorRef),
            tx.get(challengerRef),
            tx.get(creatorCarRef),
            tx.get(challengerCarRef),
          ]);

        // ---- hard existence checks for cars; soft for characters -----------
        if (!creatorCarSnap.exists()) {
          throw new Error("Motstanderens bil finnes ikke lenger.");
        }
        if (!challengerCarSnap.exists()) {
          throw new Error("Bilen din finnes ikke lenger.");
        }

        // If a Character doc might be missing, we’ll upsert later with tx.set(..., {merge:true})
        const creatorCharacterExists = creatorSnap.exists();
        const challengerCharacterExists = challengerSnap.exists();

        // ---- derive data ---------------------------------------------------
        const creatorData = (creatorSnap.data() as any) || {};
        const challengerData = (challengerSnap.data() as any) || {};

        const cStats = creatorData.racingStats || {};
        const hStats = challengerData.racingStats || {};

        const creatorRating = Number(cStats.rating ?? 0);
        const creatorWins = Number(cStats.wins ?? 0);
        const creatorLosses = Number(cStats.losses ?? 0);

        const challRating = Number(hStats.rating ?? 0);
        const challWins = Number(hStats.wins ?? 0);
        const challLosses = Number(hStats.losses ?? 0);

        const cHP = Number(v.creator?.car?.hp ?? 0);
        const hHP = Number(car.hp ?? 0);
        const total = Math.max(1, cHP + hHP);
        const pCreator = cHP / total;
        const rnd = Math.random();
        const winnerId = rnd < pCreator ? v.creator.id : userCharacter.id;

        // car damage
        const creatorCarData = (creatorCarSnap.data() as any) || {};
        const challengerCarData = (challengerCarSnap.data() as any) || {};
        const creatorDamagePrev = Math.min(
          100,
          Number(creatorCarData.damage ?? 0)
        );
        const challengerDamagePrev = Math.min(
          100,
          Number(challengerCarData.damage ?? 0)
        );
        if (creatorDamagePrev >= 100) {
          throw new Error(
            "Motstanderens bil har 100% skade og kan ikke brukes."
          );
        }
        if (challengerDamagePrev >= 100) {
          throw new Error("Bilen din har 100% skade og kan ikke brukes.");
        }

        // ratings
        let newCreatorRating = creatorRating;
        let newChallRating = challRating;
        let newCreatorWins = creatorWins;
        let newChallWins = challWins;
        let newCreatorLosses = creatorLosses;
        let newChallLosses = challLosses;

        if (winnerId === v.creator.id) {
          newCreatorRating += winDelta(creatorRating);
          newChallRating += lossDelta(challRating);
          newCreatorWins += 1;
          newChallLosses += 1;
        } else {
          newChallRating += winDelta(challRating);
          newCreatorRating += lossDelta(creatorRating);
          newChallWins += 1;
          newCreatorLosses += 1;
        }
        newCreatorRating = Math.max(0, newCreatorRating);
        newChallRating = Math.max(0, newChallRating);

        const creatorRatingDelta = newCreatorRating - creatorRating;
        const challengerRatingDelta = newChallRating - challRating;

        // damage increments
        const creatorInc = randDamage();
        const challengerInc = randDamage();
        const creatorDamageNew = Math.min(100, creatorDamagePrev + creatorInc);
        const challengerDamageNew = Math.min(
          100,
          challengerDamagePrev + challengerInc
        );

        // flavor totals
        const seed = strHash(pendingRace.id);
        const rng = mulberry32(seed);
        const s1 = Math.round(rng() * 10);
        const s2 = Math.round(rng() * 10);
        const s3 = Math.round(rng() * 10);
        const totalCreator = cHP + s1 + s2 + s3;
        const totalChallenger = hHP + (10 - s1) + (10 - s2) + (10 - s3);

        // --- WRITES ---------------------------------------------------------
        // Characters
        if (creatorCharacterExists) {
          tx.update(creatorRef, {
            racingStats: {
              rating: newCreatorRating,
              wins: newCreatorWins,
              losses: newCreatorLosses,
            },
            lastActive: serverTimestamp(),
          });
        } else {
          tx.set(
            creatorRef,
            {
              racingStats: {
                rating: newCreatorRating,
                wins: newCreatorWins,
                losses: newCreatorLosses,
              },
              lastActive: serverTimestamp(),
            },
            { merge: true }
          );
        }

        if (challengerCharacterExists) {
          tx.update(challengerRef, {
            racingStats: {
              rating: newChallRating,
              wins: newChallWins,
              losses: newChallLosses,
            },
            lastActive: serverTimestamp(),
          });
        } else {
          tx.set(
            challengerRef,
            {
              racingStats: {
                rating: newChallRating,
                wins: newChallWins,
                losses: newChallLosses,
              },
              lastActive: serverTimestamp(),
            },
            { merge: true }
          );
        }

        // Cars: must exist; ensure locked until archive
        tx.update(doc(db, "Characters", v.creator.id, "cars", creatorCarId), {
          damage: creatorDamageNew,
          inRace: {
            raceId: ref.id,
            role: "creator",
            since: serverTimestamp(),
          },
        });
        tx.update(doc(db, "Characters", userCharacter.id, "cars", car.id), {
          damage: challengerDamageNew,
          inRace: {
            raceId: ref.id,
            role: "challenger",
            since: serverTimestamp(),
          },
        });

        // Race: finish immediately
        tx.update(ref, {
          status: "finished",
          acceptedAt: serverTimestamp(),
          finishedAt: serverTimestamp(),
          challenger: {
            id: userCharacter.id,
            username: userCharacter.username ?? "Ukjent",
            carId: car.id,
            car: {
              name: car.displayName,
              hp: car.hp ?? null,
              value: car.value ?? null,
              tier: car.tier ?? 1,
              img: car.img ?? null,
              damage: car.damage ?? 0,
            },
            done: false,
          },
          winnerId,
          result: { totalCreator, totalChallenger },
          effects: {
            creator: {
              ratingDelta: creatorRatingDelta,
              damageDelta: creatorInc,
            },
            challenger: {
              ratingDelta: challengerRatingDelta,
              damageDelta: challengerInc,
            },
          },
        });
      });

      // Fetch final race to render animation (fresh source of truth)
      const finalSnap = await getDoc(ref);
      const data = finalSnap.data() as RaceDoc | undefined;
      if (
        data &&
        data.status === "finished" &&
        data.winnerId &&
        data.creator &&
        data.challenger
      ) {
        // IMPORTANT: use finalSnap.id as raceId to avoid "Ugyldig løps-ID"
        setRaceView({
          raceId: finalSnap.id,
          creator: {
            id: data.creator.id,
            username: data.creator.username,
            img: data.creator.car?.img ?? null,
            hp: Number(data.creator.car?.hp ?? 0),
            tier: Number(data.creator.car?.tier ?? 1),
            name: data.creator.car?.name ?? "Bil",
            damage: Number(data.creator.car?.damage ?? 0),
            value: Number(data.creator.car?.value ?? 0),
          },
          challenger: {
            id: data.challenger!.id,
            username: data.challenger!.username,
            img: data.challenger?.car?.img ?? null,
            hp: Number(data.challenger?.car?.hp ?? 0),
            tier: Number(data.challenger?.car?.tier ?? 1),
            name: data.challenger?.car?.name ?? "Bil",
            damage: Number(data.challenger?.car?.damage ?? 0),
            value: Number(data.challenger?.car?.value ?? 0),
          },
          winnerId: data.winnerId!,
          effects: data.effects,
        });
      }

      setNewRaceMesssage("");
    } catch (e: any) {
      console.error(e);
      setNewRaceMesssage(e?.message || "Kunne ikke ta utfordringen.");
      setNewRaceMessageType("failure");
    } finally {
      // leave selection mode; race view (if any) will take over
      setPendingRace(null);
      setAcceptCarId(null);
    }
  }

  // If I have a finished race not yet acknowledged, show its race view (and replay animation)
  useEffect(() => {
    async function mountPending() {
      if (!myPendingFinished || !userCharacter?.id) return;
      const r = myPendingFinished;
      if (!r.creator || !r.challenger || !r.winnerId) return;
      setRaceView((prev) =>
        prev?.raceId === r.id
          ? prev
          : {
              raceId: r.id, // always use doc id we subscribed to
              creator: {
                id: r.creator.id,
                username: r.creator.username,
                img: r.creator.car?.img ?? null,
                hp: Number(r.creator.car?.hp ?? 0),
                tier: Number(r.creator.car?.tier ?? 1),
                name: r.creator.car?.name ?? "Bil",
                damage: Number(r.creator.car?.damage ?? 0),
                value: Number(r.creator.car?.value ?? 0),
              },
              challenger: {
                id: r.challenger?.id!,
                username: r.challenger?.username!,
                img: r.challenger?.car?.img ?? null,
                hp: Number(r.challenger?.car?.hp ?? 0),
                tier: Number(r.challenger?.car?.tier ?? 1),
                name: r.challenger?.car?.name ?? "Bil",
                damage: Number(r.challenger?.car?.damage ?? 0),
                value: Number(r.challenger?.car?.value ?? 0),
              },
              winnerId: r.winnerId!,
              effects: r.effects,
            }
      );
    }
    mountPending();
  }, [myPendingFinished, userCharacter?.id]);

  // Abort acceptance UI (go back)
  function cancelAcceptFlow() {
    setPendingRace(null);
    setAcceptCarId(null);
  }

  // Acknowledge finished race
  async function handleAcknowledgeRace() {
    if (!raceView || !userCharacter?.id) return;

    // Guard raceId before building a ref
    if (typeof raceView.raceId !== "string" || !raceView.raceId) {
      console.error("handleAcknowledgeRace: invalid raceId", raceView?.raceId);
      setNewRaceMesssage("Ugyldig løps-ID. Last siden på nytt og prøv igjen.");
      setNewRaceMessageType("failure");
      return;
    }

    const raceRef = doc(db, "Streetraces", raceView.raceId);

    // Small helper: only create a car ref if both ids are valid strings
    const mkCarRef = (userId?: any, carId?: any) => {
      if (
        typeof userId === "string" &&
        userId &&
        typeof carId === "string" &&
        carId
      ) {
        return doc(db, "Characters", userId, "cars", carId);
      }
      return null;
    };

    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(raceRef);
        if (!snap.exists()) return;
        const v = snap.data() as any;

        const isCreator = v?.creator?.id === userCharacter.id;
        const isChallenger = v?.challenger?.id === userCharacter.id;
        if (!isCreator && !isChallenger) return; // shouldn't happen

        const myRole = isCreator ? "creator" : "challenger";
        const otherRole = isCreator ? "challenger" : "creator";

        const updates: Record<string, any> = {};
        updates[`${myRole}.done`] = true;

        // --- Immediately unlock *my* car on acknowledge (if we have ids) ---
        const myCarRef = mkCarRef(v?.[myRole]?.id, v?.[myRole]?.carId);
        if (myCarRef) {
          tx.update(myCarRef, { inRace: null });
        } else {
          console.warn(
            "handleAcknowledgeRace: missing my car ref",
            v?.[myRole]?.id,
            v?.[myRole]?.carId
          );
        }

        // Has the opponent already acknowledged?
        const otherDone = Boolean(v?.[otherRole]?.done);

        if (otherDone) {
          // Both acknowledged -> archive and ensure opponent car is unlocked too.
          updates["status"] = "archived";
          updates["archivedAt"] = serverTimestamp();

          const otherCarRef = mkCarRef(
            v?.[otherRole]?.id,
            v?.[otherRole]?.carId
          );
          if (otherCarRef) {
            tx.update(otherCarRef, { inRace: null });
          } else {
            console.warn(
              "handleAcknowledgeRace: missing opponent car ref",
              v?.[otherRole]?.id,
              v?.[otherRole]?.carId
            );
          }
        }

        tx.update(raceRef, updates);
      });

      // Clear local view; subscriptions will unblock UI
      setRaceView(null);
      setMyPendingFinished(null);
      setNewRaceMesssage("Løpet er avsluttet.");
      setNewRaceMessageType("success");
    } catch (e) {
      console.error(e);
      setNewRaceMesssage("Kunne ikke avslutte løpet.");
      setNewRaceMessageType("failure");
    }
  }

  // ---- Race animation logic --------------------------------------------------
  function startRaceAnimation(
    hpCreator: number,
    hpChallenger: number,
    winnerId: string,
    creatorId: string,
    challengerId: string
  ) {
    const maxHp = Math.max(hpCreator || 1, hpChallenger || 1);
    const baseSecsForMax = 5.0; // fastest finishes ~5s
    const baseCreator = (hpCreator || 1) / maxHp;
    const baseChall = (hpChallenger || 1) / maxHp;

    let speedCreator = baseCreator / baseSecsForMax;
    let speedChall = baseChall / baseSecsForMax;

    // Bias to ensure stored winner reaches finish first visually
    const bias = 1.12;
    if (creatorId === winnerId) speedCreator *= bias;
    else if (challengerId === winnerId) speedChall *= bias;

    speedsRef.current = { creator: speedCreator, challenger: speedChall };
    setRacePositions({ creator: 0, challenger: 0 });
    raceOverRef.current = false;
    raceStartRef.current = performance.now();

    const step = (now: number) => {
      if (raceOverRef.current) return;
      const start = raceStartRef.current ?? now;
      const dt = (now - start) / 1000; // seconds
      const cPos = Math.min(1, dt * speedsRef.current.creator);
      const hPos = Math.min(1, dt * speedsRef.current.challenger);

      if (cPos >= 1 || hPos >= 1) {
        setRacePositions({
          creator: cPos >= 1 ? 1 : cPos,
          challenger: hPos >= 1 ? 1 : hPos,
        });
        raceOverRef.current = true;
        return;
      }

      setRacePositions({ creator: cPos, challenger: hPos });
      rafRef.current = requestAnimationFrame(step);
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);
  }

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // (Re)start animation whenever raceView is set (including reload case)
  useEffect(() => {
    if (!raceView) return;
    startRaceAnimation(
      raceView.creator.hp,
      raceView.challenger.hp,
      raceView.winnerId,
      raceView.creator.id,
      raceView.challenger.id
    );
    // Only re-run when the race *document* changes (prevents restarts on unrelated updates)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raceView?.raceId]);

  // ---------------------------------------------------------------------------
  // ---------- UI State Machine (5 views) -------------------------------------
  type UiMode = "standard" | "create";
  const [uiMode, setUiMode] = useState<UiMode>("standard");

  // What view is visible now? Exactly one.
  type View =
    | "race" // Active race animation
    | "take" // Take on challenge (select car)
    | "activeChallenge" // I have an open challenge
    | "create" // Start new challenge
    | "standard"; // Stats + active challenges

  const view: View = raceView
    ? "race"
    : pendingRace
    ? "take"
    : myOpenRace
    ? "activeChallenge"
    : uiMode === "create"
    ? "create"
    : "standard";

  const raceFinished =
    racePositions.creator >= 1 || racePositions.challenger >= 1;
  const winnerName =
    raceView?.winnerId === raceView?.creator.id
      ? raceView?.creator.username
      : raceView?.challenger.username;
  const didIWin = userCharacter?.id === raceView?.winnerId;

  const badgeSrc =
    racingStats.rating >= 2000
      ? racingBadgeV
      : racingStats.rating >= 1500
      ? racingBadgeIV
      : racingStats.rating >= 1000
      ? racingBadgeIII
      : racingStats.rating >= 500
      ? racingBadgeII
      : racingBadgeI;

  const mySide =
    userCharacter?.id === raceView?.creator.id ? "creator" : "challenger";
  const myEffects = raceView?.effects?.[mySide as "creator" | "challenger"];

  return (
    <Main>
      <div className="flex justify-between mb-4 gap-x-8 gap-y-2 flex-wrap">
        <div>
          <H1>Street Racing</H1>
          <p>Her kan du kjøre gateløp mot andre spillere.</p>
        </div>

        {/* Stats */}
        <Box>
          <div className="flex gap-2 items-center mr-2">
            <img className="w-16" src={badgeSrc} alt="" />

            <div>
              <p>
                <small>Racingpoeng:</small>
              </p>
              <p>
                <strong className="text-4xl text-white">
                  {racingStats.rating}
                </strong>
              </p>

              <div className="flex gap-4 text-neutral-400">
                <p>
                  <small>Seiere:</small>{" "}
                  <strong className="text-neutral-200">
                    {racingStats.wins}
                  </strong>
                </p>
                <p>
                  <small>Tap:</small>{" "}
                  <strong className="text-neutral-200">
                    {racingStats.losses}
                  </strong>
                </p>
              </div>
            </div>
          </div>
        </Box>
      </div>

      {/* Exactly one view below the heading */}
      {view === "race" && raceView && (
        <Box className="flex-1">
          <H2>Aktivt løp</H2>

          {/* Single message area for this view */}
          {raceFinished && myEffects ? (
            <InfoBox type={didIWin ? "success" : "failure"}>
              {didIWin ? (
                <p>
                  <strong>Gratulerer, du vant løpet!</strong>
                  <br />
                  <small>
                    <strong className="text-neutral-100">
                      {myEffects.ratingDelta > 0 ? "+" : ""}
                      {myEffects.ratingDelta}
                    </strong>{" "}
                    rating og{" "}
                    <strong className="text-neutral-100">
                      +{myEffects.damageDelta}%
                    </strong>{" "}
                    skade på bilen.
                  </small>
                </p>
              ) : (
                <>
                  <strong>Beklager, {winnerName} vant løpet!</strong>
                  <br />
                  <small>
                    Du mistet{" "}
                    <strong className="text-neutral-100">
                      {myEffects.ratingDelta > 0 ? "+" : ""}
                      {myEffects.ratingDelta}
                    </strong>{" "}
                    rating og fikk{" "}
                    <strong className="text-neutral-100">
                      +{myEffects.damageDelta}%
                    </strong>{" "}
                    skade på bilen.
                  </small>
                </>
              )}
            </InfoBox>
          ) : (
            <InfoBox type="info">Løpet pågår...</InfoBox>
          )}

          <div className="w-full min-h-4 grid grid-cols-[128px_auto_128px] sm:grid-cols-[192px_100px_192px] relative rounded-xl p-2 sm:gap-3">
            <section id="player1">
              <div className="text-left">
                <p className="border-b-2 mb-1 px-2 py-0.5 border-red-500 bg-gradient-to-t from-red-950/0 to-red-900 rounded-t-lg w-32 sm:w-48">
                  <Username
                    character={{
                      id: raceView.creator.id,
                      username: raceView.creator.username,
                    }}
                  />
                </p>
              </div>
              <img
                src={raceView.creator.img || ""}
                alt=""
                className="w-32 sm:w-48 object-cover rounded-md"
              />
              <Item
                className="text-sm sm:text-base w-32 sm:w-48 text-wrap"
                name={raceView.creator.name}
                tier={raceView.creator.tier}
                tooltipImg={raceView.creator.img || undefined}
                tooltipContent={renderCarTooltip({
                  hp: raceView.creator.hp,
                  damage: raceView.creator.damage,
                  value: raceView.creator.value,
                })}
              />
              <p>{raceView.creator.hp} hk</p>
            </section>

            <div className="h-36 sm:h-48 flex items-center justify-center">
              <p className="text-2xl sm:text-4xl font-extrabold text-neutral-200 z-10 ">
                VS
              </p>
            </div>

            <section id="player2">
              <div className="text-right">
                <p className="border-b-2 mb-1 px-2 py-0.5 border-blue-500 bg-gradient-to-t from-blue-950/0 to-blue-900 rounded-t-lg w-32 sm:w-48">
                  <Username
                    character={{
                      id: raceView.challenger.id,
                      username: raceView.challenger.username,
                    }}
                  />
                </p>
              </div>
              <img
                src={raceView.challenger.img || ""}
                alt=""
                className="w-32 sm:w-48 object-cover rounded-md"
              />
              <div className="text-right">
                <Item
                  className="text-sm sm:text-base max-w-32 sm:max-w-48 text-wrap"
                  name={raceView.challenger.name}
                  tier={raceView.challenger.tier}
                  tooltipImg={raceView.challenger.img || undefined}
                  tooltipContent={renderCarTooltip({
                    hp: raceView.challenger.hp,
                    damage: raceView.challenger.damage,
                    value: raceView.challenger.value,
                  })}
                />
                <p>{raceView.challenger.hp} hk</p>
              </div>
            </section>

            {/* Track + cars */}
            <div className="relative col-span-3 w-full h-28 rounded-lg overflow-hidden">
              <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-[2px] mr-6 bg-neutral-600" />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-300 text-xs">
                Mål
              </div>

              {/* Creator car (red) */}
              <div
                className="absolute top-4 h-6 w-10 rounded-sm bg-gradient-to-r from-red-600 to-red-500"
                style={{
                  left: `calc(2px + ${racePositions.creator * 100}% - 20px)`,
                }}
                title={raceView.creator.name}
              />

              {/* Challenger car (blue) */}
              <div
                className="absolute bottom-4 h-6 w-10 rounded-sm bg-gradient-to-r from-blue-600 to-blue-500"
                style={{
                  left: `calc(2px + ${racePositions.challenger * 100}% - 20px)`,
                }}
                title={raceView.challenger.name}
              />
            </div>
          </div>

          <div>
            <Button onClick={handleAcknowledgeRace} disabled={!raceFinished}>
              {raceFinished ? "Avslutt løp" : "Løpet pågår..."}
            </Button>
          </div>
        </Box>
      )}

      {view === "take" && (
        <Box className="flex-1">
          <H2>Ta utfordring</H2>

          {/* Single message area for this view */}
          {newRaceMessage && (
            <InfoBox
              type={newRacemessageType}
              onClose={() => setNewRaceMesssage("")}
            >
              {newRaceMessage}
            </InfoBox>
          )}

          <div className="flex gap-8 flex-wrap">
            <div className="grow min-w-72">
              <H3>Velg bil</H3>
              {!hasUsableCar ? (
                <p className="text-neutral-400 mt-1">
                  Du har ingen biler i denne byen.
                </p>
              ) : (
                <ul className="mt-2 grid gap-1">
                  {enriched.map((c) => {
                    const isBroken = (c.damage ?? 0) >= 100;
                    const isChosen = c.id === acceptCarId;
                    return (
                      <li
                        key={c.id}
                        className={`rounded-lg border px-2 py-1 flex items-center justify-between ${
                          isBroken
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        } ${
                          isChosen
                            ? "border-neutral-600 bg-neutral-800"
                            : "border-neutral-800 bg-neutral-900 hover:bg-neutral-800"
                        }`}
                        onClick={() => !isBroken && setAcceptCarId(c.id)}
                        title={
                          isBroken
                            ? "Denne bilen har 100% skade og kan ikke brukes."
                            : ""
                        }
                      >
                        <div className="flex items-center gap-3">
                          <Item
                            name={`${c.displayName} ${
                              isBroken ? "(Ødelagt)" : ""
                            }`}
                            tier={c.tier}
                            tooltipImg={c.img || undefined}
                            tooltipContent={renderCarTooltip({
                              hp: c.hp,
                              damage: c.damage,
                              value: c.value,
                            })}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button style="secondary" onClick={cancelAcceptFlow}>
              Avbryt
            </Button>
            <Button disabled={!acceptCarId} onClick={confirmAcceptRace}>
              Start løp
            </Button>
          </div>
        </Box>
      )}

      {view === "activeChallenge" && (
        <Box className="flex-1">
          <H2>Aktiv utfordring</H2>

          {/* Single message area for this view */}
          {newRaceMessage && (
            <InfoBox
              type={newRacemessageType}
              onClose={() => setNewRaceMesssage("")}
            >
              {newRaceMessage}
            </InfoBox>
          )}

          <div className="flex gap-8 flex-wrap">
            <div className="min-w-72">
              <H3>Bil</H3>
              {activeCar ? (
                <div className="mt-2 flex flex-col items-start gap-3">
                  {activeCar.img && (
                    <img
                      src={activeCar.img}
                      alt=""
                      className="w-56 h-32 object-cover rounded-lg border border-neutral-700"
                    />
                  )}
                  <div>
                    <Item
                      name={activeCar.displayName}
                      tier={activeCar.tier}
                      tooltipImg={activeCar.img || undefined}
                      tooltipContent={renderCarTooltip({
                        hp: activeCar.hp,
                        damage: activeCar.damage,
                        value: activeCar.value,
                      })}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-neutral-400 mt-1">Ingen aktiv bil valgt.</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <Button style="danger" onClick={handleCancelMyRace}>
              Avbryt utfordring
            </Button>
          </div>
        </Box>
      )}

      {view === "create" && (
        <Box className="flex-1">
          <H2>Start utfordring</H2>

          {/* Single message area for this view */}
          {newRaceMessage && (
            <InfoBox
              type={newRacemessageType}
              onClose={() => setNewRaceMesssage("")}
            >
              {newRaceMessage}
            </InfoBox>
          )}

          <div className="flex gap-8 flex-wrap">
            <div className="min-w-72">
              <H3>Aktiv bil</H3>
              {activeCar ? (
                <div className="mt-2 flex flex-col items-start gap-3">
                  {activeCar.img && (
                    <img
                      src={activeCar.img}
                      alt=""
                      className="w-56 h-32 object-cover rounded-lg border border-neutral-700"
                    />
                  )}
                  <div>
                    <Item
                      name={activeCar.displayName}
                      tier={activeCar.tier}
                      tooltipImg={activeCar.img || undefined}
                      tooltipContent={
                        <div>
                          {activeCar.hp != null && (
                            <p>
                              Effekt:{" "}
                              <strong className="text-neutral-200">
                                {activeCar.hp} hk
                              </strong>
                            </p>
                          )}
                          <p>
                            Skade:{" "}
                            <strong className="text-neutral-200">
                              {dmgPercent(activeCar.damage)}%
                            </strong>
                          </p>
                          {activeCar.value != null && (
                            <p>
                              Verdi:{" "}
                              <strong className="text-neutral-200">
                                <i className="fa-solid fa-dollar-sign"></i>{" "}
                                {valueAfterDamage(
                                  Number(activeCar.value) || 0,
                                  dmgPercent(activeCar.damage)
                                ).toLocaleString("nb-NO")}
                              </strong>
                            </p>
                          )}
                        </div>
                      }
                    />
                  </div>
                </div>
              ) : (
                <p className="text-neutral-400 mt-1">Ingen aktiv bil valgt.</p>
              )}
            </div>

            <div className="grow min-w-72">
              <H3>Velg bil</H3>
              {enriched.length === 0 ? (
                <p className="text-neutral-400 mt-1">
                  Du har ingen biler i denne byen.
                </p>
              ) : (
                <ul className="mt-2 grid gap-1">
                  {enriched.map((c) => {
                    const isActive = c.id === activeCarId;
                    const isBroken = (c.damage ?? 0) >= 100;
                    return (
                      <li
                        key={c.id}
                        className={`rounded-lg border px-2 py-1 flex items-center justify-between ${
                          isBroken
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        } ${
                          isActive
                            ? "border-neutral-600 bg-neutral-800"
                            : "border-neutral-800 bg-neutral-900 hover:bg-neutral-800"
                        }`}
                        onClick={() => !isBroken && setActiveCar(c.id)}
                        title={
                          isBroken
                            ? "Denne bilen har 100% skade og kan ikke brukes."
                            : ""
                        }
                      >
                        <div className="flex items-center gap-3">
                          <Item
                            name={`${c.displayName} ${
                              isBroken ? "(Ødelagt)" : ""
                            }`}
                            tier={c.tier}
                            tooltipImg={c.img || undefined}
                            tooltipContent={renderCarTooltip({
                              hp: c.hp,
                              damage: c.damage,
                              value: c.value,
                            })}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button style="secondary" onClick={() => setUiMode("standard")}>
              Tilbake
            </Button>
            <Button
              disabled={
                !activeCarId ||
                Boolean(myPendingFinished) ||
                (activeCar ? (activeCar.damage ?? 0) >= 100 : false)
              }
              onClick={async () => {
                await handleStartRace();
                // Let subscription to myOpenRace switch the view to "activeChallenge"
                setUiMode("standard");
              }}
            >
              Start løp
            </Button>
          </div>
        </Box>
      )}

      {view === "standard" && (
        <div className="flex flex-wrap gap-4">
          {/* Active challenges list with Start button */}
          <Box className="flex-1">
            <div className="flex items-center justify-between">
              <H2>Aktive utfordringer</H2>
            </div>

            {/* Single message area for this view */}
            {newRaceMessage && (
              <InfoBox
                type={newRacemessageType}
                onClose={() => setNewRaceMesssage("")}
              >
                {newRaceMessage}
              </InfoBox>
            )}

            <Button
              onClick={() => setUiMode("create")}
              disabled={
                !!raceView ||
                !!pendingRace ||
                !!myOpenRace ||
                !!myPendingFinished
              }
            >
              Start utfordring
            </Button>

            {openRaces.length === 0 ? (
              <p className="text-neutral-400 mt-2">
                Det er for øyeblikket ingen aktive utfordringer.
              </p>
            ) : (
              <ul className="mt-2 grid gap-2">
                {openRaces.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-lg border border-neutral-700 bg-neutral-900/60 p-3 flex gap-2 items-center justify-between text-nowrap"
                  >
                    <div className="flex items-center gap-3">
                      <Username
                        character={{
                          id: r.creator.id,
                          username: r.creator.username,
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="small"
                        disabled={
                          r.creator.id === userCharacter?.id ||
                          !hasUsableCar ||
                          !!myOpenRace ||
                          !!pendingRace ||
                          !!myPendingFinished ||
                          !!raceView
                        }
                        onClick={() => beginAcceptFlow(r)}
                      >
                        <p>Ta utfordringen</p>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Box>
        </div>
      )}
    </Main>
  );
};

export default StreetRacing;
