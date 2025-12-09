// Components
import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import H2 from "../../components/Typography/H2";
import H4 from "../../components/Typography/H4";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";
import JailBox from "../../components/JailBox";
import Box from "../../components/Box";

// React
import { useState } from "react";

// Context
import { useCharacter } from "../../CharacterContext";

// Firebase
import {
  getFirestore,
  doc,
  updateDoc,
  getDocs,
  collection,
  query,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../../firebaseConfig";
import Username from "../../components/Typography/Username";
import { useCooldown } from "../../CooldownContext";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const Bank = () => {
  const [amount, setAmount] = useState<number | "">("");
  const [message, setMessage] = useState<React.ReactNode>("");
  const [messageType, setMessageType] = useState<
    "success" | "warning" | "info"
  >("info");

  const [targetCharacter, setTargetCharacter] = useState<string>("");
  const [amountToSend, setAmountToSend] = useState<number | "">("");

  const { userCharacter } = useCharacter();
  const { jailRemainingSeconds } = useCooldown();

  const [helpActive, setHelpActive] = useState<boolean>(false);

  if (!userCharacter) {
    return null;
  }

  // --- NEW: parse input like "5k" -> 5000, "1m" -> 1_000_000 -----------------
  const parseAmount = (input: string): number | "" => {
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

    // Remove anything that isn't a digit (spaces, commas, dots, etc.)
    const digits = numericPart.replace(/[^\d]/g, "");
    if (!digits) return "";

    const base = parseInt(digits, 10);
    if (Number.isNaN(base)) return "";

    return base * multiplier;
  };

  // 2) handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseAmount(e.target.value);
    if (value === "") setAmount("");
    else setAmount(value);
  };

  const handleTargetCharacterInputChange = (e: any) => {
    setTargetCharacter(e.target.value);
  };

  const handleAmountToSendInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseAmount(e.target.value);
    if (value === "") setAmountToSend("");
    else setAmountToSend(value);
  };

  // Banking functions (unchanged)
  const deposit = async () => {
    try {
      const characterRef = doc(db, "Characters", userCharacter.id);

      if (amount === "") {
        setMessageType("warning");
        setMessage("Du må skrive en verdi.");
        return;
      }

      // Calculate new values
      if (amount) {
        const newBank = userCharacter.stats.bank
          ? userCharacter.stats.bank + amount
          : amount;
        const newMoney = userCharacter.stats.money - amount;

        // Check if there is enough money to deposit
        if (newMoney < 0) {
          setMessageType("warning");
          setMessage("Du har ikke så mye penger.");
          return;
        }

        // Update values in Firestore
        await updateDoc(characterRef, {
          "stats.bank": newBank,
          "stats.money": newMoney,
        });

        setMessageType("success");
        setMessage(
          <p>
            Du satte inn <i className="fa-solid fa-dollar-sign"></i>{" "}
            <strong>{amount.toLocaleString("nb-NO")}</strong> på din bankkonto.
          </p>
        );

        setAmount("");
      }
    } catch (error) {
      console.error("Feil ved innskudd av penger:", error);
    }
  };

  const depositAll = async () => {
    try {
      const characterRef = doc(db, "Characters", userCharacter.id);

      // Calculate new values
      const newBank = userCharacter.stats.bank + userCharacter.stats.money;
      const newMoney = 0;

      // Check if there is enough money to deposit
      if (userCharacter.stats.money <= 0) {
        setMessageType("warning");
        setMessage("Du har ingen penger å sette inn.");
        return;
      }

      // Update values in Firestore
      await updateDoc(characterRef, {
        "stats.bank": newBank,
        "stats.money": newMoney,
      });

      setMessageType("success");
      setMessage(
        <p>
          Du satte inn <i className="fa-solid fa-dollar-sign"></i>{" "}
          <strong>{userCharacter.stats.money.toLocaleString("nb-NO")}</strong>{" "}
          på din bankkonto.
        </p>
      );

      setAmount("");
    } catch (error) {
      console.error("Feil ved innskudd av penger:", error);
    }
  };

  const withdraw = async () => {
    try {
      const characterRef = doc(db, "Characters", userCharacter.id);

      if (amount === "") {
        setMessageType("warning");
        setMessage("Du må skrive en verdi.");
        return;
      }

      // Calculate new values
      if (amount) {
        const newBank = userCharacter.stats.bank
          ? userCharacter.stats.bank - amount
          : -amount;
        const newMoney = userCharacter.stats.money + amount;

        // Check if there is enough money to withdraw
        if (newBank < 0) {
          setMessageType("warning");
          setMessage("Du har ikke nok penger å ta ut.");
          return;
        }

        // Update values in Firestore
        await updateDoc(characterRef, {
          "stats.bank": newBank,
          "stats.money": newMoney,
        });

        setMessageType("success");
        setMessage(
          <p>
            Du tok ut <i className="fa-solid fa-dollar-sign"></i>{" "}
            <strong>{amount.toLocaleString("nb-NO")}</strong> fra din bankkonto.
          </p>
        );

        setAmount("");
      }
    } catch (error) {
      console.error("Feil ved uttak av penger:", error);
    }
  };

  const withdrawAll = async () => {
    try {
      const characterRef = doc(db, "Characters", userCharacter.id);

      // Calculate new values
      const newBank = 0;
      const newMoney = userCharacter.stats.money + userCharacter.stats.bank;

      // Update values in Firestore
      await updateDoc(characterRef, {
        "stats.bank": newBank,
        "stats.money": newMoney,
      });

      // Check if there is enough money to withdraw
      if (userCharacter.stats.bank <= 0) {
        setMessageType("warning");
        setMessage("Du har ingen penger i banken.");
        return;
      }

      setMessageType("success");
      setMessage(
        <p>
          Du tok ut <i className="fa-solid fa-dollar-sign"></i>{" "}
          <strong>{userCharacter.stats.bank.toLocaleString("nb-NO")}</strong>{" "}
          fra din bankkonto.
        </p>
      );

      setAmount("");
    } catch (error) {
      console.error("Feil ved uttak av penger:", error);
    }
  };

  const transfer = async () => {
    try {
      if (amountToSend === "" || targetCharacter === "") {
        setMessageType("warning");
        setMessage("Du må skrive inn brukernavn og verdi.");
        return;
      }

      const transferAmount = Number(amountToSend);

      if (transferAmount <= 0) {
        setMessageType("warning");
        setMessage("Verdien må være større enn 0.");
        return;
      }

      // Apply 5% fee to the transfer amount (rounded up to nearest whole number)
      const fee = Math.ceil(transferAmount * 0.05);
      const totalAmount = transferAmount + fee;

      // Check if the sender has enough money
      if (userCharacter.stats.money < totalAmount) {
        setMessageType("warning");
        setMessage("Du har ikke nok penger til å gjennomføre transaksjonen.");
        return;
      }

      // Query to find the target character by username
      const charactersRef = collection(db, "Characters");
      const targetQuery = query(
        charactersRef,
        where("username_lowercase", "==", targetCharacter.toLowerCase())
      );
      const targetQuerySnapshot = await getDocs(targetQuery);

      // Check if the target character exists
      if (targetQuerySnapshot.empty) {
        setMessageType("warning");
        setMessage("Spilleren finnes ikke.");
        return;
      }

      const targetCharacterDoc = targetQuerySnapshot.docs[0];
      const targetId = targetCharacterDoc.id;
      const targetData = targetCharacterDoc.data();

      // Calculate the new balances
      const newSenderMoney = userCharacter.stats.money - totalAmount;
      const newReceiverMoney = targetData.stats.money + transferAmount;

      // Update both the sender's and receiver's money in Firestore
      const senderRef = doc(db, "Characters", userCharacter.id);
      await updateDoc(senderRef, {
        "stats.money": newSenderMoney,
      });

      await updateDoc(targetCharacterDoc.ref, {
        "stats.money": newReceiverMoney,
      });

      // Add an alert to the target player's alerts sub-collection
      const alertRef = collection(
        db,
        "Characters",
        targetCharacterDoc.id,
        "alerts"
      );
      await addDoc(alertRef, {
        type: "banktransfer",
        timestamp: serverTimestamp(),
        amountSent: transferAmount,
        senderName: userCharacter.username,
        senderId: userCharacter.id,
        read: false,
      });

      setMessageType("success");
      setMessage(
        <p>
          Du overførte <i className="fa-solid fa-dollar-sign"></i>{" "}
          <strong>{transferAmount.toLocaleString("nb-NO")}</strong> til{" "}
          <Username
            useParentColor
            character={{ id: targetId, username: targetData.username }}
          />
          . En avgift på <i className="fa-solid fa-dollar-sign"></i>{" "}
          <strong>{fee.toLocaleString("nb-NO")}</strong> ble betalt til banken.
        </p>
      );

      // Reset the input fields
      setTargetCharacter("");
      setAmountToSend("");
    } catch (error) {
      console.error("Error transferring money:", error);
      setMessageType("warning");
      setMessage("En feil skjedde ved overføring av penger.");
    }
  };

  if (userCharacter?.inJail && jailRemainingSeconds > 0) {
    return <JailBox message={message} messageType={messageType} />;
  }

  return (
    <Main>
      <div className="flex items-baseline justify-between gap-4">
        <H1>Bank</H1>
        {helpActive ? (
          <Button
            size="small-square"
            style="helpActive"
            onClick={() => setHelpActive(!helpActive)}
          >
            <i className="fa-solid fa-question"></i>
          </Button>
        ) : (
          <Button
            size="small-square"
            style="help"
            onClick={() => setHelpActive(!helpActive)}
          >
            <i className="fa-solid fa-question"></i>
          </Button>
        )}
      </div>
      <p className="mb-2">
        Her kan du sette inn eller ta penger ut av banken og overføre penger til
        andre spillere.
      </p>

      {/* Info box */}
      {helpActive && (
        <div className="mb-4">
          <Box type="help" className="text-sm flex gap-x-8 flex-wrap">
            <article>
              <H4>Renter</H4>
              <p className="mb-2">
                Dersom du har penger i banken vil du ved midnatt motta 1% av
                saldoen i renter.
              </p>

              <H4>Overføringsgebyr</H4>
              <p className="mb-2">
                Ved overføring av penger til en annen spiller vil banken ta 5%
                av overføringen som gebyr. Dette beløpet blir lagt til oppå
                overføringsbeløpet, slik at mottakeren mottar det angitte
                beløpet.
              </p>

              <H4>Hurtigtaster</H4>
              <p className="mb-4">
                Du kan taste "K" for å legge til tre nuller (000) eller "M" for
                å legge til seks nuller (000 000).
              </p>
            </article>
          </Box>
        </div>
      )}

      {message && (
        <InfoBox type={messageType} onClose={() => setMessage("")}>
          {message}
        </InfoBox>
      )}

      <div>
        <H2>Konto</H2>
        <p className="mb-4">
          Saldo:{" "}
          <span className="font-bold text-neutral-200">
            <i className="fa-solid fa-dollar-sign"></i>{" "}
            {userCharacter?.stats.bank?.toLocaleString("nb-NO") || 0}
          </span>
        </p>
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            className="bg-transparent border-b border-neutral-600 py-1 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
            type="text"
            inputMode="numeric"
            placeholder="Beløp"
            value={amount !== "" ? amount.toLocaleString("nb-NO") : ""}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") deposit();
            }}
          />
          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-2">
              <Button type="button" style="secondary" onClick={withdraw}>
                Ta ut
              </Button>
              <Button type="button" style="secondary" onClick={deposit}>
                Sett inn
              </Button>
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={withdrawAll}>
                Ta ut alt
              </Button>
              <Button type="button" onClick={depositAll}>
                Sett inn alt
              </Button>
            </div>
          </div>
        </form>
      </div>

      <div className="my-6">
        <H2>Overfør til spiller</H2>
        <form className="flex flex-col gap-2" action="">
          <input
            className="bg-transparent border-b border-neutral-600 py-1 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
            type="text"
            placeholder="Brukernavn"
            spellCheck={false}
            value={targetCharacter}
            onChange={handleTargetCharacterInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") transfer();
            }}
          />
          <input
            className="bg-transparent border-b border-neutral-600 py-1 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
            type="text"
            placeholder="Beløp"
            value={amountToSend ? amountToSend.toLocaleString("nb-NO") : ""}
            onChange={handleAmountToSendInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") transfer();
            }}
          />
          <div>
            <Button onClick={transfer}>Overfør</Button>
          </div>
        </form>
      </div>
    </Main>
  );
};

export default Bank;
