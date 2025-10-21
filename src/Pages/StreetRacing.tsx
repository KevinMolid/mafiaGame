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
  writeBatch,
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

type RaceStatus = "open" | "in_progress" | "finished" | "cancelled";

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
  };
  winnerId?: string;
  result?: { totalCreator: number; totalChallenger: number };
};

// ---------- tiny deterministic RNG helpers ----------
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
      hp?: number | null;
      name: string;
    };
    challenger: {
      id: string;
      username: string;
      img?: string | null;
      hp?: number | null;
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

  // Subscribe to character for activeCarId (useful when creating your own challenge)
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

  // Helper: pick catalog meta (img/hp/value fallback)
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

  // Persist active car selection (used when creating your own challenge)
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

  // Start a race (your own) — blocked if you already have one
  async function handleStartRace() {
    if (!userCharacter?.id || !activeCar) return;
    if (myOpenRace) {
      setNewRaceMesssage("Du har allerede en aktiv utfordring.");
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

    try {
      const ref = doc(db, "Streetraces", pendingRace.id);

      // Atomically claim with chosen car
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error("Løpet finnes ikke.");
        const v = snap.data() as any;
        if (v.status !== "open")
          throw new Error("Utfordringen er allerede tatt.");
        if (v.creator?.id === userCharacter.id)
          throw new Error("Du kan ikke ta din egen utfordring.");

        tx.update(ref, {
          status: "in_progress",
          acceptedAt: serverTimestamp(),
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
          },
        });
      });

      // Simulate right after acceptance (server state)
      await simulateRace(pendingRace.id);

      // Read the finished race for winner + both cars
      const finalSnap = await getDoc(ref);
      const v = finalSnap.data() as RaceDoc;
      if (
        v &&
        v.status === "finished" &&
        v.winnerId &&
        v.creator &&
        v.challenger
      ) {
        // Prepare animation view
        setRaceView({
          raceId: pendingRace.id,
          creator: {
            id: v.creator.id,
            username: v.creator.username,
            img: v.creator.car?.img ?? null,
            hp: v.creator.car?.hp ?? null,
            name: v.creator.car?.name ?? "Bil",
          },
          challenger: {
            id: v.challenger.id!,
            username: v.challenger.username!,
            img: v.challenger.car?.img ?? null,
            hp: v.challenger.car?.hp ?? null,
            name: v.challenger.car?.name ?? "Bil",
          },
          winnerId: v.winnerId!,
        });

        // Kick off animation (client-side)
        startRaceAnimation(
          v.creator.car?.hp ?? 0,
          v.challenger.car?.hp ?? 0,
          v.winnerId!
        );
      }

      setNewRaceMesssage("");
    } catch (e: any) {
      console.error(e);
      setNewRaceMesssage(e?.message || "Kunne ikke ta utfordringen.");
      setNewRaceMessageType("failure");
    } finally {
      // leave selection mode; race view takes over
      setPendingRace(null);
      setAcceptCarId(null);
    }
  }

  // Abort acceptance UI (go back)
  function cancelAcceptFlow() {
    setPendingRace(null);
    setAcceptCarId(null);
  }

  // Simulate a 3-stage race and finish (server-side record)
  async function simulateRace(raceId: string) {
    const ref = doc(db, "Streetraces", raceId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const v = snap.data() as any;

    const creator = v.creator;
    const challenger = v.challenger;
    if (!creator || !challenger) return;

    const seed = strHash(raceId);
    const rnd = mulberry32(seed);

    const baseCreator = (creator.car?.hp ?? 0) + (creator.car?.tier ?? 1) * 10;
    const baseChall =
      (challenger.car?.hp ?? 0) + (challenger.car?.tier ?? 1) * 10;

    const stages = ["Start", "Midtseksjon", "Måloppløp"] as const;
    let scoreCreator = 0;
    let scoreChall = 0;

    const batch = writeBatch(db);
    const eventsCol = collection(db, "Streetraces", raceId, "events");

    stages.forEach((label, i) => {
      const jitterC = Math.round(rnd() * 30 - 15);
      const jitterH = Math.round(rnd() * 30 - 15);
      const sC = baseCreator + jitterC + Math.round(rnd() * 10);
      const sH = baseChall + jitterH + Math.round(rnd() * 10);
      scoreCreator += sC;
      scoreChall += sH;

      batch.set(doc(eventsCol), {
        idx: i,
        label,
        creatorStage: sC,
        challengerStage: sH,
        ts: serverTimestamp(),
      });
    });

    const winnerId = scoreCreator >= scoreChall ? creator.id : challenger.id;

    batch.update(ref, {
      status: "finished",
      finishedAt: serverTimestamp(),
      winnerId,
      result: {
        totalCreator: scoreCreator,
        totalChallenger: scoreChall,
      },
    });

    await batch.commit();
  }

  const hasOwnOpenRace = !!myOpenRace;

  // What mode is the right-side box in?
  // - "own-active": you have your own open challenge
  // - "accept-active": you are choosing a car for someone else's challenge
  // - "race-view": animation is playing / finished
  // - "create": default create-a-challenge
  const mode: "own-active" | "accept-active" | "race-view" | "create" = raceView
    ? "race-view"
    : hasOwnOpenRace
    ? "own-active"
    : pendingRace
    ? "accept-active"
    : "create";

  // ---- Race animation logic --------------------------------------------------
  function startRaceAnimation(
    hpCreator: number,
    hpChallenger: number,
    winnerId: string
  ) {
    // Normalize speeds so track length is 1.0.
    // Winner should reach first; we add a small bias toward winner.
    const maxHp = Math.max(hpCreator || 1, hpChallenger || 1);
    const baseSecsForMax = 5.0; // fastest finishes in ~5s
    const baseCreator = (hpCreator || 1) / maxHp;
    const baseChall = (hpChallenger || 1) / maxHp;

    // Convert to speed (units per second): speed = base / baseSecsForMax
    let speedCreator = baseCreator / baseSecsForMax;
    let speedChall = baseChall / baseSecsForMax;

    // Bias so Firestore winner reaches first visually
    const bias = 1.12; // ~12% faster
    if (raceView?.creator.id === winnerId) {
      speedCreator *= bias;
    } else {
      speedChall *= bias;
    }

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

      // Stop both when first hits end
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

    // Start RAF
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);
  }

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);
  // ---------------------------------------------------------------------------

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
              : mode === "accept-active"
              ? "Aktivt løp"
              : mode === "race-view"
              ? "Løp i gang"
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
              "Løpet pågår…"
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
            <div className="w-full">
              {/* Names */}
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-neutral-100">
                  {raceView.creator.username}
                </span>
                <span className="font-semibold text-neutral-100">
                  {raceView.challenger.username}
                </span>
              </div>

              {/* Cars images + VS */}
              <div className="flex items-center justify-between mb-4 gap-4">
                <img
                  src={raceView.creator.img || ""}
                  alt=""
                  className="w-40 h-24 object-cover rounded-md border border-neutral-700"
                />
                <span className="text-2xl font-bold text-neutral-300">VS</span>
                <img
                  src={raceView.challenger.img || ""}
                  alt=""
                  className="w-40 h-24 object-cover rounded-md border border-neutral-700"
                />
              </div>

              {/* Track + cars */}
              <div className="relative w-full h-28 rounded-lg bg-neutral-950/60 border border-neutral-800 overflow-hidden">
                {/* Track line */}
                <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-[2px] bg-neutral-600" />

                {/* Finish flag */}
                <div className="absolute right-2 top-2 text-neutral-300 text-xs">
                  Mål
                </div>

                {/* Creator car (red) - top */}
                <div
                  className="absolute top-4 h-6 w-10 rounded-sm"
                  style={{
                    left: `calc(2px + ${racePositions.creator * 100}% - 20px)`,
                    background:
                      "linear-gradient(90deg, #ef4444 0%, #7f1d1d 100%)",
                    boxShadow: "0 0 8px rgba(239,68,68,0.6)",
                  }}
                  title={raceView.creator.name}
                />

                {/* Challenger car (blue) - bottom */}
                <div
                  className="absolute bottom-4 h-6 w-10 rounded-sm"
                  style={{
                    left: `calc(2px + ${
                      racePositions.challenger * 100
                    }% - 20px)`,
                    background:
                      "linear-gradient(90deg, #60a5fa 0%, #1e3a8a 100%)",
                    boxShadow: "0 0 8px rgba(96,165,250,0.6)",
                  }}
                  title={raceView.challenger.name}
                />
              </div>

              {/* Winner banner when race stops */}
              {racePositions.creator >= 1 || racePositions.challenger >= 1 ? (
                <div className="mt-4 p-3 rounded-md border border-emerald-500/40 bg-emerald-900/20 text-emerald-300 font-semibold text-center">
                  Vinner:{" "}
                  {raceView.winnerId === raceView.creator.id
                    ? raceView.creator.username
                    : raceView.challenger.username}
                </div>
              ) : (
                <p className="mt-4 text-neutral-400 text-center text-sm italic">
                  Løpet pågår…{` `}
                  <span className="animate-pulse">🏁</span>
                </p>
              )}
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
                <Button disabled={!activeCarId} onClick={handleStartRace}>
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
