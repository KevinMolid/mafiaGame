import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import H2 from "../../components/Typography/H2";
import H3 from "../../components/Typography/H3";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";
import JailBox from "../../components/JailBox";
import Username from "../../components/Typography/Username";
import ItemTile from "../../components/ItemTile";
import Box from "../../components/Box";

import { compactMmSs } from "../../Functions/TimeFunctions";

// React
import { useState, useEffect, useRef } from "react";

// Firebase
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  deleteDoc,
  runTransaction,
} from "firebase/firestore";

type InvItem = {
  docId: string; // unique stack/doc id
  id: string; // catalog id: "iw..." or "ib..."
  name: string;
  img?: string;
  tier?: number;
  value?: number;
  attack?: number;
  quantity?: number; // stacks for bullets
  usingBullets?: boolean; // for weapons
};

const db = getFirestore();

import { useCharacter } from "../../CharacterContext";
import { useCooldown } from "../../CooldownContext";

const Assassinate = () => {
  const { userCharacter } = useCharacter();
  const { cooldowns, startCooldown, jailRemainingSeconds } = useCooldown();
  const [targetPlayer, setTargetPlayer] = useState("");
  const [message, setMessage] = useState<React.ReactNode>("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "warning" | "info"
  >("info");
  const [bounties, setBounties] = useState<any[]>([]);
  const [addingBounty, setAddingBounty] = useState<boolean>(false);
  const [wantedPlayer, setWantedPlayer] = useState("");

  // Bullets only (we no longer offer weapon selection UI here)
  const [bulletStacks, setBulletStacks] = useState<InvItem[]>([]);

  // Local selection (not persisted)
  const [activeAmmoDocId, setActiveAmmoDocId] = useState<string | null>(null);
  const [activeAmmoQty, setActiveAmmoQty] = useState<number>(1);

  function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
  }

  // RAW input string to avoid formatting while typing
  const [bountyAmountInput, setBountyAmountInput] = useState<string>("");

  const bountyInputRef = useRef<HTMLInputElement>(null);

  const bountyCost = 100000;

  if (!userCharacter) {
    return null;
  }

  useEffect(() => {
    // Set up onSnapshot listener
    const bountyQuery = query(collection(db, "Bounty"));
    const unsubscribe = onSnapshot(bountyQuery, (querySnapshot) => {
      const updatedBounties = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBounties(updatedBounties);
    });

    return () => unsubscribe();
  }, []);

  const formatDigitsWithSpaces = (digits: string) =>
    digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  const formatMoney = (n: number) => {
    const localized = n.toLocaleString("nb-NO");
    const withSpaces = localized.replace(/\u00A0|\u202F/g, " ");
    return withSpaces === String(n)
      ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ")
      : withSpaces;
  };

  // NEW: parse input like "5k" -> "5000", "1m" -> "1000000"
  const parseAmountInput = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return "";

    const upper = trimmed.toUpperCase();
    const lastChar = upper[upper.length - 1];

    let multiplier = 1;
    let numericPart = upper;

    if (lastChar === "K") {
      multiplier = 1000;
      numericPart = upper.slice(0, -1);
    } else if (lastChar === "M") {
      multiplier = 1_000_000;
      numericPart = upper.slice(0, -1);
    }

    // keep digits only from the numeric part
    const digits = numericPart.replace(/[^\d]/g, "");
    if (!digits) return "";

    const base = parseInt(digits, 10);
    if (Number.isNaN(base)) return "";

    const amount = base * multiplier;
    return String(amount); // stored as plain digits
  };

  const parsedBountyAmount = (): number =>
    bountyAmountInput === "" ? 0 : parseInt(bountyAmountInput, 10);

  // Subscribe to bullets
  useEffect(() => {
    if (!userCharacter?.id) {
      setBulletStacks([]);
      return;
    }

    const itemsRef = collection(db, "Characters", userCharacter.id, "items");
    const unsub = onSnapshot(itemsRef, (snap) => {
      const all: InvItem[] = snap.docs.map((d) => {
        const v = d.data() as any;
        return {
          docId: d.id,
          id: String(v.id ?? ""),
          name: String(v.name ?? "Ukjent"),
          img: v.img ?? undefined,
          tier: Number(v.tier ?? 1),
          value: Number(v.value ?? 0),
          attack: Number(v.attack ?? 0),
          quantity: Number(v.quantity ?? 1),
          usingBullets: Boolean(v.usingBullets),
        };
      });

      setBulletStacks(all.filter((it) => it.id?.startsWith("ib")));
    });

    return () => unsub();
  }, [userCharacter?.id]);

  // Remove bounty
  const removeBounty = async (bountyId: string, bountyAmount: number) => {
    try {
      const refundAmount = bountyAmount;
      const updatedMoney = userCharacter.stats.money + refundAmount;

      await updateDoc(doc(db, "Characters", userCharacter.id), {
        "stats.money": updatedMoney,
      });

      await deleteDoc(doc(db, "Bounty", bountyId));

      setMessage(
        <p>
          Dusøren ble fjernet, og <i className="fa-solid fa-dollar-sign"></i>{" "}
          <strong>{formatMoney(refundAmount)}</strong> ble refundert.
        </p>
      );
      setMessageType("success");
    } catch (error) {
      console.error("Error removing bounty:", error);
      setMessage("En feil oppstod under fjerning av dusøren.");
      setMessageType("failure");
    }
  };

  // Assassinate
  const killPlayer = async () => {
    if (jailRemainingSeconds || (cooldowns.attack ?? 0) > 0) return;

    const input = targetPlayer.trim();
    if (!input) {
      setMessage("Du må skrive inn et brukernavn.");
      setMessageType("warning");
      return;
    }

    try {
      // Look up target by username
      const q = query(
        collection(db, "Characters"),
        where("username_lowercase", "==", input.toLowerCase())
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setMessage(`Spilleren ${input} finnes ikke.`);
        setMessageType("warning");
        return;
      }

      const targetSnap = querySnapshot.docs[0];
      const targetDocId = targetSnap.id;
      const targetRef = doc(db, "Characters", targetDocId);
      const targetData: any = targetSnap.data();

      // Basic guards
      if (userCharacter?.username === targetData.username) {
        setMessage(`Du kan ikke drepe deg selv.`);
        setMessageType("warning");
        return;
      }
      if ((targetData.role || "") === "admin") {
        setMessage("Du kan ikke drepe en administrator.");
        setMessageType("warning");
        return;
      }
      if (targetData.status === "dead") {
        setMessage(
          <p>
            <Username
              character={{ id: targetDocId, username: targetData.username }}
            />{" "}
            er allerede død.
          </p>
        );
        setMessageType("warning");
        return;
      }
      if (userCharacter?.location !== targetData.location) {
        setMessage(
          <p>
            Du kunne ikke finne{" "}
            <Username
              character={{ id: targetDocId, username: targetData.username }}
            />{" "}
            i {userCharacter?.location}!
          </p>
        );
        setMessageType("failure");
        return;
      }

      // ------ Damage calc with equipped weapon + selected bullets ------
      const equippedWeapon = userCharacter?.equipment?.weapon || null;

      const weaponAttack = equippedWeapon
        ? typeof equippedWeapon.attack === "number"
          ? equippedWeapon.attack
          : 1
        : 0;

      // Use local UI selection (no more "Velg kuler" button)
      const currentAmmoDocId = activeAmmoDocId || null;
      const selectedBullet = currentAmmoDocId
        ? bulletStacks.find((b) => b.docId === currentAmmoDocId) || null
        : null;

      // If weapon uses bullets, we must have a selection and a valid qty
      let shots = 1;
      let bulletAttack = 0;

      if (equippedWeapon?.usingBullets) {
        if (!selectedBullet) {
          setMessage("Du må velge en kule-stabel.");
          setMessageType("warning");
          return;
        }
        const owned = Math.max(0, Number(selectedBullet.quantity ?? 0));
        const desired = clamp(
          Math.floor(activeAmmoQty || 0),
          1,
          Math.max(1, owned)
        );

        if (desired > owned) {
          setMessage(
            `Du har bare ${owned.toLocaleString(
              "nb-NO"
            )} kuler i denne stabelen.`
          );
          setMessageType("warning");
          return;
        }

        shots = desired;
        // If bullet has no attack field, treat as +1 per the earlier convention
        bulletAttack =
          typeof selectedBullet.attack === "number" ? selectedBullet.attack : 1;
      }

      // Potensiell skade = (weapon + bullet) × number of bullets
      const damage = Math.max(1, (weaponAttack + bulletAttack) * shots);
      // ---------------------------------------------------------------

      let died = false;

      await runTransaction(db, async (tx) => {
        // READS FIRST
        const targetSnap = await tx.get(targetRef);
        if (!targetSnap.exists()) throw new Error("Target not found");

        let bulletSnap: any = null;
        if (equippedWeapon?.usingBullets && selectedBullet) {
          const bulletRef = doc(
            db,
            "Characters",
            userCharacter.id,
            "items",
            selectedBullet.docId
          );
          bulletSnap = await tx.get(bulletRef); // read BEFORE any write
          if (!bulletSnap.exists())
            throw new Error("Kulestabelen finnes ikke lenger.");
        }

        // Compute damage, newHp, ammo math using the fresh snapshots
        const td = targetSnap.data() as any;
        const currentHp =
          typeof td?.stats?.hp === "number"
            ? td.stats.hp
            : typeof td?.stats?.health === "number"
            ? td.stats.health
            : 0;

        const hpField =
          typeof td?.stats?.hp === "number" ? "stats.hp" : "stats.health";
        const newHp = Math.max(0, currentHp - damage);
        const died = newHp <= 0;

        let newAmmoQty: number | null = null;
        let bulletRef: ReturnType<typeof doc> | null = null;
        if (equippedWeapon?.usingBullets && selectedBullet && bulletSnap) {
          bulletRef = doc(
            db,
            "Characters",
            userCharacter.id,
            "items",
            selectedBullet.docId
          );
          const curQty = Number((bulletSnap.data() as any)?.quantity ?? 0);
          if (curQty < shots) throw new Error("Du har ikke nok kuler.");
          newAmmoQty = curQty - shots;
        }

        // WRITES AFTER ALL READS
        const updates: Record<string, any> = { [hpField]: newHp };
        if (died) {
          updates.status = "dead";
          updates.diedAt = serverTimestamp();
        }
        tx.update(targetRef, updates);

        if (
          equippedWeapon?.usingBullets &&
          bulletRef !== null &&
          newAmmoQty !== null
        ) {
          if (newAmmoQty <= 0) {
            tx.delete(bulletRef);
          } else {
            tx.update(bulletRef, {
              quantity: newAmmoQty,
              lastUpdated: serverTimestamp(),
            });
          }
        }
      });

      // Always add an alert to the victim about the attack
      await addDoc(collection(db, `Characters/${targetDocId}/alerts`), {
        type: "attack",
        timestamp: serverTimestamp(),
        attackerId: userCharacter.id,
        attackerName: userCharacter.username,
        healthLost: damage,
        read: false,
      });

      if (died) {
        const bountyQuery = query(
          collection(db, "Bounty"),
          where("WantedId", "==", targetDocId)
        );
        const bountySnapshot = await getDocs(bountyQuery);

        let totalBountyAmount = 0;
        const bountyIdsToDelete: string[] = [];

        bountySnapshot.forEach((d) => {
          const bountyData = d.data() as any;
          totalBountyAmount += Number(bountyData.Bounty || 0);
          bountyIdsToDelete.push(d.id);
        });

        if (totalBountyAmount > 0) {
          await updateDoc(doc(db, "Characters", userCharacter.id), {
            "stats.money": (userCharacter.stats.money || 0) + totalBountyAmount,
          });

          for (const bountyId of bountyIdsToDelete) {
            await deleteDoc(doc(db, "Bounty", bountyId));
          }

          await addDoc(
            collection(db, `Characters/${userCharacter.id}/alerts`),
            {
              type: "bountyReward",
              timestamp: serverTimestamp(),
              killedPlayerId: targetDocId,
              killedPlayerName: targetData.username,
              bountyAmount: totalBountyAmount,
              read: false,
            }
          );
        }

        setMessage(
          totalBountyAmount > 0 ? (
            <p>
              Du drepte{" "}
              <Username
                character={{ id: targetDocId, username: targetData.username }}
              />{" "}
              og mottok <strong>${formatMoney(totalBountyAmount)}</strong> i
              dusør!
            </p>
          ) : (
            <p>
              Du drepte{" "}
              <Username
                character={{ id: targetDocId, username: targetData.username }}
              />
              !
            </p>
          )
        );
        setMessageType("success");

        await updateDoc(doc(db, "Characters", userCharacter.id), {
          lastActive: serverTimestamp(),
        });
        await addDoc(collection(db, "GameEvents"), {
          eventType: "assassination",
          assassinId: userCharacter.id,
          assassinName: userCharacter.username,
          victimId: targetDocId,
          victimName: targetData.username,
          location: userCharacter.location,
          bountyPaid: 0,
          timestamp: serverTimestamp(),
        });
      } else {
        setMessage(
          <p>
            Du angrep{" "}
            <Username
              character={{ id: targetDocId, username: targetData.username }}
            />
            . Spilleren tok <strong>{damage}</strong> skade, men overlevde.
          </p>
        );
        setMessageType("info");

        await updateDoc(doc(db, "Characters", userCharacter.id), {
          lastActive: serverTimestamp(),
        });
      }

      setTargetPlayer("");
      await startCooldown("attack");
    } catch (error: any) {
      console.error("Error during attack:", error);
      setMessage(
        error?.message ||
          "En ukjent feil oppstod da du forsøkte å angripe en spiller."
      );
      setMessageType("failure");
    }
  };

  // Add bounty
  const addBounty = async () => {
    const bountyAmount = parsedBountyAmount();

    if (!wantedPlayer || bountyAmount <= 0) {
      setMessageType("warning");
      setMessage(
        "Du må skrive inn dusørbeløp og brukernavn på den du ønsker drept."
      );
      return;
    }

    const totalBountyCost = bountyAmount + bountyCost;

    if (userCharacter.stats.money < totalBountyCost) {
      setMessageType("warning");
      setMessage("Du har ikke nok penger til å utlove dusøren.");
      return;
    }

    try {
      const q = query(
        collection(db, "Characters"),
        where("username_lowercase", "==", wantedPlayer.toLowerCase())
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setMessage(`Spilleren ${wantedPlayer} finnes ikke.`);
        setMessageType("warning");
        return;
      }

      const playerData = querySnapshot.docs[0].data() as any;
      const wantedPlayerId = querySnapshot.docs[0].id;

      if (userCharacter?.username === playerData.username) {
        setMessage(`Du kan ikke utlove dusør på deg selv.`);
        setMessageType("warning");
        return;
      }
      if ((playerData.role || "") === "admin") {
        setMessage("Du kan ikke utlove dusør på en administrator.");
        setMessageType("warning");
        return;
      }

      await addDoc(collection(db, "Bounty"), {
        WantedId: wantedPlayerId,
        WantedName: playerData.username,
        Bounty: bountyAmount,
        PaidById: userCharacter.id,
        PaidByName: userCharacter.username,
        createdAt: serverTimestamp(),
      });

      const updatedMoney = userCharacter.stats.money - totalBountyCost;
      await updateDoc(doc(db, "Characters", userCharacter.id), {
        "stats.money": updatedMoney,
      });

      setMessage(
        <p>
          Du utlovet en dusør på <strong>${formatMoney(bountyAmount)}</strong>{" "}
          for å drepe{" "}
          <Username
            useParentColor
            character={{ id: wantedPlayerId, username: playerData.username }}
          />
          .
        </p>
      );
      setMessageType("success");
      setWantedPlayer("");
      setBountyAmountInput("");
      setAddingBounty(false);
    } catch (error) {
      console.error("Error adding bounty:", error);
      setMessage("En feil oppstod under opprettelsen av dusøren.");
      setMessageType("failure");
    }
  };

  if (userCharacter?.inJail && jailRemainingSeconds > 0) {
    return <JailBox message={message} messageType={messageType} />;
  }

  const bountyAmount = parsedBountyAmount();
  const hasBountyAmount = bountyAmountInput !== "" && bountyAmount > 0;

  // Equipped weapon
  const equippedWeapon = userCharacter?.equipment?.weapon || null;
  const capacity = equippedWeapon?.usingBullets
    ? Math.max(1, Number((equippedWeapon as any).capacity ?? 1))
    : 1;

  // Attack numbers for UI preview
  const weaponAttack = equippedWeapon
    ? typeof equippedWeapon.attack === "number"
      ? equippedWeapon.attack
      : 1
    : 0;

  // Local UI selection only (no persistence)
  const currentAmmoDocId = activeAmmoDocId || null;
  const activeBullet = currentAmmoDocId
    ? bulletStacks.find((b) => b.docId === currentAmmoDocId) || null
    : null;

  // Does this weapon require bullets?
  const needsAmmo = !!equippedWeapon?.usingBullets;

  // Effective quantity: if ammo is required but none selected, qty = 0 (so damage=0)
  const effectiveQty = needsAmmo
    ? activeBullet
      ? clamp(
          activeAmmoQty,
          1,
          Math.min(capacity, Math.max(1, Number(activeBullet.quantity ?? 1)))
        )
      : 0
    : 1;

  // Bullet attack only counts when weapon needs ammo AND a stack is selected

  const effectiveBulletAttack =
    needsAmmo && activeBullet
      ? typeof activeBullet.attack === "number"
        ? activeBullet.attack
        : 1
      : 0;

  // UI: Potensiell skade
  //  - no weapon -> 0
  //  - weapon that needs ammo but none selected -> 0
  //  - weapon that needs ammo with selection -> (weapon + bullet) * qty
  //  - weapon that doesn't need ammo -> weapon * 1
  const potentialDamage = equippedWeapon
    ? (weaponAttack + effectiveBulletAttack) * effectiveQty
    : 0;

  const attackRemaining = cooldowns.attack ?? 0;

  // Disable attack when:
  //  - no weapon equipped, or
  //  - weapon needs ammo but none selected or qty=0
  const attackDisabled =
    !equippedWeapon ||
    (needsAmmo && (!activeBullet || effectiveQty <= 0)) ||
    attackRemaining > 0 ||
    jailRemainingSeconds > 0;

  return (
    <Main>
      <H1>Drep spiller</H1>
      <p className="mb-4">Her kan du forsøke å drepe en annen spiller.</p>
      {message && (
        <InfoBox type={messageType} onClose={() => setMessage("")}>
          {message}
        </InfoBox>
      )}

      {cooldowns["attack"] > 0 && (
        <p className="mb-4 text-stone-400">
          Du må vente{" "}
          <span className="font-bold text-neutral-200">
            {compactMmSs(cooldowns["attack"])}
          </span>{" "}
          før du kan angripe.
        </p>
      )}

      {/* Assassinate */}
      {!addingBounty && (
        <div className="mb-8">
          <H2>Angrip spiller</H2>

          <Box>
            <div className="flex gap-8 flex-wrap">
              <div className="min-w-[280px]">
                <H3>Våpen</H3>
                <div className="flex flex-col gap-4">
                  {/* Equipped weapon only */}
                  <div>
                    {userCharacter?.equipment?.weapon ? (
                      <div className="flex items-center gap-2">
                        <ItemTile
                          name={userCharacter.equipment.weapon.name}
                          img={userCharacter.equipment.weapon.img}
                          tier={userCharacter.equipment.weapon.tier}
                          tooltipImg={userCharacter.equipment.weapon.img}
                          tooltipContent={
                            <ul className="space-y-0.5">
                              {"attack" in userCharacter.equipment.weapon && (
                                <li>
                                  Angrep:{" "}
                                  <strong className="text-neutral-200">
                                    +
                                    {userCharacter.equipment.weapon.attack ?? 1}
                                  </strong>
                                </li>
                              )}
                              {"capacity" in userCharacter.equipment.weapon && (
                                <li>
                                  Kapasitet:{" "}
                                  <strong className="text-neutral-200">
                                    {userCharacter.equipment.weapon.capacity ??
                                      1}
                                  </strong>
                                </li>
                              )}
                              <li>
                                Verdi:{" "}
                                <strong className="text-neutral-200">
                                  $
                                  {Number(
                                    userCharacter.equipment.weapon.value ?? 0
                                  ).toLocaleString("nb-NO")}
                                </strong>
                              </li>
                            </ul>
                          }
                        />

                        {/* Show selected bullet NEXT TO the weapon when it uses bullets */}
                        {userCharacter.equipment.weapon.usingBullets && (
                          <>
                            <i className="fa-solid fa-plus text-neutral-500" />
                            {activeBullet ? (
                              <ItemTile
                                name={activeBullet.name}
                                img={activeBullet.img || "/DefaultAvatar.jpg"}
                                tier={activeBullet.tier || 1}
                                qty={effectiveQty}
                                tooltipImg={activeBullet.img}
                                tooltipContent={
                                  <ul className="space-y-0.5">
                                    {"attack" in activeBullet && (
                                      <li>
                                        Angrep:{" "}
                                        <strong className="text-neutral-200">
                                          +{activeBullet.attack ?? 1}
                                        </strong>
                                      </li>
                                    )}
                                    <li>
                                      Verdi:{" "}
                                      <strong className="text-neutral-200">
                                        $
                                        {Number(
                                          activeBullet.value ?? 0
                                        ).toLocaleString("nb-NO")}
                                      </strong>
                                    </li>
                                  </ul>
                                }
                              />
                            ) : (
                              <span className="text-neutral-500 text-sm">
                                Ingen kuler valgt
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <p className="text-neutral-400">Ingen våpen utstyrt.</p>
                    )}
                  </div>

                  {/* Ammo picker (only when equipped weapon uses bullets) */}
                  {userCharacter?.equipment?.weapon?.usingBullets && (
                    <div className="mt-2">
                      {bulletStacks.length ? (
                        <>
                          <ul className="flex flex-wrap gap-2 mb-2">
                            {bulletStacks.map((b) => {
                              const qty = Number(b.quantity ?? 1);
                              return (
                                <li key={b.docId}>
                                  <button
                                    className="relative rounded-xl hover:opacity-90"
                                    onClick={() => {
                                      setActiveAmmoDocId(b.docId);
                                      setActiveAmmoQty((q) =>
                                        clamp(q, 1, Math.max(1, qty))
                                      );
                                    }}
                                    title="Velg denne kulestabelen"
                                  >
                                    <ItemTile
                                      name={b.name}
                                      img={b.img || ""}
                                      tier={b.tier || 1}
                                      qty={qty}
                                      tooltipImg={b.img}
                                      tooltipContent={
                                        <ul className="space-y-0.5">
                                          {"attack" in b && (
                                            <li>
                                              Angrep:{" "}
                                              <strong className="text-neutral-200">
                                                +{b.attack ?? 1}
                                              </strong>
                                            </li>
                                          )}
                                          <li>
                                            Verdi:{" "}
                                            <strong className="text-neutral-200">
                                              $
                                              {Number(
                                                b.value ?? 0
                                              ).toLocaleString("nb-NO")}
                                            </strong>
                                          </li>
                                        </ul>
                                      }
                                    />
                                  </button>
                                </li>
                              );
                            })}
                          </ul>

                          {/* qty selector shows only if a stack is selected */}
                          {activeAmmoDocId && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-neutral-300">
                                Antall:
                              </span>
                              {(() => {
                                const sel = bulletStacks.find(
                                  (b) => b.docId === activeAmmoDocId
                                );
                                const ownedMax = sel
                                  ? Number(sel.quantity ?? 1)
                                  : 1;
                                const maxAllowed = Math.min(ownedMax, capacity);
                                return (
                                  <>
                                    <Button
                                      size="small-square"
                                      style="secondary"
                                      onClick={() =>
                                        setActiveAmmoQty((q) =>
                                          clamp(q - 1, 1, maxAllowed)
                                        )
                                      }
                                      disabled={activeAmmoQty <= 1}
                                      aria-label="Mindre"
                                    >
                                      −
                                    </Button>
                                    <input
                                      type="number"
                                      className="w-16 bg-transparent py-1 border-b border-neutral-600 text-neutral-200 text-center"
                                      min={1}
                                      max={maxAllowed}
                                      value={activeAmmoQty}
                                      onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setActiveAmmoQty(
                                          clamp(
                                            isFinite(v) ? v : 1,
                                            1,
                                            maxAllowed
                                          )
                                        );
                                      }}
                                    />
                                    <Button
                                      size="small-square"
                                      style="secondary"
                                      onClick={() =>
                                        setActiveAmmoQty((q) =>
                                          clamp(q + 1, 1, maxAllowed)
                                        )
                                      }
                                      disabled={activeAmmoQty >= maxAllowed}
                                      aria-label="Mer"
                                    >
                                      +
                                    </Button>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-neutral-400">Du har ingen kuler.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <H3>Offer</H3>
                <div className="flex flex-col gap-2 ">
                  <input
                    type="text"
                    placeholder="Brukernavn"
                    value={targetPlayer}
                    spellCheck={false}
                    onChange={(e) => setTargetPlayer(e.target.value)}
                    className="bg-transparent border-b border-neutral-600 py-1 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        killPlayer();
                      }
                    }}
                  />
                </div>

                <p className="mt-4 text-neutral-300">Potensiell skade</p>
                <H3>{potentialDamage}</H3>

                <div className="mt-2">
                  <Button onClick={killPlayer} disabled={attackDisabled}>
                    Angrip
                  </Button>
                </div>
              </div>
            </div>
          </Box>
        </div>
      )}

      <div className="flex  flex-col gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            {addingBounty ? <H2>Ny dusør</H2> : <H2>Utlovede dusører</H2>}
            <Button
              style="black"
              size="small"
              onClick={() => setAddingBounty(!addingBounty)}
            >
              {addingBounty ? (
                <p>
                  <i className="fa-solid fa-x"></i>
                </p>
              ) : (
                <p>
                  <i className="fa-solid fa-plus"></i> Ny dusør
                </p>
              )}
            </Button>
          </div>

          {addingBounty ? (
            <div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col">
                  <p>Utlov dusør på en spiller du ønsker drept.</p>
                  <p className="mb-4">
                    Å utlove en dusør koster ${formatMoney(bountyCost)} +
                    dusørbeløpet.
                  </p>
                  <H3>Ønsket drept</H3>
                  <input
                    type="text"
                    placeholder="Brukernavn"
                    value={wantedPlayer}
                    spellCheck={false}
                    onChange={(e) => setWantedPlayer(e.target.value)}
                    className="bg-transparent border-b border-neutral-600 py-1 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
                  />
                </div>

                <div className="flex flex-col mb-4">
                  <H3>Dusørbeløp</H3>
                  <input
                    ref={bountyInputRef}
                    className="bg-transparent border-b border-neutral-600 py-1 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
                    type="text"
                    inputMode="numeric"
                    placeholder="Beløp"
                    value={
                      bountyAmountInput
                        ? formatDigitsWithSpaces(bountyAmountInput)
                        : ""
                    }
                    onChange={(e) => {
                      setBountyAmountInput(parseAmountInput(e.target.value));
                    }}
                    onBlur={(e) => {
                      const cleaned = parseAmountInput(e.target.value).replace(
                        /^0+(?!$)/,
                        ""
                      );
                      setBountyAmountInput(cleaned);
                    }}
                  />
                </div>

                {hasBountyAmount && (
                  <p className="mb-4 text-neutral-200">
                    Kostnad:{" "}
                    <span className="font-medium text-yellow-400">
                      ${formatMoney(bountyAmount + bountyCost)}
                    </span>
                  </p>
                )}
              </div>
              <div>
                <Button onClick={addBounty}>Utlov dusør</Button>
              </div>
            </div>
          ) : (
            <>
              <p>
                Du mottar automatisk dusørbeløpet dersom du dreper en spiller på
                dusørlisten.
              </p>

              <div className="w-full my-4">
                <div className="grid grid-cols-3 border border-neutral-700 bg-neutral-950 text-stone-200">
                  <p className="font-medium px-2 py-1">Ønsket drept</p>
                  <p className="font-medium px-2 py-1">Dusør</p>
                  <p className="font-medium px-2 py-1">Betalt av</p>
                </div>

                {bounties.length > 0 ? (
                  <ul>
                    {bounties.map((bounty) => (
                      <li
                        key={bounty.id}
                        className="grid grid-cols-3 border bg-neutral-800 border-neutral-700"
                      >
                        <div className="px-2 py-1">
                          <Username
                            character={{
                              id: bounty.WantedId,
                              username: bounty.WantedName,
                            }}
                          />
                        </div>
                        <div className="px-2 py-1 text-yellow-400 font-bold">
                          ${Number(bounty.Bounty).toLocaleString("nb-NO")}
                        </div>
                        <div className="px-2 py-1">
                          <Username
                            character={{
                              id: bounty.PaidById,
                              username: bounty.PaidByName,
                            }}
                          />
                        </div>
                        {bounty.PaidById === userCharacter.id && (
                          <div className="px-2 py-1 text-center col-span-3">
                            <Button
                              style="danger"
                              size="small"
                              onClick={() =>
                                removeBounty(bounty.id, bounty.Bounty)
                              }
                            >
                              <i className="fa-solid fa-xmark"></i> Fjern dusør
                            </Button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-2 py-1 border bg-neutral-800 border-neutral-700">
                    Det er ingen utlovede dusører.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Main>
  );
};

export default Assassinate;
