// Components
import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import H2 from "../../components/Typography/H2";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";

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
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../../firebaseConfig";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const Bank = () => {
  const [amount, setAmount] = useState<number | "">("");
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<
    "success" | "warning" | "info"
  >("info");

  const [targetCharacter, setTargetCharacter] = useState<string>("");
  const [amountToSend, setAmountToSend] = useState<number | "">("");

  const { character } = useCharacter();

  if (!character) {
    return null;
  }

  // Handle inputs
  const handleInputChange = (e: any) => {
    const value = e.target.value;
    if (value === "") {
      setAmount("");
    } else {
      const intValue = parseInt(value, 10);
      setAmount(isNaN(intValue) ? "" : intValue);
    }
  };

  const handleTargetCharacterInputChange = (e: any) => {
    setTargetCharacter(e.target.value);
  };

  const handleAmountToSendInputChange = (e: any) => {
    const value = e.target.value;
    if (value === "") {
      setAmountToSend("");
    } else {
      const intValue = parseInt(value, 10);
      setAmountToSend(isNaN(intValue) ? "" : intValue);
    }
  };

  // Banking functions
  const deposit = async () => {
    try {
      const characterRef = doc(db, "Characters", character.id);

      if (amount === "") {
        setMessageType("warning");
        setMessage("Du må skrive en verdi.");
        return;
      }

      // Calculate new values
      if (amount) {
        const newBank = character.stats.bank
          ? character.stats.bank + amount
          : amount;
        const newMoney = character.stats.money - amount;

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
          `Du satte inn $${amount.toLocaleString()} på din bankkonto.`
        );

        setAmount("");
      }
    } catch (error) {
      console.error("Feil ved innskudd av penger:", error);
    }
  };

  const depositAll = async () => {
    try {
      const characterRef = doc(db, "Characters", character.id);

      // Calculate new values
      const newBank = character.stats.bank + character.stats.money;
      const newMoney = 0;

      // Check if there is enough money to deposit
      if (character.stats.money <= 0) {
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
        `Du satte inn $${character.stats.money.toLocaleString()} på din bankkonto.`
      );

      setAmount("");
    } catch (error) {
      console.error("Feil ved innskudd av penger:", error);
    }
  };

  const withdraw = async () => {
    try {
      const characterRef = doc(db, "Characters", character.id);

      if (amount === "") {
        setMessageType("warning");
        setMessage("Du må skrive en verdi.");
        return;
      }

      // Calculate new values
      if (amount) {
        const newBank = character.stats.bank
          ? character.stats.bank - amount
          : -amount;
        const newMoney = character.stats.money + amount;

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
        setMessage(`Du tok ut $${amount.toLocaleString()} fra din bankkonto.`);

        setAmount("");
      }
    } catch (error) {
      console.error("Feil ved uttak av penger:", error);
    }
  };

  const withdrawAll = async () => {
    try {
      const characterRef = doc(db, "Characters", character.id);

      // Calculate new values
      const newBank = 0;
      const newMoney = character.stats.money + character.stats.bank;

      // Update values in Firestore
      await updateDoc(characterRef, {
        "stats.bank": newBank,
        "stats.money": newMoney,
      });

      // Check if there is enough money to withdraw
      if (character.stats.bank <= 0) {
        setMessageType("warning");
        setMessage("Du har ingen penger i banken.");
        return;
      }

      setMessageType("success");
      setMessage(
        `Du tok ut $${character.stats.bank.toLocaleString()} fra din bankkonto.`
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

      // Apply 5% fee to the transfer amount
      const fee = transferAmount * 0.05;
      const totalAmount = transferAmount + fee;

      // Check if the sender has enough money
      if (character.stats.money < totalAmount) {
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
      const targetData = targetCharacterDoc.data();

      // Calculate the new balances
      const newSenderMoney = character.stats.money - totalAmount;
      const newReceiverMoney = targetData.stats.money + transferAmount;

      // Update both the sender's and receiver's money in Firestore
      const senderRef = doc(db, "Characters", character.id);
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
        timestamp: new Date().toISOString(),
        amountSent: transferAmount,
        senderName: character.username,
        senderId: character.id,
        read: false,
      });

      setMessageType("success");
      setMessage(
        `Du overførte $${transferAmount.toLocaleString()} til ${
          targetData.username
        }. En avgift på $${fee.toLocaleString()} ble betalt til banken.`
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

  return (
    <Main>
      <H1>Bank</H1>
      <p className="mb-2">Sett inn eller ta penger ut av banken.</p>
      <p className="mb-4">
        Ved midnatt vil du motta 5% rente på pengene i din bankkonto.
      </p>

      {message && <InfoBox type={messageType}>{message}</InfoBox>}

      <div>
        <H2>Konto</H2>
        <p className="mb-4">
          Saldo:{" "}
          <span className="font-bold text-neutral-200">
            ${character?.stats.bank?.toLocaleString() || 0}
          </span>
        </p>
        <form className="flex flex-col gap-2" action="">
          <input
            className="bg-neutral-700 py-2 px-4 text-white placeholder-neutral-400"
            type="number"
            value={amount}
            placeholder="Skriv inn beløp"
            onChange={handleInputChange}
          />
          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-2">
              <Button style="secondary" onClick={withdraw}>
                Ta ut
              </Button>
              <Button style="secondary" onClick={deposit}>
                Sett inn
              </Button>
            </div>

            <div className="flex gap-2">
              <Button onClick={withdrawAll}>Ta ut alt</Button>
              <Button onClick={depositAll}>Sett inn alt</Button>
            </div>
          </div>
        </form>
      </div>

      <div className="my-6">
        <H2>Overfør til spiller</H2>
        <p className="mb-4">
          En transaksjonskostnad på 5% vil bli lagt til og betalt til banken.
        </p>
        <form className="flex flex-col gap-2" action="">
          <input
            className="bg-neutral-700 py-2 px-4 text-white placeholder-neutral-400"
            type="text"
            placeholder="Skriv inn brukernavn"
            value={targetCharacter}
            onChange={handleTargetCharacterInputChange}
          />
          <input
            className="bg-neutral-700 py-2 px-4 text-white placeholder-neutral-400"
            type="number"
            placeholder="Skriv inn beløp"
            value={amountToSend}
            onChange={handleAmountToSendInputChange}
          />
          <div>
            {" "}
            <Button onClick={transfer}>Overfør</Button>
          </div>
        </form>
      </div>
    </Main>
  );
};

export default Bank;
