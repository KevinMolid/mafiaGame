import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import H2 from "../../components/Typography/H2";
import H3 from "../../components/Typography/H3";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";
import JailBox from "../../components/JailBox";
import Username from "../../components/Typography/Username";

// React
import { useState, useEffect } from "react";

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

const Assassinate = () => {
  const { userCharacter } = useCharacter();
  const [targetPlayer, setTargetPlayer] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "warning" | "info"
  >("info");
  const [bounties, setBounties] = useState<any[]>([]);
  const [addingBounty, setAddingBounty] = useState<boolean>(false);
  const [wantedPlayer, setWantedPlayer] = useState("");
  const [bountyAmount, setBountyAmount] = useState<number | "">("");

  const bountyCost = 100000;

  if (!userCharacter) {
    return;
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

    // Clean up the listener on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  // Function to remove a bounty
  const removeBounty = async (bountyId: string, bountyAmount: number) => {
    try {
      // Refund the bounty amount (excluding the fixed cost)
      const refundAmount = bountyAmount;
      const updatedMoney = userCharacter.stats.money + refundAmount;

      // Update player's money
      await updateDoc(doc(db, "Characters", userCharacter.id), {
        "stats.money": updatedMoney,
      });

      // Delete the bounty from the database
      await deleteDoc(doc(db, "Bounty", bountyId));

      setMessage(
        `Dusøren ble fjernet, og $${refundAmount.toLocaleString()} ble refundert.`
      );
      setMessageType("success");
    } catch (error) {
      console.error("Error removing bounty:", error);
      setMessage("En feil oppstod under fjerning av dusøren.");
      setMessageType("failure");
    }
  };

  // Function to handle assassination
  const killPlayer = async () => {
    if (!targetPlayer) {
      setMessage("Du må skrive inn et brukernavn.");
      setMessageType("warning");
      return;
    }

    try {
      // Query the "Characters" collection for a player with the matching username
      const q = query(
        collection(db, "Characters"),
        where("username_lowercase", "==", targetPlayer.toLowerCase())
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // No player found
        setMessage(`Spilleren ${targetPlayer} finnes ikke.`);
        setMessageType("warning");
      } else {
        const playerData = querySnapshot.docs[0].data();
        const targetDocId = querySnapshot.docs[0].id;

        if (userCharacter?.username === playerData.username) {
          // Suicide
          setMessage(`Du kan ikke drepe deg selv!`);
          setMessageType("warning");
        } else if (playerData.status === "dead") {
          // Player is already dead
          setMessage(`${playerData.username} er allerede død!`);
          setMessageType("warning");
        } else if (userCharacter?.location !== playerData.location) {
          // Player is not in the same city
          setMessage(
            `Du kunne ikke finne ${playerData.username} i ${userCharacter?.location}!`
          );
          setMessageType("failure");
        } else {
          // Proceed with assassination
          setMessage(`Du angrep og drepte ${playerData.username}!`);
          setMessageType("success");

          // Update target player status to 'dead'
          await updateDoc(doc(db, "Characters", targetDocId), {
            status: "dead",
          });

          // Update assassin's lastActive timestamp
          await updateDoc(doc(db, "Characters", userCharacter.id), {
            lastActive: serverTimestamp(),
          });

          // Add a document to the GameEvents collection to log the assassination
          await addDoc(collection(db, "GameEvents"), {
            eventType: "assassination",
            assassinId: userCharacter.id,
            assassinName: userCharacter.username,
            victimId: targetDocId,
            victimName: playerData.username,
            location: userCharacter.location,
            timestamp: serverTimestamp(),
          });
        }
      }
    } catch (error) {
      // Handle any errors during the query
      console.error("Error checking target player:", error);
      setMessage("En ukjent feil oppstod da du prøvde å drepe en spiller.");
      setMessageType("failure");
    }
  };

  // Handle adding bounties in the db
  const addBounty = async () => {
    if (!wantedPlayer || bountyAmount === "" || bountyAmount <= 0) {
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
      // Check if the wanted player exists in the database
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

      const playerData = querySnapshot.docs[0].data();
      const wantedPlayerId = querySnapshot.docs[0].id;

      // Add the bounty to the Bounty collection
      await addDoc(collection(db, "Bounty"), {
        WantedId: wantedPlayerId,
        WantedName: playerData.username,
        Bounty: bountyAmount,
        PaidById: userCharacter.id,
        PaidByName: userCharacter.username,
        createdAt: serverTimestamp(),
      });

      // Deduct the bounty cost from the player's money
      const updatedMoney = userCharacter.stats.money - totalBountyCost;
      await updateDoc(doc(db, "Characters", userCharacter.id), {
        "stats.money": updatedMoney,
      });

      setMessage(
        `Du utlovet en dusør på $${bountyAmount.toLocaleString()} for å drepe ${
          playerData.username
        }!`
      );
      setMessageType("success");
      setWantedPlayer("");
      setBountyAmount("");
      setAddingBounty(false);
    } catch (error) {
      console.error("Error adding bounty:", error);
      setMessage("En feil oppstod under opprettelsen av dusøren.");
      setMessageType("failure");
    }
  };

  const handleTargetInput = (event: any) => {
    setTargetPlayer(event.target.value);
  };

  const handleWantedInput = (event: any) => {
    setWantedPlayer(event.target.value);
  };

  const handleBountyAmountInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value.replace(/,/g, ""); // Remove existing commas
    if (value === "" || isNaN(Number(value))) {
      setBountyAmount(""); // Clear the input if it's empty or invalid
    } else {
      const numericValue = parseInt(value, 10);
      setBountyAmount(numericValue); // Store the raw number
    }
  };

  if (userCharacter?.inJail) {
    return <JailBox message={message} messageType={messageType} />;
  }

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
                    Å utlove en dusør koster ${bountyCost.toLocaleString()} +
                    dusørbeløpet.
                  </p>
                  <H3>Ønsket drept</H3>
                  <input
                    type="text"
                    placeholder="Brukernavn"
                    value={wantedPlayer}
                    onChange={handleWantedInput}
                    className="bg-transparent border-b border-neutral-600 py-1 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
                  />
                </div>

                <div className="flex flex-col mb-4">
                  <H3>Dusørbeløp</H3>
                  <input
                    className="bg-transparent border-b border-neutral-600 py-1 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
                    type="text"
                    placeholder="Beløp"
                    value={
                      bountyAmount ? Number(bountyAmount).toLocaleString() : ""
                    }
                    onChange={handleBountyAmountInputChange}
                  />
                </div>
                {bountyAmount && (
                  <p className="mb-4 text-neutral-200">
                    Kostnad:{" "}
                    <span className="font-medium text-yellow-400">
                      ${(bountyAmount + bountyCost).toLocaleString()}
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
                          ${bounty.Bounty.toLocaleString()}
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
