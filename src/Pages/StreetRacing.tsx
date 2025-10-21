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

import { useCharacter } from "../CharacterContext";
import { getCarByKey, getCarByName } from "../Data/Cars";

// Firestore
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  where,
  doc,
  addDoc,
  serverTimestamp,
  runTransaction,
  updateDoc,
  getDoc,
  deleteDoc,
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
  [k: string]: any;
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
    };
    done?: boolean; // <- player acknowledged
  };
  winnerId?: string;
  result?: { totalCreator: number; totalChallenger: number };
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
// ---------------------------------------------------

const StreetRacing = () => {
  const { userCharacter } = useCharacter();

  // Tokyo-only; still use character location to filter the garage
  const currentCity =
    (userCharacter as any)?.location ?? (userCharacter as any)?.city ?? "Tokyo";

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
    };
    challenger: {
      id: string;
      username: string;
      img?: string | null;
      hp: number;
      tier: number;
      name: string;
    };
    winnerId: string;
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
    return {
      ...c,
      img: c.img ?? catalog?.img ?? null,
      hp: c.hp ?? catalog?.hp ?? null,
      value: c.value ?? catalog?.value ?? null,
      tier: c.tier ?? catalog?.tier ?? 1,
      displayName:
        c.name || [c.brand, c.model].filter(Boolean).join(" ") || "Bil",
    };
  };

  const enriched = useMemo(() => carsInCity.map(withCatalog), [carsInCity]);
  const hasCarInTokyo = enriched.length > 0;

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
    if (myOpenRace) {
      setNewRaceMesssage("Du har allerede en aktiv utfordring.");
      setNewRaceMessageType("warning");
      return;
    }
    if (myPendingFinished) {
      setNewRaceMesssage(
        "Fullfør/avslutt det aktive løpet før du starter et nytt."
      );
      setNewRaceMessageType("warning");
      return;
    }
    try {
      await addDoc(collection(db, "Streetraces"), {
        status: "open" as RaceStatus,
        city: "Tokyo",
        createdAt: serverTimestamp(),
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
          },
          done: false,
        },
      });
      setNewRaceMesssage(
        "Utfordring startet! Den er nå synlig for andre spillere."
      );
      setNewRaceMessageType("success");
    } catch (e) {
      console.error(e);
      setNewRaceMesssage("Klarte ikke å starte løp.");
      setNewRaceMessageType("failure");
    }
  }

  // Cancel my open challenge
  async function handleCancelMyRace() {
    if (!myOpenRace) return;
    try {
      await deleteDoc(doc(db, "Streetraces", myOpenRace.id));
      setNewRaceMesssage("Utfordringen ble avbrutt.");
      setNewRaceMessageType("success");
    } catch (e) {
      console.error(e);
      setNewRaceMesssage("Kunne ikke avbryte utfordringen.");
      setNewRaceMessageType("failure");
    }
  }

  // Click "Ta utfordringen" → switch right box into "Aktivt løp" (selection) mode
  function beginAcceptFlow(r: RaceDoc) {
    if (!hasCarInTokyo) {
      setNewRaceMesssage("Du trenger en bil i Tokyo for å delta.");
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

    const ref = doc(db, "Streetraces", pendingRace.id);

    try {
      // Transaction: claim race + set challenger + pick winner (probabilistic by HP)
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error("Løpet finnes ikke.");
        const v = snap.data() as any;
        if (v.status !== "open")
          throw new Error("Utfordringen er allerede tatt.");
        if (v.creator?.id === userCharacter.id)
          throw new Error("Du kan ikke ta din egen utfordring.");

        const cHP = Number(v.creator?.car?.hp ?? 0);
        const hHP = Number(car.hp ?? 0);
        const total = Math.max(1, cHP + hHP);
        const pCreator = cHP / total;
        const rnd = Math.random(); // single draw, persisted
        const winnerId = rnd < pCreator ? v.creator.id : userCharacter.id;

        // Optional: write some stage logs for flavor (deterministic seed)
        const seed = strHash(pendingRace.id);
        const rng = mulberry32(seed);
        const s1 = Math.round(rng() * 10);
        const s2 = Math.round(rng() * 10);
        const s3 = Math.round(rng() * 10);
        const totalCreator = cHP + s1 + s2 + s3;
        const totalChallenger = hHP + (10 - s1) + (10 - s2) + (10 - s3);

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
            },
            done: false,
          },
          winnerId,
          result: { totalCreator, totalChallenger },
        });
      });

      // Fetch final race to render animation
      const finalSnap = await getDoc(ref);
      const v = finalSnap.data() as RaceDoc;
      if (
        v &&
        v.status === "finished" &&
        v.winnerId &&
        v.creator &&
        v.challenger
      ) {
        setRaceView({
          raceId: pendingRace.id,
          creator: {
            id: v.creator.id,
            username: v.creator.username,
            img: v.creator.car?.img ?? null,
            hp: Number(v.creator.car?.hp ?? 0),
            tier: Number(v.creator.car?.tier ?? 1),
            name: v.creator.car?.name ?? "Bil",
          },
          challenger: {
            id: v.challenger.id!,
            username: v.challenger.username!,
            img: v.challenger.car?.img ?? null,
            hp: Number(v.challenger.car?.hp ?? 0),
            tier: Number(v.challenger.car?.tier ?? 1),
            name: v.challenger.car?.name ?? "Bil",
          },
          winnerId: v.winnerId!,
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
      setRaceView({
        raceId: r.id,
        creator: {
          id: r.creator.id,
          username: r.creator.username,
          img: r.creator.car?.img ?? null,
          hp: Number(r.creator.car?.hp ?? 0),
          tier: Number(r.creator.car?.tier ?? 1),
          name: r.creator.car?.name ?? "Bil",
        },
        challenger: {
          id: r.challenger.id!,
          username: r.challenger.username!,
          img: r.challenger.car?.img ?? null,
          hp: Number(r.challenger.car?.hp ?? 0),
          tier: Number(r.challenger.car?.tier ?? 1),

          name: r.challenger.car?.name ?? "Bil",
        },
        winnerId: r.winnerId!,
      });
    }
    mountPending();
  }, [myPendingFinished, userCharacter?.id]);

  // Abort acceptance UI (go back)
  function cancelAcceptFlow() {
    setPendingRace(null);
    setAcceptCarId(null);
  }

  // Acknowledge finished race: mark my `done=true`. If both done -> archive.
  async function handleAcknowledgeRace() {
    if (!raceView || !userCharacter?.id) return;
    const ref = doc(db, "Streetraces", raceView.raceId);

    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const v = snap.data() as any;

        const isCreator = v.creator?.id === userCharacter.id;
        const isChallenger = v.challenger?.id === userCharacter.id;

        if (!isCreator && !isChallenger) return; // shouldn't happen

        const updates: any = {};
        if (isCreator) updates["creator.done"] = true;
        if (isChallenger) updates["challenger.done"] = true;

        const otherDone = isCreator
          ? Boolean(v.challenger?.done)
          : Boolean(v.creator?.done);

        if (otherDone) {
          // both acknowledged -> archive
          updates["status"] = "archived";
          updates["archivedAt"] = serverTimestamp();
        }

        tx.update(ref, updates);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raceView?.raceId]);

  // ---------------------------------------------------------------------------

  const hasOwnOpenRace = !!myOpenRace;
  const hasUnackedFinished = !!myPendingFinished;

  // What mode is the right-side box in?
  // - "own-active": you have your own open challenge
  // - "accept-active": you are choosing a car for someone else's challenge
  // - "race-view": you have a finished race that isn't acknowledged (or just finished)
  // - "create": default create-a-challenge
  const mode: "own-active" | "accept-active" | "race-view" | "create" = raceView
    ? "race-view"
    : hasOwnOpenRace
    ? "own-active"
    : pendingRace
    ? "accept-active"
    : hasUnackedFinished
    ? "race-view"
    : "create";

  const raceFinished =
    racePositions.creator >= 1 || racePositions.challenger >= 1;
  const winnerName =
    raceView?.winnerId === raceView?.creator.id
      ? raceView?.creator.username
      : raceView?.challenger.username;
  const didIWin = userCharacter?.id === raceView?.winnerId;

  return (
    <Main>
      <H1>Street Racing</H1>
      <p className="mb-4">
        Her kan du konkurrere i gateløp mot andre spillere.
      </p>

      <div className="mb-8">
        <p>
          <small>Racingpoeng:</small>
        </p>
        <p>
          <strong className="text-4xl text-neutral-200">3688</strong>
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        {/* Aktive utfordringer (Tokyo-only & car-secret UI) */}
        <Box>
          <H2>Aktive utfordringer</H2>
          {openRaces.length === 0 ? (
            <p className="text-neutral-400 mt-2">Ingen aktive utfordringer.</p>
          ) : (
            <ul className="mt-2 grid gap-2">
              {openRaces.map((r) => (
                <li
                  key={r.id}
                  className="rounded-lg border border-neutral-700 bg-neutral-900/60 p-3 flex items-center justify-between"
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
                        !hasCarInTokyo ||
                        hasOwnOpenRace ||
                        !!pendingRace ||
                        hasUnackedFinished ||
                        !!raceView
                      }
                      onClick={() => beginAcceptFlow(r)}
                    >
                      Ta utfordringen
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Box>

        {/* Right column: create / own active / accept active / race view */}
        <Box>
          <H2>
            {mode === "own-active"
              ? "Aktiv utfordring"
              : mode === "accept-active" || mode === "race-view"
              ? "Aktivt løp"
              : "Start utfordring"}
          </H2>

          <p className="mb-2">
            {mode === "own-active" ? (
              "Du har en aktiv utfordring. Vent på en motstander, eller avbryt."
            ) : mode === "accept-active" ? (
              <>
                Du tar utfordringen fra{" "}
                <strong>{pendingRace?.creator.username}</strong>. Velg bil og
                start løpet.
              </>
            ) : mode === "race-view" ? (
              ""
            ) : (
              "Når du starter et løp vil det være mulig for hvem som helst å ta utfordringen."
            )}
          </p>

          {newRaceMessage && (
            <InfoBox
              type={newRacemessageType}
              onClose={() => setNewRaceMesssage("")}
            >
              {newRaceMessage}
            </InfoBox>
          )}

          {/* OWN ACTIVE */}
          {mode === "own-active" && (
            <>
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
                              {activeCar.value != null && (
                                <p>
                                  Verdi:{" "}
                                  <strong className="text-neutral-200">
                                    <i className="fa-solid fa-dollar-sign"></i>{" "}
                                    {Number(activeCar.value).toLocaleString(
                                      "nb-NO"
                                    )}
                                  </strong>
                                </p>
                              )}
                            </div>
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-neutral-400 mt-1">
                      Ingen aktiv bil valgt.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <Button style="danger" onClick={handleCancelMyRace}>
                  Avbryt utfordring
                </Button>
              </div>
            </>
          )}

          {/* ACCEPT ACTIVE (choose car, then Start løp) */}
          {mode === "accept-active" && (
            <>
              <div className="flex gap-8 flex-wrap">
                <div className="grow min-w-72">
                  <H3>Velg bil</H3>
                  {!hasCarInTokyo ? (
                    <p className="text-neutral-400 mt-1">
                      Du har ingen biler i Tokyo.
                    </p>
                  ) : (
                    <ul className="mt-2 grid gap-2">
                      {enriched.map((c) => {
                        const isChosen = c.id === acceptCarId;
                        return (
                          <li
                            key={c.id}
                            className={`rounded-lg border p-2 flex items-center justify-between cursor-pointer ${
                              isChosen
                                ? "border-neutral-600 bg-neutral-800"
                                : "border-neutral-800 bg-neutral-900 hover:bg-neutral-800"
                            }`}
                            onClick={() => setAcceptCarId(c.id)}
                          >
                            <div className="flex items-center gap-3">
                              <Item
                                name={c.displayName}
                                tier={c.tier}
                                tooltipImg={c.img || undefined}
                                tooltipContent={
                                  <div>
                                    {c.hp != null && (
                                      <p>
                                        Effekt:{" "}
                                        <strong className="text-neutral-200">
                                          {c.hp} hk
                                        </strong>
                                      </p>
                                    )}
                                    {c.value != null && (
                                      <p>
                                        Verdi:{" "}
                                        <strong className="text-neutral-200">
                                          <i className="fa-solid fa-dollar-sign"></i>{" "}
                                          {Number(c.value).toLocaleString(
                                            "nb-NO"
                                          )}
                                        </strong>
                                      </p>
                                    )}
                                  </div>
                                }
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
            </>
          )}

          {/* RACE VIEW (animation + result) */}
          {mode === "race-view" && raceView && (
            <div className="w-full flex flex-col gap-2">
              {/* Winner banner when race stops */}
              {raceFinished ? (
                <InfoBox type={didIWin ? "success" : "failure"}>
                  {didIWin ? (
                    <>Gratulerer, du vant!</>
                  ) : (
                    <>Beklager, {winnerName} vant!</>
                  )}
                </InfoBox>
              ) : (
                <InfoBox type="info">Løpet pågår...</InfoBox>
              )}

              <div className="w-full min-h-4 grid grid-cols-[auto_auto_auto] relative rounded-xl p-2 gap-3">
                <section id="player1">
                  <div className="text-left">
                    <p className="border-b-2 mb-1 px-2 py-0.5 border-red-500 bg-gradient-to-t from-red-950/0 to-red-900 rounded-t-lg">
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
                    className="w-40 h-24 object-cover rounded-md"
                  />
                  <Item
                    name={raceView.creator.name}
                    tier={raceView.creator.tier}
                  />{" "}
                  - {raceView.creator.hp} hp
                </section>

                <div className="h-full flex items-center">
                  <p className="text-4xl font-extrabold text-neutral-300 z-10 ">
                    VS
                  </p>
                </div>

                <section id="player2">
                  <div className="text-right">
                    <p className="border-b-2 mb-1 px-2 py-0.5 border-blue-500 bg-gradient-to-t from-blue-950/0 to-blue-900 rounded-t-lg">
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
                    className="w-40 h-24 object-cover rounded-md"
                  />
                  <Item
                    name={raceView.challenger.name}
                    tier={raceView.challenger.tier}
                  />{" "}
                  - {raceView.challenger.hp} hp
                </section>

                {/* Track + cars */}
                <div className="relative col-span-3 w-full h-28 rounded-lg overflow-hidden">
                  {/* Track line */}
                  <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-[2px] bg-neutral-600" />

                  {/* Finish flag */}
                  <div className="absolute right-2 top-2 text-neutral-300 text-xs">
                    Mål
                  </div>

                  {/* Creator car (red) - top */}
                  <div
                    className="absolute top-4 h-6 w-10 rounded-sm bg-gradient-to-r from-red-600 to-red-500"
                    style={{
                      left: `calc(2px + ${
                        racePositions.creator * 100
                      }% - 20px)`,
                    }}
                    title={raceView.creator.name}
                  />

                  {/* Challenger car (blue) - bottom */}
                  <div
                    className="absolute bottom-4 h-6 w-10 rounded-sm bg-gradient-to-r from-blue-600 to-blue-500"
                    style={{
                      left: `calc(2px + ${
                        racePositions.challenger * 100
                      }% - 20px)`,
                    }}
                    title={raceView.challenger.name}
                  />
                </div>
              </div>

              <div>
                <Button
                  onClick={handleAcknowledgeRace}
                  disabled={!raceFinished}
                >
                  {raceFinished ? "Avslutt løp" : "Løpet pågår..."}
                </Button>
              </div>
            </div>
          )}

          {/* CREATE (default) */}
          {mode === "create" && (
            <>
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
                              {activeCar.value != null && (
                                <p>
                                  Verdi:{" "}
                                  <strong className="text-neutral-200">
                                    <i className="fa-solid fa-dollar-sign"></i>{" "}
                                    {Number(activeCar.value).toLocaleString(
                                      "nb-NO"
                                    )}
                                  </strong>
                                </p>
                              )}
                            </div>
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-neutral-400 mt-1">
                      Ingen aktiv bil valgt.
                    </p>
                  )}
                </div>

                <div className="grow min-w-72">
                  <H3>Velg bil</H3>
                  {enriched.length === 0 ? (
                    <p className="text-neutral-400 mt-1">
                      Du har ingen biler i Tokyo.
                    </p>
                  ) : (
                    <ul className="mt-2 grid gap-2">
                      {enriched.map((c) => {
                        const isActive = c.id === activeCarId;
                        return (
                          <li
                            key={c.id}
                            className={`rounded-lg border p-2 flex items-center justify-between cursor-pointer ${
                              isActive
                                ? "border-neutral-600 bg-neutral-800"
                                : "border-neutral-800 bg-neutral-900 hover:bg-neutral-800"
                            }`}
                            onClick={() => setActiveCar(c.id)}
                          >
                            <div className="flex items-center gap-3">
                              <Item
                                name={c.displayName}
                                tier={c.tier}
                                tooltipImg={c.img || undefined}
                                tooltipContent={
                                  <div>
                                    {c.hp != null && (
                                      <p>
                                        Effekt:{" "}
                                        <strong className="text-neutral-200">
                                          {c.hp} hk
                                        </strong>
                                      </p>
                                    )}
                                    {c.value != null && (
                                      <p>
                                        Verdi:{" "}
                                        <strong className="text-neutral-200">
                                          <i className="fa-solid fa-dollar-sign"></i>{" "}
                                          {Number(c.value).toLocaleString(
                                            "nb-NO"
                                          )}
                                        </strong>
                                      </p>
                                    )}
                                  </div>
                                }
                              />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <Button
                  disabled={!activeCarId || hasUnackedFinished}
                  onClick={handleStartRace}
                >
                  Start løp
                </Button>
              </div>
            </>
          )}
        </Box>
      </div>
    </Main>
  );
};

export default StreetRacing;
