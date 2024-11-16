// Components
import H2 from "../components/Typography/H2";
import Username from "../components/Typography/Username";
import Button from "../components/Button";

// Firebase
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  getDoc,
} from "firebase/firestore";
const db = getFirestore();

// functions
import { sendMessage, Message } from "../Functions/messageService";
import { format } from "date-fns";

// React
import { useState, useEffect, useRef } from "react";
import { Fragment } from "react";

// Context
import { useCharacter } from "../CharacterContext";

const Chat = () => {
  const { character } = useCharacter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState<string>("");
  const [receiver, setReceiver] = useState<string>("Global");
  const [channelId, setChannelId] = useState<string>("KZfZCQfE8nCKV5cjeMtj");
  const [isCreatingChat, setIsCreatingChat] = useState<boolean>(false);
  const [newChatUsername, setNewChatUsername] = useState<string>("");

  // Ref for the textarea
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Function to adjust the height of the textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Reset height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set to the new height
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    adjustTextareaHeight(); // Call the function to adjust height
  };

  useEffect(() => {
    adjustTextareaHeight(); // Ensure height is adjusted when the component mounts
  }, [newMessage]);

  useEffect(() => {
    if (character && character.conversations) {
      // Fetch conversation details from character's conversations array
      const fetchConversations = async () => {
        try {
          const fetchedConversations = [];
          for (const convId of character.conversations) {
            const docSnap = await getDoc(doc(db, "Conversations", convId));
            if (docSnap.exists()) {
              fetchedConversations.push({ id: convId, ...docSnap.data() });
            }
          }
          setConversations(fetchedConversations);
        } catch (error) {
          setError("Feil ved lasting av samtaler.");
        }
        setLoading(false);
      };
      fetchConversations();
    }
  }, [character]);

  useEffect(() => {
    // Fetch messages for the selected channel
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
  }, [channelId]);

  if (loading) {
    return <p>Loading messages...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

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
        setError("An unknown error occurred.");
      }
    }
  };

  const handleNewChatClick = () => {
    setIsCreatingChat(true);
  };

  const handleNewChatInputChange = (e: any) => {
    setNewChatUsername(e.target.value);
  };

  const selectReceiver = (name: string, id: string) => {
    setReceiver(name);
    setChannelId(id);
    setIsCreatingChat(false);
  };

  return (
    <section className="flex-grow">
      <div className="grid grid-cols-[1fr_4fr] h-full">
        {/* Left panel */}
        <div className="h-full px-4 py-8 border-r border-neutral-700">
          <Button style="secondary" onClick={handleNewChatClick}>
            Ny chat
          </Button>
          <ul>
            {conversations.map((conv) => (
              <li key={conv.id}>
                <button
                  className={`hover:text-white w-full text-left ${
                    receiver === conv.name
                      ? "bg-neutral-700/50 text-neutral-300 border-l-4 border-sky-500 pl-2"
                      : ""
                  }`}
                  onClick={() => selectReceiver(conv.name, conv.id)}
                >
                  {conv.name || `Conversation ${conv.id}`}
                </button>
              </li>
            ))}
          </ul>

          <br />

          <ul className="mb-4">
            <li>
              <button
                className={`hover:text-white w-full text-left ${
                  receiver === "Global"
                    ? "bg-neutral-700/50 text-neutral-300 border-l-4 border-sky-500 pl-2"
                    : ""
                }`}
                onClick={() => selectReceiver("Global", "KZfZCQfE8nCKV5cjeMtj")}
              >
                Global
              </button>
            </li>
            <li>
              <button
                className={`hover:text-white w-full text-left ${
                  receiver === "Prison"
                    ? "bg-neutral-700/50 text-neutral-300 border-l-4 border-sky-500 pl-2"
                    : ""
                }`}
                onClick={() => selectReceiver("Prison", "EivoYnQQVwVQvnMctcXN")}
              >
                Prison
              </button>
            </li>
          </ul>
        </div>

        {/* Message panel */}
        <div id="right_panel" className="flex flex-col px-4 pt-8 pb-24">
          {/* Channel header */}
          <div
            id="right_panel_heading"
            className="border-b border-neutral-600 mb-2"
          >
            {isCreatingChat ? (
              <input
                type="text"
                placeholder="Brukernavn"
                value={newChatUsername}
                onChange={handleNewChatInputChange}
                className="w-[250px] bg-transparent text-xl sm:text-2xl md:text-3xl mb-1 sm:mb-2 md:mb-4 text-white"
              />
            ) : (
              <H2>{receiver} Chat</H2>
            )}
          </div>

          {/* Messages */}
          <div id="messages_div" className="mb-4 pb-2">
            {isCreatingChat ? (
              <></>
            ) : (
              <ul>
                {messages.map((message) => (
                  <li key={message.id} className="mb-2">
                    {/* Sender and timestamp */}
                    <div className="flex gap-2 text-stone-400 text-xs sm:text-sm">
                      <Username
                        character={{
                          id: message.senderId,
                          username: message.senderName,
                        }}
                      />
                      <p>
                        <small>
                          {message.timestamp
                            ? format(
                                message.timestamp.toDate(),
                                "dd.MM.yyyy - HH:mm"
                              )
                            : "Sending..."}
                        </small>
                      </p>
                    </div>
                    <div className="text-neutral-200 mb-2">
                      {message.text.split("\n").map((line, index) => (
                        <Fragment key={index}>
                          {line}
                          <br />
                        </Fragment>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
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
        </div>
      </div>
    </section>
  );
};

export default Chat;
