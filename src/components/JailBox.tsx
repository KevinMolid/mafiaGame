import Box from "./Box";
import H2 from "./Typography/H2";
import Button from "./Button";
import Main from "./Main";
import CharacterList from "./CharacterList";
import ChatMessage from "./ChatMessage";

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
import { breakOut } from "../Functions/RewardFunctions";

// React
import { useState, useEffect, useRef } from "react";

// Context
import { useCharacter } from "../CharacterContext";
import { useAuth } from "../AuthContext";
import { useCooldown } from "../CooldownContext";
import InfoBox from "./InfoBox";

interface JailBoxInterface {
  message: React.ReactNode;
  messageType: "success" | "failure" | "important" | "warning" | "info";
}

const JailBox = ({ message, messageType }: JailBoxInterface) => {
  const { userCharacter } = useCharacter();
  const { userData } = useAuth();
  const { jailRemainingSeconds } = useCooldown(); // ⬅️ centralized timer

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

  // Ref for the textarea
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Function to adjust the height of the textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "0px";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newMessage]);

  const handleInputChange = (e: any) => {
    setNewMessage(e.target.value);
    adjustTextareaHeight();
  };

  const submitNewMessage = async (e: any) => {
    e.preventDefault();
    if (!userCharacter) return;
    if (!newMessage.trim()) return;

    try {
      await sendMessage(
        channelId,
        newMessage,
        userCharacter.id,
        userCharacter.username
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
    <Main img="PrisonBg">
      <div className="my-4">
        <H2>Du er i fengsel!</H2>
        <p className="mb-4">
          Du kan ikke gjøre noen handlinger mens du sitter i fengsel.
        </p>
        <p className="mb-4">
          Tid som gjenstår:{" "}
          <strong className="text-neutral-200">
            {jailRemainingSeconds} sekunder
          </strong>
        </p>

        {message && <InfoBox type={messageType}>{message}</InfoBox>}

        {/* CHAT */}
        {loading && <p>Laster chat...</p>}
        {error && <p>Feil: {error}</p>}

        {!loading && !error && (
          <div className="mb-4 flex flex-col gap-4">
            <Box>
              <H2>Fengselschatten</H2>
              {/* Messages */}
              <div
                id="messages_div"
                className="mb-4 pb-2 border-b border-neutral-600"
              >
                <ul>
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      id={message.id}
                      senderId={message.senderId}
                      senderName={message.senderName}
                      timestamp={message.timestamp}
                      text={message.text}
                    />
                  ))}
                </ul>
              </div>

              <div id="new_message_div">
                <form
                  action=""
                  onSubmit={submitNewMessage}
                  className="grid grid-cols-[auto_min-content] gap-2 pr-2"
                >
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={newMessage}
                    placeholder="Melding"
                    spellCheck={false}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (e.shiftKey) return;
                        e.preventDefault();
                        submitNewMessage(e);
                      }
                    }}
                    onChange={handleInputChange}
                    className="w-full bg-neutral-800 outline-none resize-none rounded-3xl px-4 py-2 leading-normal"
                  ></textarea>

                  <Button type="submit" size="square">
                    <i className=" text-xl fa-solid fa-paper-plane"></i>
                  </Button>
                </form>
              </div>
            </Box>

            <Box>
              <H2>Spillere i fengsel</H2>
              <CharacterList type="jail" inJail />
            </Box>
          </div>
        )}

        {userCharacter && userData.type === "admin" && (
          <Button onClick={() => breakOut(userCharacter.id)}>Stikk av</Button>
        )}
      </div>
    </Main>
  );
};

export default JailBox;
