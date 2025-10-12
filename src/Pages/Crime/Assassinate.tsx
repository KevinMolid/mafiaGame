import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import H2 from "../../components/Typography/H2";
import H3 from "../../components/Typography/H3";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";
import JailBox from "../../components/JailBox";
import Username from "../../components/Typography/Username";

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
} from "firebase/firestore";

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

  const sanitizeInt = (s: string) => s.replace(/[^\d]/g, ""); // keep digits only

  const parsedBountyAmount = (): number =>
    bountyAmountInput === "" ? 0 : parseInt(bountyAmountInput, 10);

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

      const targetDoc = querySnapshot.docs[0];
      const playerData: any = targetDoc.data();
      const targetDocId = targetDoc.id;

      if (userCharacter?.username === playerData.username) {
        setMessage(`Du kan ikke drepe deg selv.`);
        setMessageType("warning");
        return;
      }
      if ((playerData.role || "") === "admin") {
        setMessage("Du kan ikke drepe en administrator.");
        setMessageType("warning");
        return;
      }
      if (playerData.status === "dead") {
        setMessage(`${playerData.username} er allerede død!`);
        setMessageType("warning");
        return;
      }
      if (userCharacter?.location !== playerData.location) {
        setMessage(
          `Du kunne ikke finne ${playerData.username} i ${userCharacter?.location}!`
        );
        setMessageType("failure");
        return;
      }

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

      // 1) Kill the target regardless of bounty
      await updateDoc(doc(db, "Characters", targetDocId), {
        status: "dead",
        diedAt: serverTimestamp(),
      });

      // 2) If there is bounty, pay it and remove bounties + alert
      if (totalBountyAmount > 0) {
        const updatedMoney =
          (userCharacter.stats.money || 0) + totalBountyAmount;
        await updateDoc(doc(db, "Characters", userCharacter.id), {
          "stats.money": updatedMoney,
        });

        for (const bountyId of bountyIdsToDelete) {
          await deleteDoc(doc(db, "Bounty", bountyId));
        }

        await addDoc(collection(db, `Characters/${userCharacter.id}/alerts`), {
          type: "bountyReward",
          timestamp: serverTimestamp(),
          killedPlayerId: targetDocId,
          killedPlayerName: playerData.username,
          bountyAmount: totalBountyAmount,
          read: false,
        });
      }

      // 3) Feedback
      setMessage(
        totalBountyAmount > 0 ? (
          <p>
            Du angrep og drepte <strong>{playerData.username}</strong> og mottok{" "}
            <strong>${formatMoney(totalBountyAmount)}</strong> i dusør!
          </p>
        ) : (
          <p>
            Du angrep og drepte <strong>{playerData.username}</strong>.
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
        victimName: playerData.username,
        location: userCharacter.location,
        bountyPaid: totalBountyAmount > 0 ? totalBountyAmount : 0,
        timestamp: serverTimestamp(),
      });

      // Optional: clear input after success
      setTargetPlayer("");
    } catch (error) {
      console.error("Error checking target player:", error);
      setMessage("En ukjent feil oppstod da du prøvde å drepe en spiller.");
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

  return (
    <Main>
      <H1>Drep spiller</H1>
      <p className="mb-4">Her kan du forsøke å drepe en annen spiller.</p>
      {message && <InfoBox type={messageType}>{message}</InfoBox>}

      {/* Assassinate */}
      {!addingBounty && (
        <div className="mb-8">
          <H2>Hvem vil du drepe?</H2>
          <div className="flex flex-col gap-2 ">
            <input
              type="text"
              placeholder="Brukernavn"
              value={targetPlayer}
              spellCheck={false}
              onChange={handleTargetInput}
              className="bg-transparent border-b border-neutral-600 py-1 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
            />
            <div>
              <Button onClick={killPlayer}>Angrip spiller</Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex  flex-col gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            {addingBounty ? <H2>Ny dusør</H2> : <H2>Dusørliste</H2>}
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
