// Components
import H2 from "../components/Typography/H2";
import CharacterList from "../components/CharacterList";

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

// React
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// Context
import { useCharacter } from "../CharacterContext";

const Chat = () => {
  const { character } = useCharacter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState<string>("");
  const [receiver, setReceiver] = useState<string>("Global");
  const [channelId, setChannelId] = useState<string>("KZfZCQfE8nCKV5cjeMtj");

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
  }, [channelId]);

  if (loading) {
    return <p>Loading messages...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

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
        setError("An unknown error occurred.");
      }
    }
  };

  const selectReceiver = (channelName: string, id: string) => {
    setReceiver(channelName);
    setChannelId(id);
  };

  return (
    <section className="flex-grow">
      <div className="grid grid-cols-[1fr_4fr] h-full">
        {/* Left panel */}
        <div className="h-full px-4 py-8 border-r border-neutral-700">
          <H2>Channels</H2>
          <p className="text-lg text-white">Players</p>
          <CharacterList
            include=""
            action="log"
            onClick={() => console.log("hehe")}
          />

          <ul>
            <li>
              <p className="text-lg text-white">Groups</p>
            </li>
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
        <div
          id="right_panel"
          className="grid grid-rows-[min-content_auto_min-content] px-4 pt-8 pb-24"
        >
          {/* Channel header */}
          <div
            id="right_panel_heading"
            className="border-b border-neutral-600 mb-2"
          >
            <H2>{receiver} Chat</H2>
          </div>

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
                    <Link to="#">
                      <strong>{message.senderName}</strong>
                    </Link>
                    <p>
                      {message.timestamp
                        ? format(
                            message.timestamp.toDate(),
                            "dd.MM.yyyy - HH:mm"
                          )
                        : "Sending..."}
                    </p>
                  </div>
                  <div className="bg-slate-100 text-neutral-700 font-medium px-2 py-2 rounded-lg">
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
        </div>
      </div>
    </section>
  );
};

export default Chat;
