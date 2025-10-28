import Box from "./Box";
import H2 from "./Typography/H2";
import Button from "./Button";
import Main from "./Main";
import CharacterList from "./CharacterList";
import ChatMessage from "./ChatMessage";
import ScrollArea from "./ScrollArea";

// Functions
import { compactMmSs } from "../Functions/TimeFunctions";

import { releaseIfExpired } from "../Functions/JailFunctions";

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

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const channelId = "EivoYnQQVwVQvnMctcXN";

  useEffect(() => {
    if (!userCharacter?.id) return;
    // Self-heal stuck state on mount
    releaseIfExpired(userCharacter.id);

    // And when the countdown finishes
    if (jailRemainingSeconds <= 0) {
      releaseIfExpired(userCharacter.id);
    }
  }, [userCharacter?.id, jailRemainingSeconds]);

  // Get messages
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

  useEffect(() => {
    if (!loading) {
      // instant on first load; smooth after sending
      bottomRef.current?.scrollIntoView({ behavior: "instant", block: "end" });
    }
  }, [loading, messages]);

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
        <div className="flex justify-between mb-2">
          <H2>Du er i fengsel!</H2>
          <div className="grid grid-cols-[auto_auto] gap-2">
            <div className="flex justify-center items-center text-neutral-500 text-xl">
              <i className="fa-solid fa-clock mt-1"></i>
            </div>

            <div className="flex justify-center items-center">
              <p className="text-4xl">
                <strong className="text-neutral-200">
                  {compactMmSs(jailRemainingSeconds)}
                </strong>
              </p>
            </div>
          </div>
        </div>

        {message && <InfoBox type={messageType}>{message}</InfoBox>}

        {/* CHAT */}
        {error && <p>Feil: {error}</p>}

        <div
          id="main-content"
          className="flex flex-wrap sm:grid sm:grid-cols-[3fr_2fr] gap-4"
        >
          <div id="chat-box" className="flex-grow bg-neutral-900">
            <Box>
              {/* Messages */}
              <div className="mb-4 flex h-[300px] flex-col">
                {" "}
                {/* <- choose any height */}
                {/* MESSAGES AREA */}
                <div className="flex-grow min-h-0">
                  {" "}
                  {/* <- critical for scrolling */}
                  {loading ? (
                    <div className="min-h-60">
                      <p>Laster Fengsel...</p>
                    </div>
                  ) : !error ? (
                    <ScrollArea className="h-full flex-grow">
                      {" "}
                      <ul className="pr-4">
                        {messages.map((m) => (
                          <ChatMessage
                            key={m.id}
                            id={m.id}
                            senderId={m.senderId}
                            senderName={m.senderName}
                            timestamp={m.timestamp}
                            text={m.text}
                          />
                        ))}
                      </ul>
                      <div ref={bottomRef} />
                    </ScrollArea>
                  ) : null}
                </div>
              </div>

              <div id="new_message_div" className="">
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
                    className="bg-neutral-800 outline-none resize-none rounded-3xl px-4 py-2 leading-normal"
                  />

                  <Button type="submit" size="square">
                    <i className=" text-xl fa-solid fa-paper-plane"></i>
                  </Button>
                </form>
              </div>
            </Box>
          </div>

          <div className="flex-grow flex flex-col gap-4">
            <Box className="w-full">
              <H2>Spillere i fengsel</H2>
              <CharacterList type="jail" inJail />
            </Box>
            {userCharacter && userData.type === "admin" && (
              <div>
                <Button onClick={() => breakOut(userCharacter.id)}>
                  Stikk av
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Main>
  );
};

export default JailBox;
