// Components
import H2 from "../components/Typography/H2";
import Button from "../components/Button";

import { Message } from "../Functions/messageService";

import { useState, useEffect, useRef } from "react";

import {
  getFirestore,
  collection,
  onSnapshot,
  orderBy,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

// Context
import { useCharacter } from "../CharacterContext";
import ChatMessage from "../components/ChatMessage";

const db = getFirestore();

const Chat = () => {
  const { character } = useCharacter();
  const [players, setPlayers] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [isCreatingChat, setIsCreatingChat] = useState<boolean>(false);
  const [receiver, setReceiver] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  if (!character) return;

  // Ref for the textarea
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Function to adjust the height of the textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    adjustTextareaHeight();
  };

  // Fetching conversations where the user is a participant
  useEffect(() => {
    const fetchUserConversations = async () => {
      try {
        const conversationsSnapshot = await getDocs(
          query(
            collection(db, "Conversations"),
            where("participants", "array-contains", character.username)
          )
        );

        const conversationsList = conversationsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setConversations(conversationsList);
      } catch (error) {
        console.error("Error fetching conversations:", error);
        setError("Feil ved lasting av samtaler.");
      }
    };

    fetchUserConversations();
  }, [character.username]);

  // Creating list of players
  useEffect(() => {
    const fetchAllPlayers = async () => {
      try {
        const playersSnapshot = await getDocs(collection(db, "Characters"));
        const players = playersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPlayers(players);
      } catch (error) {
        console.error("Error fetching players:", error);
        setError("Feil ved lasting av spillere.");
      }
    };

    if (isCreatingChat) {
      fetchAllPlayers();
    }
  }, [isCreatingChat]);

  const handleNewChatClick = () => {
    setIsCreatingChat(true);
  };

  const handlePlayerClick = async (username: string) => {
    try {
      // Set receiver's username for display
      setReceiver(username);

      // Query the Conversations collection for a conversation with the current character's username and the clicked player's username
      const conversationQuery = query(
        collection(db, "Conversations"),
        where("participants", "array-contains", character.username)
      );

      const conversationSnapshot = await getDocs(conversationQuery);

      let foundConversationId = "";

      conversationSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(username)) {
          foundConversationId = doc.id; // Conversation found
        }
      });

      if (foundConversationId) {
        // Set the conversation ID if found
        setConversationId(foundConversationId);
      } else {
        setConversationId("");
      }

      // Close the player list view
      setIsCreatingChat(false);
    } catch (error) {
      console.error("Error finding conversation:", error);
      setError("Feil ved henting av samtale.");
    }
  };

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    // Fetch messages for the selected Channel or Conversation
    const unsubscribe = onSnapshot(
      query(
        collection(db, "Conversations", conversationId, "Messages"),
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
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      query(
        collection(db, "Conversations", conversationId, "Messages"),
        orderBy("timestamp")
      ),
      async (snapshot) => {
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
  }, [conversationId]);

  const submitNewMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return; // Prevent empty messages

    try {
      if (conversationId) {
        // Add a new message to the existing conversation's Messages sub-collection
        await addDoc(
          collection(db, "Conversations", conversationId, "Messages"),
          {
            senderId: character.id,
            senderName: character.username,
            text: newMessage,
            timestamp: serverTimestamp(),
          }
        );
      } else {
        // Create a new conversation document and add the first message
        const newConversationRef = await addDoc(
          collection(db, "Conversations"),
          {
            participants: [character.username, receiver],
            createdAt: serverTimestamp(),
          }
        );

        // Update the conversationId and set receiver in state
        setConversationId(newConversationRef.id);
        setReceiver(receiver); // Set the receiver when creating a new chat

        // Update conversations state to include the new conversation
        setConversations((prevConversations) => [
          ...prevConversations,
          {
            id: newConversationRef.id,
            participants: [character.username, receiver],
            createdAt: serverTimestamp(), // Placeholder until server returns actual value
          },
        ]);

        // Add the initial message to the Messages sub-collection
        await addDoc(
          collection(db, "Conversations", newConversationRef.id, "Messages"),
          {
            senderId: character.id,
            senderName: character.username,
            text: newMessage,
            timestamp: serverTimestamp(),
          }
        );
      }

      // Clear the new message input field
      setNewMessage("");
    } catch (error) {
      console.error("Feil ved sending av melding:", error);
      setError("Feil ved sending av melding.");
    }
  };

  if (loading) {
    return <p>Laster meldinger...</p>;
  }

  if (error) {
    return <p>Feil: {error}</p>;
  }

  return (
    <section className="flex flex-col flex-grow">
      <div className="flex-grow grid grid-cols-[auto_1fr] h-full">
        {/* Left panel */}
        <div className="h-full min-w-32 md:min-w-36 lg:min-w-40 py-8 bg-neutral-800/50">
          <div className="mb-4 flex justify-center">
            <Button size="small" style="secondary" onClick={handleNewChatClick}>
              Ny chat
            </Button>
          </div>
          <ul>
            {conversations.map((conversation) => {
              const otherParticipant = conversation.participants.find(
                (participant: string) => participant !== character.username
              );

              return (
                <li key={conversation.id}>
                  <button
                    className={`min-h-8 font-medium hover:text-white w-full text-left ${
                      receiver === otherParticipant
                        ? "bg-neutral-700/50 text-neutral-200 border-l-4 border-sky-500 pl-2"
                        : "text-neutral-400 pl-2"
                    }`}
                    onClick={() => handlePlayerClick(otherParticipant)}
                  >
                    {otherParticipant}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right panel */}
        <div id="right_panel" className="flex flex-col px-4 pt-8 pb-16">
          <div
            id="right_panel_heading"
            className="border-b border-neutral-600 mb-2"
          >
            {isCreatingChat ? <H2>Velg spiller</H2> : <H2>{receiver}</H2>}
          </div>

          {/* Render list of all players if creating a chat */}
          {isCreatingChat ? (
            <ul>
              {players.map((player) => (
                <li key={player.id}>
                  <button
                    className="hover:text-white w-full text-left"
                    onClick={() => handlePlayerClick(player.username)}
                  >
                    {player.username}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div id="messages_div" className="mb-4 pb-2">
              {/* Messages */}
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
          )}

          {/* Textarea */}
          {isCreatingChat || !receiver ? (
            <></>
          ) : (
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
                  className="w-8 flex justify-center items-center text-neutral-400 hover:text-white hover:cursor-pointer"
                >
                  <i className=" text-xl fa-solid fa-paper-plane"></i>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Chat;
