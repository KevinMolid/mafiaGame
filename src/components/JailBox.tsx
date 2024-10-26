import Box from "./Box";
import H2 from "./Typography/H2";
import Button from "./Button";
import Username from "../components/Typography/Username";

// Firebase
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
const db = getFirestore();

// functions
import { sendMessage, Message } from "../Functions/messageService";
import { format } from "date-fns";
import { breakOut } from "../Functions/RewardFunctions";

// React
import { useState, useEffect } from "react";

// Context
import { useCharacter } from "../CharacterContext";
import InfoBox from "./InfoBox";

interface JailBoxInterface {
  message: string;
  messageType: "success" | "failure" | "important" | "warning" | "info";
}

const JailBox = ({ message, messageType }: JailBoxInterface) => {
  const { character } = useCharacter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState<string>("");
  const channelId = "EivoYnQQVwVQvnMctcXN";

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(
        collection(db, "Channels", channelId, "Messages"),
        orderBy("timestamp")
      ),
      (snapshot) => {
        const fetchedMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Message[];
        setMessages(fetchedMessages);
        setLoading(false);
      },
      (error) => {
        setError(error.message);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e: any) => {
    setNewMessage(e.target.value);
  };

  const submitNewMessage = async (e: any) => {
    e.preventDefault();
    if (!character) return;
    if (!newMessage.trim()) return;

    try {
      await sendMessage(
        channelId,
        newMessage,
        character.id,
        character.username
      );
      setNewMessage("");
      setError(null);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("En ukjent feil oppstod.");
      }
    }
  };

  return (
    <div className="my-4">
      <H2>Du er i fengsel!</H2>
      <p>Du kan ikke gjøre noen handlinger mens du sitter i fengsel.</p>
      <p className="mb-4">
        Tid som gjenstår:{" "}
        <strong className="text-neutral-200">120 sekunder</strong>
      </p>

      {message && <InfoBox type={messageType}>{message}</InfoBox>}

      {/* CHAT */}
      {loading && <p>Laster chat...</p>}
      {error && <p>Feil: {error}</p>}

      {!loading && !error && (
        <div className="mb-4">
          <Box>
            <H2>Fengselschatten</H2>
            {/* Messages */}
            <div
              id="messages_div"
              className="mb-4 pb-2 border-b border-neutral-600"
            >
              <ul>
                {messages.map((message) => (
                  <li key={message.id} className="mb-2">
                    {/* Sender and timestamp */}
                    <div className="flex gap-2 mb-1 text-stone-400 text-xs sm:text-sm">
                      <Username
                        character={{
                          id: message.senderId,
                          username: message.senderName,
                        }}
                      />
                      <p>
                        {message.timestamp
                          ? format(
                              message.timestamp.toDate(),
                              "dd.MM.yyyy - HH:mm"
                            )
                          : "Sending..."}
                      </p>
                    </div>
                    <div className="bg-slate-100 text-neutral-700 text-sm font-medium px-2 py-2 rounded-lg">
                      {message.text}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div id="new_message_div">
              <form
                action=""
                onSubmit={submitNewMessage}
                className="bg-neutral-800 grid grid-cols-[auto_min-content] rounded-lg pr-2"
              >
                <textarea
                  name=""
                  id=""
                  rows={5}
                  value={newMessage}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.preventDefault();
                  }}
                  onChange={handleInputChange}
                  className="w-full resize-none bg-inherit rounded-lg px-4 py-2"
                ></textarea>

                <button
                  type="submit"
                  id="send_icon"
                  className="w-8 flex justify-center items-center hover:text-white hover:cursor-pointer"
                >
                  <i className=" text-xl fa-solid fa-paper-plane"></i>
                </button>
              </form>
            </div>
          </Box>
        </div>
      )}

      {character && (
        <Button onClick={() => breakOut(character.id)}>Stikk av</Button>
      )}
    </div>
  );
};

export default JailBox;
