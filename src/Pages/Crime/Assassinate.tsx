import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import H2 from "../../components/Typography/H2";
import H3 from "../../components/Typography/H3";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";
import JailBox from "../../components/JailBox";
import Box from "../../components/Box";
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
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

const db = getFirestore();

import { useCharacter } from "../../CharacterContext";

const Assassinate = () => {
  const { character } = useCharacter();
  const [targetPlayer, setTargetPlayer] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "warning" | "info"
  >("info");
  const [bounties, setBounties] = useState<any[]>([]);
  const [addingBounty, setAddingBounty] = useState<boolean>(false);
  const [wantedPlayer, setWantedPlayer] = useState("");
  const [bountyAmount, setBountyAmount] = useState<number | "">("");

  if (!character) {
    return;
  }

  useEffect(() => {
    // Function to fetch bounties from the database
    const fetchBounties = async () => {
      try {
        const bountyQuery = query(collection(db, "Bounty"));
        const querySnapshot = await getDocs(bountyQuery);
        const bountiesList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBounties(bountiesList);
      } catch (error) {
        console.error("Error fetching bounties:", error);
      }
    };

    fetchBounties();
  }, []);

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

        if (character?.username === playerData.username) {
          // Suicide
          setMessage(`Du kan ikke drepe deg selv!`);
          setMessageType("warning");
        } else if (playerData.status === "dead") {
          // Player is already dead
          setMessage(`${playerData.username} er allerede død!`);
          setMessageType("warning");
        } else if (character?.location !== playerData.location) {
          // Player is not in same city
          setMessage(
            `Du kunne ikke finne ${playerData.username} i ${character?.location}!`
          );
          setMessageType("failure");
        } else {
          // Proceed with assassination
          setMessage(`${playerData.username} ble drept!`);
          setMessageType("success");

          // Update target player status to 'dead'
          await updateDoc(doc(db, "Characters", targetDocId), {
            status: "dead",
          });

          // update lastActive
          await updateDoc(doc(db, "Characters", character.id), {
            lastActive: serverTimestamp(),
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

  const handleTargetInput = (event: any) => {
    setTargetPlayer(event.target.value);
  };

  const handleWantedInput = (event: any) => {
    setWantedPlayer(event.target.value);
  };

  const handleBountyAmountInputChange = (e: any) => {
    const value = e.target.value;
    if (value === "") {
      setBountyAmount("");
    } else {
      const intValue = parseInt(value, 10);
      setBountyAmount(isNaN(intValue) ? "" : intValue);
    }
  };

  if (character?.inJail) {
    return <JailBox message={message} messageType={messageType} />;
  }

  return (
    <Main>
      <H1>Drep spiller</H1>
      <p className="mb-4">Her kan du forsøke å drepe en annen spiller.</p>
      {message && <InfoBox type={messageType}>{message}</InfoBox>}

      <div className="flex  flex-col gap-4">
        <Box>
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
                    type="number"
                    value={bountyAmount}
                    placeholder="Beløp"
                    onChange={handleBountyAmountInputChange}
                  />
                </div>
              </div>
              <div>
                <Button>Utlov dusør</Button>
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
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </Box>

        <Box>
          <H2>Hvem vil du drepe?</H2>
          <div className="flex flex-col gap-2 ">
            <input
              type="text"
              placeholder="Brukernavn"
              value={targetPlayer}
              onChange={handleTargetInput}
              className="bg-neutral-700 px-4 py-2 text-white placeholder-neutral-400"
            />
            <div>
              <Button onClick={killPlayer}>Angrip spiller</Button>
            </div>
          </div>
        </Box>
      </div>
    </Main>
  );
};

export default Assassinate;
