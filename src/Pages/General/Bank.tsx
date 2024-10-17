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

  const { character, setCharacter } = useCharacter();

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
        setMessage("Please enter amount.");
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
          setMessage("You don't have enough money to deposit.");
          return;
        }

        // Update values in Firestore
        await updateDoc(characterRef, {
          "stats.bank": newBank,
          "stats.money": newMoney,
        });

        setMessageType("success");
        setMessage(
          `You deposited $${amount.toLocaleString()} to your bank account.`
        );

        setCharacter((prevCharacter: any) => ({
          ...prevCharacter,
          stats: {
            ...prevCharacter.stats,
            bank: newBank,
            money: newMoney,
          },
        }));
        setAmount("");
      }
    } catch (error) {
      console.error("Error depositing funds:", error);
    }
  };

  const withdraw = async () => {
    try {
      const characterRef = doc(db, "Characters", character.id);

      if (amount === "") {
        setMessageType("warning");
        setMessage("Please enter amount.");
        return;
      }

      // Calculate new values
      if (amount) {
        const newBank = character.stats.bank
          ? character.stats.bank - amount
          : -amount;
        const newMoney = character.stats.money + amount;

        // Check if there is enough money to deposit
        if (newBank < 0) {
          setMessageType("warning");
          setMessage("You don't have enough money to withdraw.");
          return;
        }

        // Update values in Firestore
        await updateDoc(characterRef, {
          "stats.bank": newBank,
          "stats.money": newMoney,
        });

        setMessageType("success");
        setMessage(
          `You withdrew $${amount.toLocaleString()} from your bank account.`
        );

        setCharacter((prevCharacter: any) => ({
          ...prevCharacter,
          stats: {
            ...prevCharacter.stats,
            bank: newBank,
            money: newMoney,
          },
        }));
        setAmount("");
      }
    } catch (error) {
      console.error("Error widthdrawing funds:", error);
    }
  };

  const transfer = async () => {
    try {
      if (amountToSend === "" || targetCharacter === "") {
        setMessageType("warning");
        setMessage("Please enter a valid amount and username.");
        return;
      }

      const transferAmount = Number(amountToSend);

      if (transferAmount <= 0) {
        setMessageType("warning");
        setMessage("The amount must be greater than 0.");
        return;
      }

      // Apply 5% fee to the transfer amount
      const fee = transferAmount * 0.05;
      const totalAmount = transferAmount + fee;

      // Check if the sender has enough money
      if (character.stats.money < totalAmount) {
        setMessageType("warning");
        setMessage("You don't have enough money to transfer that amount.");
        return;
      }

      // Query to find the target character by username
      const charactersRef = collection(db, "Characters");
      const targetQuery = query(
        charactersRef,
        where("username", "==", targetCharacter)
      );
      const targetQuerySnapshot = await getDocs(targetQuery);

      // Check if the target character exists
      if (targetQuerySnapshot.empty) {
        setMessageType("warning");
        setMessage("The target character does not exist.");
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

      setCharacter((prevCharacter: any) => ({
        ...prevCharacter,
        stats: {
          ...prevCharacter.stats,
          money: newSenderMoney,
        },
      }));

      setMessageType("success");
      setMessage(
        `You successfully transferred $${transferAmount.toLocaleString()} to ${targetCharacter}. A $${fee.toLocaleString()} transaction fee was applied.`
      );

      // Reset the input fields
      setTargetCharacter("");
      setAmountToSend("");
    } catch (error) {
      console.error("Error transferring money:", error);
      setMessageType("warning");
      setMessage("An error occurred while transferring money.");
    }
  };

  return (
    <Main>
      <H1>Bank</H1>
      <p className="mb-2">
        Here you can deposit and withdraw money from your bank account. Money in
        the bank will not get lost if another player robs you.
      </p>
      <p className="mb-4">
        At midnight you will receive 5% interest on the money in your bank
        account.
      </p>

      {message && <InfoBox type={messageType}>{message}</InfoBox>}

      <div>
        <H2>Bank account</H2>
        <p className="mb-4">
          Balance:{" "}
          <span className="font-bold text-neutral-200">
            ${character?.stats.bank?.toLocaleString() || 0}
          </span>
        </p>
        <form className="flex flex-col gap-2" action="">
          <input
            className="bg-neutral-700 py-2 px-4 text-white placeholder-neutral-400"
            type="number"
            value={amount}
            placeholder="Enter amount"
            onChange={handleInputChange}
          />
          <div className="flex gap-2">
            {" "}
            <Button onClick={withdraw}>Withdraw</Button>
            <Button onClick={deposit}>Deposit</Button>
          </div>
        </form>
      </div>

      <div className="my-6">
        <H2>Send to player</H2>
        <p className="mb-4">
          The bank will take 5% of the transfered amount as transaction fee.
        </p>
        <form className="flex flex-col gap-2" action="">
          <input
            className="bg-neutral-700 py-2 px-4 text-white placeholder-neutral-400"
            type="text"
            placeholder="Enter username"
            value={targetCharacter}
            onChange={handleTargetCharacterInputChange}
          />
          <input
            className="bg-neutral-700 py-2 px-4 text-white placeholder-neutral-400"
            type="number"
            placeholder="Enter amount"
            value={amountToSend}
            onChange={handleAmountToSendInputChange}
          />
          <div>
            {" "}
            <Button onClick={transfer}>Transfer</Button>
          </div>
        </form>
      </div>
    </Main>
  );
};

export default Bank;
