import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import H2 from "../../components/Typography/H2";
import H3 from "../../components/Typography/H3";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";
import JailBox from "../../components/JailBox";
import Username from "../../components/Typography/Username";
import ItemTile from "../../components/ItemTile";

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
  const { jailRemainingSeconds } = useCooldown();
  const [targetPlayer, setTargetPlayer] = useState("");
  const [message, setMessage] = useState<React.ReactNode>("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "warning" | "info"
  >("info");
  const [bounties, setBounties] = useState<any[]>([]);
  const [addingBounty, setAddingBounty] = useState<boolean>(false);
  const [wantedPlayer, setWantedPlayer] = useState("");

  const [weaponStacks, setWeaponStacks] = useState<InvItem[]>([]);
  const [bulletStacks, setBulletStacks] = useState<InvItem[]>([]);

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

  // Subscribe to weapons and bullets
  useEffect(() => {
    if (!userCharacter?.id) {
      setWeaponStacks([]);
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
          usingBullets: Boolean(v.usingBullets), // only relevant for weapons
        };
      });

      // Prefix-based filtering (matches your data set)
      setWeaponStacks(all.filter((it) => it.id?.startsWith("iw")));
      setBulletStacks(all.filter((it) => it.id?.startsWith("ib")));
    });

    return () => unsub();
  }, [userCharacter?.id]);

  const sanitizeInt = (s: string) => s.replace(/[^\d]/g, ""); // keep digits only

  const parsedBountyAmount = (): number =>
    bountyAmountInput === "" ? 0 : parseInt(bountyAmountInput, 10);

  // Equip weapon
  async function equipWeaponFromInventory(item: InvItem) {
    if (!userCharacter?.id) return;

    const charRef = doc(db, "Characters", userCharacter.id);
    const invRef = doc(db, "Characters", userCharacter.id, "items", item.docId);

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(charRef);
      const data = (snap.data() || {}) as any;
      const current = data?.equipment?.weapon || null;

      // return currently equipped weapon back to inventory (optional)
      if (current?.fromDocId) {
        // (if you stored fromDocId when equipping)
        const backRef = doc(
          db,
          "Characters",
          userCharacter.id,
          "items",
          current.fromDocId
        );
        tx.set(
          backRef,
          {
            ...current,
            returnedFromSlot: "weapon",
            returnedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else if (current) {
        // No back reference? Just create a new auto-id doc with the metadata
        const backRef = doc(
          collection(db, "Characters", userCharacter.id, "items")
        );
        tx.set(backRef, {
          ...current,
          returnedFromSlot: "weapon",
          returnedAt: serverTimestamp(),
        });
      }

      // Equip the chosen weapon
      tx.update(charRef, {
        "equipment.weapon": {
          id: item.id,
          name: item.name,
          img: item.img ?? null,
          tier: item.tier ?? 1,
          value: item.value ?? 0,
          attack: item.attack ?? 0,
          slot: "weapon",
          usingBullets: Boolean(item.usingBullets),
          fromDocId: item.docId,
          equippedAt: serverTimestamp(),
        },
      });

      // Remove it from inventory
      tx.delete(invRef);
    });
  }

  // Set active Ammo
  async function setActiveAmmo(docId: string, qty: number) {
    if (!userCharacter?.id) return;
    const charRef = doc(db, "Characters", userCharacter.id);
    await updateDoc(charRef, {
      "combatLoadout.activeAmmo": {
        docId,
        qty,
        setAt: serverTimestamp(),
      },
    });
  }

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

      // ------ NEW: apply damage atomically ------
      const damage = Math.max(1, Number(totalAttack) || 1); // safety; min 1 damage
      let died = false;
      let newHp = 0;
      let hpField: "stats.hp" | "stats.health" = "stats.hp"; // decide which field to update

      await runTransaction(db, async (tx) => {
        const fresh = await tx.get(targetRef);
        if (!fresh.exists()) throw new Error("Target not found");

        const td = fresh.data() as any;
        const currentHp =
          typeof td?.stats?.hp === "number"
            ? td.stats.hp
            : typeof td?.stats?.health === "number"
            ? td.stats.health
            : 0;

        // remember which key to write back
        hpField =
          typeof td?.stats?.hp === "number" ? "stats.hp" : "stats.health";

        newHp = Math.max(0, currentHp - damage);
        died = newHp <= 0;

        const updates: Record<string, any> = { [hpField]: newHp };
        if (died) {
          updates.status = "dead";
          updates.diedAt = serverTimestamp();
        }

        tx.update(targetRef, updates);
      });
      // ------------------------------------------

      // Always add an alert to the victim about the attack
      await addDoc(collection(db, `Characters/${targetDocId}/alerts`), {
        type: "attack",
        timestamp: serverTimestamp(),
        attackerId: userCharacter.id,
        attackerName: userCharacter.username,
        healthLost: damage,
        read: false,
      });

      // If the target died, pay any bounty + game event (keeps your old behavior)
      if (died) {
        // Collect bounties on the victim (if any)
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

        // Payout bounty to attacker
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

        // Feedback
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

        // Log game event + touch attacker
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
          bountyPaid: totalBountyAmount > 0 ? totalBountyAmount : 0,
          timestamp: serverTimestamp(),
        });
      } else {
        // Survived: show info message
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

        // (Optional) touch attacker activity
        await updateDoc(doc(db, "Characters", userCharacter.id), {
          lastActive: serverTimestamp(),
        });
      }

      // Clear input
      setTargetPlayer("");
    } catch (error) {
      console.error("Error during attack:", error);
      setMessage("En ukjent feil oppstod da du forsøkte å angripe en spiller.");
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
      // Check player exists
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

  // Inputs
  const handleTargetInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTargetPlayer(event.target.value);
  };

  const handleWantedInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setWantedPlayer(event.target.value);
  };

  const handleBountyAmountInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    // Keep RAW digits only to avoid reformatting while typing
    const cleaned = sanitizeInt(e.target.value);
    setBountyAmountInput(cleaned);
  };

  if (userCharacter?.inJail && jailRemainingSeconds > 0) {
    return <JailBox message={message} messageType={messageType} />;
  }

  const bountyAmount = parsedBountyAmount();
  const hasBountyAmount = bountyAmountInput !== "" && bountyAmount > 0;

  // Equipped weapon
  const equippedWeapon = userCharacter?.equipment?.weapon || null;

  // Weapon attack: if the weapon exists but lacks an `attack` prop, use 1.
  // If there is no weapon at all, treat as 0.
  const weaponAttack = equippedWeapon
    ? typeof equippedWeapon.attack === "number"
      ? equippedWeapon.attack
      : 1
    : 0;

  // Find the active bullet stack: prefer the UI’s current selection, otherwise what’s saved on the character.
  const savedAmmoDocId =
    userCharacter?.combatLoadout?.activeAmmo?.docId ?? null;
  const currentAmmoDocId = activeAmmoDocId ?? savedAmmoDocId;

  const activeBullet = currentAmmoDocId
    ? bulletStacks.find((b) => b.docId === currentAmmoDocId) || null
    : null;

  // Bullet attack:
  // - If the equipped weapon uses bullets:
  //     - If a bullet stack is selected but its `attack` prop is missing -> 1
  //     - If no bullet stack is selected -> 1 (missing attack info)
  // - If the weapon does NOT use bullets -> 0 (no bullets contribute)
  const bulletAttack = equippedWeapon?.usingBullets
    ? activeBullet
      ? typeof activeBullet.attack === "number"
        ? activeBullet.attack
        : 1
      : 1
    : 0;

  // Total attack shown in the UI
  const totalAttack = weaponAttack + bulletAttack;

  return (
    <Main>
      <H1>Drep spiller</H1>
      <p className="mb-4">Her kan du forsøke å drepe en annen spiller.</p>
      {message && (
        <InfoBox type={messageType} onClose={() => setMessage("")}>
          {message}
        </InfoBox>
      )}

      {/* Assassinate */}
      {!addingBounty && (
        <div className="mb-8">
          <H2>Angrip spiller</H2>
          <H3>Angrep: {totalAttack}</H3>

          <div className="flex gap-8 flex-wrap">
            <div>
              <H3>Velg våpen</H3>
              <div className="flex flex-col gap-4">
                {/* Equipped weapon */}
                <div>
                  <p className="text-neutral-300 mb-1">Aktivt våpen</p>
                  {userCharacter?.equipment?.weapon ? (
                    <div className="flex items-center gap-2">
                      <ItemTile
                        name={userCharacter.equipment.weapon.name}
                        img={userCharacter.equipment.weapon.img}
                        tier={userCharacter.equipment.weapon.tier}
                      />
                      <div className="leading-5">
                        <p className="text-neutral-100 font-medium">
                          {userCharacter.equipment.weapon.name}
                        </p>
                        {typeof userCharacter.equipment.weapon.attack ===
                          "number" && (
                          <p className="text-neutral-400 text-sm">
                            Skade:{" "}
                            <strong className="text-neutral-200">
                              +{userCharacter.equipment.weapon.attack}
                            </strong>
                          </p>
                        )}
                        {userCharacter.equipment.weapon.usingBullets && (
                          <p className="text-neutral-400 text-sm">
                            Bruker kuler
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-neutral-400">Ingen våpen utstyrt.</p>
                  )}
                </div>

                {/* Other weapons in inventory */}
                <div>
                  <p className="text-neutral-300 mb-1">Andre våpen</p>
                  {weaponStacks.length ? (
                    <ul className="flex flex-wrap gap-2">
                      {weaponStacks.map((w) => (
                        <li key={w.docId}>
                          <button
                            className="flex items-center gap-2 hover:bg-neutral-800 rounded-xl pr-3"
                            onClick={() => equipWeaponFromInventory(w)}
                            title="Utstyr dette våpenet"
                          >
                            <ItemTile
                              name={w.name}
                              img={w.img || ""}
                              tier={w.tier || 1}
                            />
                            <div className="leading-5 text-left">
                              <p className="text-neutral-100 font-medium">
                                {w.name}
                              </p>
                              {typeof w.attack === "number" && (
                                <p className="text-neutral-400 text-sm">
                                  Skade:{" "}
                                  <strong className="text-neutral-200">
                                    +{w.attack}
                                  </strong>
                                </p>
                              )}
                              {w.usingBullets && (
                                <p className="text-neutral-400 text-xs">
                                  Bruker kuler
                                </p>
                              )}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-neutral-400">
                      Du har ingen våpen i sekken.
                    </p>
                  )}
                </div>

                {/* Ammo picker (only when equipped weapon uses bullets) */}
                {userCharacter?.equipment?.weapon?.usingBullets && (
                  <div className="mt-2">
                    <p className="text-neutral-300 mb-1">Velg kuler</p>
                    {bulletStacks.length ? (
                      <>
                        <ul className="flex flex-wrap gap-2 mb-2">
                          {bulletStacks.map((b) => {
                            const isSelected = activeAmmoDocId === b.docId;
                            const qty = Number(b.quantity ?? 1);
                            return (
                              <li key={b.docId}>
                                <button
                                  className={`relative rounded-xl ${
                                    isSelected ? "ring-2 ring-sky-400" : ""
                                  }`}
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
                              const maxSellable = sel
                                ? Number(sel.quantity ?? 1)
                                : 1;
                              return (
                                <>
                                  <Button
                                    size="small-square"
                                    style="secondary"
                                    onClick={() =>
                                      setActiveAmmoQty((q) =>
                                        clamp(q - 1, 1, maxSellable)
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
                                    max={maxSellable}
                                    value={activeAmmoQty}
                                    onChange={(e) => {
                                      const v = Number(e.target.value);
                                      setActiveAmmoQty(
                                        clamp(
                                          isFinite(v) ? v : 1,
                                          1,
                                          maxSellable
                                        )
                                      );
                                    }}
                                  />
                                  <Button
                                    size="small-square"
                                    style="secondary"
                                    onClick={() =>
                                      setActiveAmmoQty((q) =>
                                        clamp(q + 1, 1, maxSellable)
                                      )
                                    }
                                    disabled={activeAmmoQty >= maxSellable}
                                    aria-label="Mer"
                                  >
                                    +
                                  </Button>

                                  <Button
                                    onClick={() =>
                                      setActiveAmmo(
                                        activeAmmoDocId,
                                        activeAmmoQty
                                      )
                                    }
                                  >
                                    Velg kuler
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
              <H3>Velg offer</H3>
              <div className="flex flex-col gap-2 ">
                <input
                  type="text"
                  placeholder="Brukernavn"
                  value={targetPlayer}
                  spellCheck={false}
                  onChange={handleTargetInput}
                  className="bg-transparent border-b border-neutral-600 py-1 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      killPlayer();
                    }
                  }}
                />
                <div>
                  <Button onClick={killPlayer}>Angrip spiller</Button>
                </div>
              </div>
            </div>
          </div>
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
                    onChange={handleWantedInput}
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
                    value={formatDigitsWithSpaces(bountyAmountInput)}
                    onChange={handleBountyAmountInputChange}
                    onBlur={(e) => {
                      // Optional: trim leading zeros on blur
                      const cleaned = sanitizeInt(e.target.value).replace(
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
