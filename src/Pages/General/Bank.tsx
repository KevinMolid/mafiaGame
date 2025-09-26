// Components
import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import H2 from "../../components/Typography/H2";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";
import JailBox from "../../components/JailBox";

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

  const { userCharacter } = useCharacter();

  if (!userCharacter) {
    return null;
  }

  const sanitizeInt = (s: string) => {
    // remove anything that isn't 0–9 (covers spaces, NBSP, commas, dots, etc.)
    const cleaned = s.replace(/[^\d]/g, "");
    return cleaned;
  };

 // 2) handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = sanitizeInt(e.target.value);
    if (cleaned === "") setAmount("");
    else setAmount(parseInt(cleaned, 10));
  };

  const handleTargetCharacterInputChange = (e: any) => {
    setTargetCharacter(e.target.value);
  };

  const handleAmountToSendInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = sanitizeInt(e.target.value);
    if (cleaned === "") setAmountToSend("");
    else setAmountToSend(parseInt(cleaned, 10));
  };

  // Banking functions
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
        `Du satte inn $${userCharacter.stats.money.toLocaleString()} på din bankkonto.`
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
        setMessage(`Du tok ut $${amount.toLocaleString()} fra din bankkonto.`);

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
        `Du tok ut $${userCharacter.stats.bank.toLocaleString()} fra din bankkonto.`
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

  if (userCharacter?.inJail) {
    return <JailBox message={message} messageType={messageType} />;
  }

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
            ${userCharacter?.stats.bank?.toLocaleString() || 0}
          </span>
        </p>
        <form className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
          <input
            className="bg-transparent border-b border-neutral-600 py-1 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
            type="text"
            inputMode="numeric"
            placeholder="Beløp"
            value={amount !== "" ? amount.toLocaleString("nb-NO") : ""}
            onChange={handleInputChange}
          />
          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-2">
              <Button type="button" style="secondary" onClick={withdraw}>Ta ut</Button>
              <Button type="button" style="secondary" onClick={deposit}>Sett inn</Button>
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={withdrawAll}>Ta ut alt</Button>
              <Button type="button" onClick={depositAll}>Sett inn alt</Button>
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
            className="bg-transparent border-b border-neutral-600 py-1 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
            type="text"
            placeholder="Brukernavn"
            value={targetCharacter}
            onChange={handleTargetCharacterInputChange}
          />
          <input
            className="bg-transparent border-b border-neutral-600 py-1 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
            type="text"
            placeholder="Beløp"
            value={amountToSend ? Number(amountToSend).toLocaleString() : ""}
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
