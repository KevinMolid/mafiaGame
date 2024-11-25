import Box from "./Box";
import H2 from "./Typography/H2";
import Button from "./Button";
import Main from "./Main";

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
import InfoBox from "./InfoBox";

interface JailBoxInterface {
  message: string;
  messageType: "success" | "failure" | "important" | "warning" | "info";
}

const JailBox = ({ message, messageType }: JailBoxInterface) => {
  const { userCharacter } = useCharacter();
  const { userData } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState<string>("");
  const [remainingTime, setRemainingTime] = useState<number>(0);
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

  useEffect(() => {
    if (!userCharacter?.jailReleaseTime) return;

    const calculateRemainingTime = () => {
      const currentTime = new Date().getTime();
      const releaseTime = userCharacter.jailReleaseTime;
      const timeRemaining = Math.max(
        0,
        Math.floor((releaseTime - currentTime) / 1000)
      );
      setRemainingTime(timeRemaining);

      // Automatically call breakOut when the timer reaches 0
      if (timeRemaining === 0) {
        breakOut(userCharacter.id);
      }
    };

    calculateRemainingTime(); // Calculate initially

    const interval = setInterval(() => {
      calculateRemainingTime();
    }, 1000); // Update every second

    return () => clearInterval(interval); // Clean up on unmount
  }, [userCharacter?.jailReleaseTime]);

  // Ref for the textarea
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Function to adjust the height of the textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

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
        <p>Du kan ikke gjøre noen handlinger mens du sitter i fengsel.</p>
        <p className="mb-4">
          Tid som gjenstår:{" "}
          <strong className="text-neutral-200">{remainingTime} sekunder</strong>
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
                    <ChatMessage
                      key={message.id}
                      id={message.id}
                      senderId={message.senderId}
                      senderName={message.senderName}
                      timestamp={message.timestamp}
                      messageText={message.text}
                    />
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
                    ref={textareaRef}
                    name=""
                    id=""
                    value={newMessage}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (e.shiftKey) {
                          // Allow line break when Shift + Enter is pressed
                          return;
                        } else {
                          // Prevent default behavior and submit the message when Enter is pressed alone
                          e.preventDefault();
                          submitNewMessage(e);
                        }
                      }
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

        {userCharacter && userData.type === "admin" && (
          <Button onClick={() => breakOut(userCharacter.id)}>Stikk av</Button>
        )}
      </div>
    </Main>
  );
};

export default JailBox;
