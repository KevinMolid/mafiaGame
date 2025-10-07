// Components
import H3 from "../components/Typography/H3";
import Button from "../components/Button";
import ChatMessage from "../components/ChatMessage";
import ScrollArea from "../components/ScrollArea";

// Types
import { Message } from "../Functions/messageService";

// React
import { useState, useEffect, useRef, useMemo, Fragment } from "react";

// Firebase
import {
  getFirestore,
  collection,
  onSnapshot,
  orderBy,
  getDocs,
  query,
  where,
  addDoc,
  doc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";

// Context
import { useCharacter } from "../CharacterContext";

const db = getFirestore();

// ---- Types ----
type Conversation = {
  id: string;
  participants: string[];
  createdAt?: any;
};

function tsToMs(t: any): number | null {
  if (!t && t !== 0) return null;
  if (typeof t?.toDate === "function") return t.toDate().getTime(); // Firestore TS
  if (t instanceof Date) return t.getTime();
  if (typeof t === "number") return t; // assume ms
  const d = new Date(t);
  return isNaN(d.getTime()) ? null : d.getTime();
}

const MIN_GAP_MS = 10 * 60 * 1000; // show a time divider when gap >= 10 min

function isNewDay(currMs: number, prevMs: number) {
  const a = new Date(prevMs);
  const b = new Date(currMs);
  return (
    a.getFullYear() !== b.getFullYear() ||
    a.getMonth() !== b.getMonth() ||
    a.getDate() !== b.getDate()
  );
}

const Chat = () => {
  const { userCharacter } = useCharacter();
  const [players, setPlayers] = useState<any[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [isCreatingChat, setIsCreatingChat] = useState<boolean>(false);
  const [receiver, setReceiver] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadByConv, setUnreadByConv] = useState<Record<string, number>>({});

  if (!userCharacter) return null;

  // Per-user storage key so multiple accounts don't collide
  const LS_KEY = useMemo(
    () => `lastConversation:${userCharacter.id}`,
    [userCharacter.id]
  );

  // ---- Textarea autosize ----
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "0px";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newMessage, conversationId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    adjustTextareaHeight();
  };

  useEffect(() => {
    if (!userCharacter?.username || !userCharacter?.id) return;

    const convQ = query(
      collection(db, "Conversations"),
      where("participants", "array-contains", userCharacter.username)
    );

    const perConvCounts: Record<string, number> = {};
    const msgUnsubs = new Map<string, () => void>();

    const unsubConvs = onSnapshot(
      convQ,
      (convSnap) => {
        // remove listeners for deleted conversations
        const existing = new Set(convSnap.docs.map((d) => d.id));
        for (const [cid, unsub] of msgUnsubs) {
          if (!existing.has(cid)) {
            unsub();
            msgUnsubs.delete(cid);
            delete perConvCounts[cid];
          }
        }

        // add listeners for new conversations
        convSnap.docs.forEach((convDoc) => {
          const cid = convDoc.id;
          if (msgUnsubs.has(cid)) return;

          const msgQ = query(
            collection(db, "Conversations", cid, "Messages"),
            where("isRead", "==", false)
          );

          const unsub = onSnapshot(
            msgQ,
            (msgSnap) => {
              const cnt = msgSnap.docs.reduce((acc, d) => {
                const m = d.data() as any;
                return m.senderId !== userCharacter.id ? acc + 1 : acc;
              }, 0);
              perConvCounts[cid] = cnt;
              // push a new object to trigger render
              setUnreadByConv({ ...perConvCounts });
            },
            (err) => {
              console.error("Unread messages listener error:", err);
              perConvCounts[cid] = 0;
              setUnreadByConv({ ...perConvCounts });
            }
          );

          msgUnsubs.set(cid, unsub);
        });
      },
      (err) => {
        console.error("Conversations listener error:", err);
        for (const [, unsub] of msgUnsubs) unsub();
        msgUnsubs.clear();
        setUnreadByConv({});
      }
    );

    return () => {
      unsubConvs();
      for (const [, unsub] of msgUnsubs) unsub();
      msgUnsubs.clear();
    };
  }, [userCharacter?.username, userCharacter?.id]);

  function ChatTimeDivider({ label }: { label: string }) {
    return (
      <li className="my-3 flex justify-center">
        <span className="px-2 py-0.5 text-xs text-neutral-400 bg-neutral-800/70 rounded-full">
          {label}
        </span>
      </li>
    );
  }

  function fmtDividerLabel(ms: number) {
    const d = new Date(ms);
    const now = new Date();
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getFullYear() === yesterday.getFullYear() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getDate() === yesterday.getDate();

    const time = d.toLocaleTimeString("nb-NO", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (sameDay) return time; // “12:38”
    if (isYesterday) return `I går · ${time}`;
    // “12. mai · 18:03”
    const date = d.toLocaleDateString("nb-NO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    return `${date} · ${time}`;
  }

  // Mark all incoming unread messages in this conversation as read
  const markConversationAsRead = async (
    convId: string,
    currentUserId: string
  ) => {
    // You already have the messages in state; use those to avoid refetching
    const unreadIncoming = messages.filter(
      (m) => m.senderId !== currentUserId && !m.isRead
    );
    if (unreadIncoming.length === 0) return;

    const batch = writeBatch(db);
    unreadIncoming.forEach((m) => {
      const msgRef = doc(db, "Conversations", convId, "Messages", m.id);
      batch.update(msgRef, { isRead: true });
    });
    await batch.commit();
  };

  // ---- Conversation helpers ----
  const selectConversationByObject = (conv: Conversation) => {
    if (!conv) return;
    const other =
      conv.participants.find((p) => p !== userCharacter.username) || "";
    setConversationId(conv.id);
    setReceiver(other);
    localStorage.setItem(LS_KEY, JSON.stringify({ id: conv.id, other }));
    markConversationAsRead(conv.id, userCharacter.id);
  };

  const handleNewChatClick = () => {
    setIsCreatingChat(true);
  };

  // ---- Fetch conversations for user + restore last open ----
  useEffect(() => {
    const fetchUserConversations = async () => {
      try {
        const conversationsSnapshot = await getDocs(
          query(
            collection(db, "Conversations"),
            where("participants", "array-contains", userCharacter.username)
          )
        );

        const conversationsList: Conversation[] =
          conversationsSnapshot.docs.map((docSnap) => {
            const data = docSnap.data() as {
              participants?: unknown;
              createdAt?: any;
            };
            const participants = Array.isArray(data.participants)
              ? (data.participants as string[])
              : [];
            return { id: docSnap.id, participants, createdAt: data.createdAt };
          });

        setConversations(conversationsList);

        // Try restoring last open conversation from localStorage
        const saved = localStorage.getItem(LS_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as { id?: string; other?: string };
            if (parsed.id) {
              const exists = conversationsList.find((c) => c.id === parsed.id);
              if (exists) {
                setConversationId(parsed.id);
                const other =
                  parsed.other ||
                  exists.participants.find(
                    (p) => p !== userCharacter.username
                  ) ||
                  "";
                setReceiver(other);
              } else {
                localStorage.removeItem(LS_KEY);
              }
            }
          } catch {
            // ignore bad JSON
          }
        }
      } catch (err) {
        console.error("Error fetching conversations:", err);
        setError("Feil ved lasting av samtaler.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserConversations();
  }, [LS_KEY, userCharacter.username]);

  // ---- (Optional) Fetch all players when creating a chat ----
  useEffect(() => {
    const fetchAllPlayers = async () => {
      try {
        const playersSnapshot = await getDocs(collection(db, "Characters"));
        const players = playersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPlayers(players);
      } catch (err) {
        console.error("Error fetching players:", err);
        setError("Feil ved lasting av spillere.");
      }
    };

    if (isCreatingChat) {
      fetchAllPlayers();
    }
  }, [isCreatingChat]);

  // ---- Find or start conversation with a given username ----
  const handlePlayerClick = async (username: string) => {
    try {
      // Show receiver in header immediately
      setReceiver(username);

      // Find an existing conversation with both participants
      const conversationQuery = query(
        collection(db, "Conversations"),
        where("participants", "array-contains", userCharacter.username)
      );

      const conversationSnapshot = await getDocs(conversationQuery);

      let found: Conversation | null = null;

      conversationSnapshot.forEach((docSnap) => {
        const data = docSnap.data() as {
          participants?: unknown;
          createdAt?: any;
        };
        const participants = Array.isArray(data.participants)
          ? (data.participants as string[])
          : [];
        if (participants.includes(username)) {
          found = { id: docSnap.id, participants, createdAt: data.createdAt };
        }
      });

      if (found) {
        selectConversationByObject(found);
      } else {
        // No conversation yet; clear selection and persist intended partner
        setConversationId("");
        localStorage.setItem(
          LS_KEY,
          JSON.stringify({ id: "", other: username })
        );
      }

      setIsCreatingChat(false);
    } catch (err) {
      console.error("Error finding conversation:", err);
      setError("Feil ved henting av samtale.");
    }
  };

  // Mark unread incoming messages as read whenever the active conversation's
  // messages change (i.e., after onSnapshot delivers them).
  useEffect(() => {
    if (!conversationId) return;
    // don't await; fire-and-forget is fine here
    markConversationAsRead(conversationId, userCharacter.id).catch(
      console.error
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, messages, userCharacter.id]);

  // ---- Subscribe to selected conversation's messages ----
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
      (snapshot) => {
        const fetchedMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Message[];

        setMessages(fetchedMessages);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
      }
    );

    return () => unsubscribe();
  }, [conversationId]);

  // ---- Send message / create conversation ----
  const submitNewMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    try {
      if (conversationId) {
        await addDoc(
          collection(db, "Conversations", conversationId, "Messages"),
          {
            senderId: userCharacter.id,
            senderName: userCharacter.username,
            text: newMessage,
            timestamp: serverTimestamp(),
            isRead: false,
          }
        );
      } else {
        // Create a new conversation and persist as active
        const newConversationRef = await addDoc(
          collection(db, "Conversations"),
          {
            participants: [userCharacter.username, receiver],
            createdAt: serverTimestamp(),
          }
        );

        setConversationId(newConversationRef.id);

        setConversations((prev) => [
          ...prev,
          {
            id: newConversationRef.id,
            participants: [userCharacter.username, receiver],
            createdAt: serverTimestamp(),
          },
        ]);

        localStorage.setItem(
          LS_KEY,
          JSON.stringify({ id: newConversationRef.id, other: receiver })
        );

        await addDoc(
          collection(db, "Conversations", newConversationRef.id, "Messages"),
          {
            senderId: userCharacter.id,
            senderName: userCharacter.username,
            text: newMessage,
            timestamp: serverTimestamp(),
            isRead: false,
          }
        );
      }

      setNewMessage("");
    } catch (err) {
      console.error("Feil ved sending av melding:", err);
      setError("Feil ved sending av melding.");
    }
  };

  const lastOwnIdx = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].senderId === userCharacter.id) return i;
    }
    return -1;
  }, [messages, userCharacter.id]);

  const lastReadOwnIdx = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.senderId === userCharacter.id && m.isRead) return i;
    }
    return -1;
  }, [messages, userCharacter.id]);

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
              <i className="fa-solid fa-plus"></i> Ny chat
            </Button>
          </div>
          <ul>
            {conversations.map((conversation) => {
              const otherParticipant = conversation.participants.find(
                (participant: string) => participant !== userCharacter.username
              );

              const isActive =
                conversation.id === conversationId ||
                (receiver && otherParticipant === receiver);

              const unread = unreadByConv[conversation.id] || 0;

              return (
                <li key={conversation.id}>
                  <button
                    className={`flex items-center px-2 min-h-8 font-medium hover:text-white w-full text-left ${
                      isActive
                        ? "bg-neutral-700/50 text-neutral-200 border-l-4 border-sky-500 pl-2"
                        : "text-neutral-400 pl-2"
                    }`}
                    onClick={() => selectConversationByObject(conversation)}
                  >
                    {otherParticipant}
                    {unread > 0 && (
                      <span className="ml-auto text-sky-400 font-bold">
                        {unread}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right panel */}
        <div id="right_panel" className="flex flex-col px-4 pt-8 pb-16 min-h-0">
          <div
            id="right_panel_heading"
            className="border-b border-neutral-600 mb-2 max-w-[400px]"
          >
            {isCreatingChat ? <H3>Velg spiller</H3> : <H3>{receiver}</H3>}
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
            <div id="messages_div" className="mb-4 mr-2 max-w-[400px]">
              <ScrollArea
                className="h-[400px]"
                contentClassName="pr-4"
                stickToBottom
              >
                <ul className="flex flex-col">
                  {messages.map((m, i) => {
                    const isOwn = m.senderId === userCharacter.id;

                    // group header only if previous sender is different
                    const prev = messages[i - 1];
                    const showMeta = !prev || prev.senderId !== m.senderId;

                    // time divider logic
                    const curMs = tsToMs(m.timestamp);
                    const prevMs = prev ? tsToMs(prev.timestamp) : null;
                    const showTime =
                      curMs !== null &&
                      (!prev ||
                        prevMs === null ||
                        isNewDay(curMs, prevMs) ||
                        curMs - prevMs >= MIN_GAP_MS);

                    // Show exactly one "Lest" (on the last read own msg),
                    // and one "Sendt" (on the very last own msg). If they coincide, "Lest" wins.
                    let statusBelow: "sent" | "read" | null = null;
                    if (isOwn) {
                      if (i === lastReadOwnIdx) statusBelow = "read";
                      else if (i === lastOwnIdx) statusBelow = "sent";
                    }

                    return (
                      <Fragment key={m.id}>
                        {showTime && curMs !== null && (
                          <ChatTimeDivider label={fmtDividerLabel(curMs)} />
                        )}
                        <ChatMessage
                          {...m}
                          isOwn={isOwn}
                          showMeta={showMeta}
                          statusBelow={statusBelow}
                        />
                      </Fragment>
                    );
                  })}
                </ul>
              </ScrollArea>
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
                className="grid grid-cols-[auto_min-content] gap-2 pr-2 max-w-[400px]"
              >
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={newMessage}
                  placeholder="Melding"
                  spellCheck={false}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (e.shiftKey) {
                        return;
                      } else {
                        e.preventDefault();
                        submitNewMessage(e);
                      }
                    }
                  }}
                  onChange={handleInputChange}
                  className="w-full bg-neutral-800 outline-none resize-none rounded-3xl px-4 py-2 leading-normal"
                  style={{ minHeight: 0 }}
                ></textarea>

                <div className="mt-auto">
                  <Button type="submit" size="square">
                    <i className=" fa-solid fa-paper-plane"></i>
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Chat;
