// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H3 from "../components/Typography/H3";
import Button from "../components/Button";
import ChatMessage from "../components/ChatMessage";
import ScrollArea from "../components/ScrollArea";
import InfoBox from "../components/InfoBox";

import Username from "../components/Typography/Username";

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
  limit,
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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [isCreatingChat, setIsCreatingChat] = useState<boolean>(false);
  const [receiver, setReceiver] = useState<string>("");
  const [receiverCharacter, setReceiverCharacter] = useState<{
    id: string;
    username: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadByConv, setUnreadByConv] = useState<Record<string, number>>({});
  const [isDropdownActive, setIsDropdownActive] = useState<boolean>(false);

  // New: input + validation error for creating chat
  const [newChatName, setNewChatName] = useState<string>("");
  const [createChatError, setCreateChatError] = useState<string | null>(null);

  // avatar for each username
  const [avatarByUser, setAvatarByUser] = useState<Record<string, string>>({});
  // last message (text + sender) for each conversation
  const [lastMsgByConv, setLastMsgByConv] = useState<
    Record<string, { text: string; senderId: string }>
  >({});

  const totalUnread = useMemo(
    () => Object.values(unreadByConv).reduce((a, b) => a + b, 0),
    [unreadByConv]
  );

  if (!userCharacter) return null;

  // Per-user storage key so multiple accounts don't collide
  const LS_KEY = useMemo(
    () => `lastConversation:${userCharacter.id}`,
    [userCharacter.id]
  );

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const controlsRef = useRef<HTMLDivElement | null>(null);

  // ---- Textarea autosize ----
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

  // Close dropdown on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!isDropdownActive) return;
      const el = controlsRef.current;
      if (el && !el.contains(e.target as Node)) {
        setIsDropdownActive(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [isDropdownActive]);

  useEffect(() => {
    if (!userCharacter?.username || !userCharacter?.id) return;

    const convQ = query(
      collection(db, "Conversations"),
      where("participants", "array-contains", userCharacter.username)
    );

    const perConvCounts: Record<string, number> = {};
    const unreadUnsubs = new Map<string, () => void>();
    const lastUnsubs = new Map<string, () => void>();

    const unsubConvs = onSnapshot(
      convQ,
      async (convSnap) => {
        const currentIds = new Set(convSnap.docs.map((d) => d.id));

        // Clean up removed convs
        for (const [cid, unsub] of unreadUnsubs) {
          if (!currentIds.has(cid)) {
            unsub();
            unreadUnsubs.delete(cid);
            delete perConvCounts[cid];
          }
        }
        for (const [cid, unsub] of lastUnsubs) {
          if (!currentIds.has(cid)) {
            unsub();
            lastUnsubs.delete(cid);
            setLastMsgByConv((prev) => {
              const next = { ...prev };
              delete next[cid];
              return next;
            });
          }
        }

        // Ensure listeners per conv
        convSnap.docs.forEach(async (convDoc) => {
          const cid = convDoc.id;
          const data = convDoc.data() as { participants?: unknown };
          const participants = Array.isArray(data.participants)
            ? (data.participants as string[])
            : [];

          // --- unread listener (kept as before) ---
          if (!unreadUnsubs.has(cid)) {
            const unreadQ = query(
              collection(db, "Conversations", cid, "Messages"),
              where("isRead", "==", false)
            );
            const unreadUnsub = onSnapshot(
              unreadQ,
              (msgSnap) => {
                const cnt = msgSnap.docs.reduce((acc, d) => {
                  const m = d.data() as any;
                  return m.senderId !== userCharacter.id ? acc + 1 : acc;
                }, 0);
                perConvCounts[cid] = cnt;
                setUnreadByConv({ ...perConvCounts });
              },
              () => {
                perConvCounts[cid] = 0;
                setUnreadByConv({ ...perConvCounts });
              }
            );
            unreadUnsubs.set(cid, unreadUnsub);
          }

          // --- last message listener (NEW) ---
          if (!lastUnsubs.has(cid)) {
            const lastQ = query(
              collection(db, "Conversations", cid, "Messages"),
              orderBy("timestamp", "desc"),
              limit(1)
            );
            const lastUnsub = onSnapshot(lastQ, (snap) => {
              const doc0 = snap.docs[0];
              const lm = doc0?.data() as any;
              setLastMsgByConv((prev) => ({
                ...prev,
                [cid]: {
                  text: lm?.text ?? "",
                  senderId: lm?.senderId ?? "",
                },
              }));
            });
            lastUnsubs.set(cid, lastUnsub);
          }

          // --- avatar fetch (once per username) ---
          const other = getOtherParticipant(
            participants,
            userCharacter.username
          );
          if (other && !avatarByUser[other]) {
            try {
              const charactersRef = collection(db, "Characters");
              const qChar = query(
                charactersRef,
                where("username_lowercase", "==", other.toLowerCase())
              );
              const shot = await getDocs(qChar);
              if (!shot.empty) {
                const cData = shot.docs[0].data() as any;
                const imgUrl =
                  cData?.character?.img ||
                  cData?.img ||
                  cData?.image ||
                  "/DefaultAvatar.jpg";
                if (imgUrl) {
                  setAvatarByUser((prev) => ({ ...prev, [other]: imgUrl }));
                }
              }
            } catch (e) {
              // swallow; avatar optional
            }
          }
        });
      },
      (err) => {
        console.error("Conversations listener error:", err);
        for (const [, unsub] of unreadUnsubs) unsub();
        for (const [, unsub] of lastUnsubs) unsub();
        unreadUnsubs.clear();
        lastUnsubs.clear();
        setUnreadByConv({});
        setLastMsgByConv({});
      }
    );

    return () => {
      unsubConvs();
      for (const [, unsub] of unreadUnsubs) unsub();
      for (const [, unsub] of lastUnsubs) unsub();
      unreadUnsubs.clear();
      lastUnsubs.clear();
    };
  }, [userCharacter?.username, userCharacter?.id, avatarByUser]);

  async function resolveCharacterByUsername(u: string) {
    const snap = await getDocs(
      query(
        collection(db, "Characters"),
        where("username_lowercase", "==", u.toLowerCase())
      )
    );
    if (snap.empty) return null;
    const doc0 = snap.docs[0];
    const data = doc0.data() as any;
    return { id: doc0.id, username: data.username || u };
  }

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
    resolveCharacterByUsername(other)
      .then(setReceiverCharacter)
      .catch(() => setReceiverCharacter(null));
    localStorage.setItem(LS_KEY, JSON.stringify({ id: conv.id, other }));
    setIsDropdownActive(false); // close dropdown when selecting
    markConversationAsRead(conv.id, userCharacter.id);
  };

  const handleNewChatClick = () => {
    setIsCreatingChat(true);
    setCreateChatError(null);
    setNewChatName("");
  };

  const getOtherParticipant = (parts: string[], me: string) =>
    parts.find((p) => p !== me) || "";

  const truncate = (s: string, n: number) =>
    s.length > n ? s.slice(0, n) + "..." : s;

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
                if (other)
                  resolveCharacterByUsername(other)
                    .then(setReceiverCharacter)
                    .catch(() => setReceiverCharacter(null));
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

  // ---- Find or start conversation with a given username ----
  const handlePlayerClick = async (username: string) => {
    try {
      // Show receiver in header immediately
      setReceiver(username);
      resolveCharacterByUsername(username)
        .then(setReceiverCharacter)
        .catch(() => setReceiverCharacter(null));

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

  // New: Start new chat by validating input username
  const handleStartNewChat = async () => {
    const candidateRaw = newChatName.trim();
    const candidate = candidateRaw.toLowerCase();

    if (!candidate) {
      setCreateChatError("Skriv inn spillernavn.");
      return;
    }

    if (candidate === userCharacter.username.toLowerCase()) {
      setCreateChatError("Du kan ikke starte en chat med deg selv.");
      return;
    }

    try {
      // Case-insensitive lookup via username_lowercase
      const charactersRef = collection(db, "Characters");
      const targetQuery = query(
        charactersRef,
        where("username_lowercase", "==", candidate)
      );
      const targetQuerySnapshot = await getDocs(targetQuery);

      if (targetQuerySnapshot.empty) {
        setCreateChatError("Spilleren finnes ikke.");
        return;
      }

      // Use the canonical username casing from the character doc
      const targetDoc = targetQuerySnapshot.docs[0];
      const targetData = targetDoc.data() as any;
      const targetUsername: string = targetData.username || candidateRaw;

      setCreateChatError(null);
      setReceiverCharacter({ id: targetDoc.id, username: targetUsername });
      await handlePlayerClick(targetUsername);
    } catch (e) {
      console.error(e);
      setCreateChatError("Noe gikk galt ved oppretting av chat.");
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
    <Main>
      <div
        className={
          "h-[calc(85vh-100px)] min-h-[600px] overflow-hidden flex flex-col"
        }
      >
        <div className="flex items-baseline justify-between gap-4">
          <H1>Meldinger</H1>
          <div className="relative flex gap-1" ref={controlsRef}>
            {isCreatingChat ? (
              <Button
                style="black"
                size="square"
                onClick={() => setIsCreatingChat(false)}
              >
                <i className="text-lg fa-solid fa-x"></i>
              </Button>
            ) : (
              <Button style="black" size="square" onClick={handleNewChatClick}>
                <i className="text-lg fa-solid fa-plus"></i>
              </Button>
            )}

            {/* Hide the dropdown button if there are no conversations */}
            {conversations.length > 0 && (
              <div className="relative">
                <Button
                  style="black"
                  size="square"
                  onClick={() => setIsDropdownActive(!isDropdownActive)}
                  aria-expanded={isDropdownActive}
                  aria-haspopup="menu"
                >
                  <i className="text-lg fa-solid fa-comment-dots"></i>
                </Button>

                {/* Unread messages badge (bottom-right like in Header, adjust position if you prefer) */}
                {totalUnread > 0 && (
                  <span className="absolute bottom-0 right-0 bg-neutral-600 translate-x-1 translate-y-1 text-sky-400 text-s font-bold rounded-full w-5 h-5 flex justify-center items-center">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                )}
              </div>
            )}

            {/* Dropdown panel */}
            {isDropdownActive && conversations.length > 0 && (
              <section
                id="dropdown"
                className="absolute min-w-32 md:min-w-36 lg:min-w-40 w-max bg-neutral-800 p-2 top-12 right-0 z-10 rounded-xl shadow-lg"
                role="menu"
              >
                <ul>
                  {conversations.map((conversation) => {
                    const otherParticipant = conversation.participants.find(
                      (participant: string) =>
                        participant !== userCharacter.username
                    );

                    const isActive =
                      conversation.id === conversationId ||
                      (receiver && otherParticipant === receiver);

                    const unread = unreadByConv[conversation.id] || 0;

                    return (
                      <li key={conversation.id}>
                        <button
                          className={`flex items-center gap-2 px-2 py-1 min-h-12 w-full text-left hover:bg-neutral-700 rounded-lg ${
                            isActive
                              ? "text-neutral-200 bg-neutral-700/50"
                              : "text-neutral-400"
                          }`}
                          onClick={() =>
                            selectConversationByObject(conversation)
                          }
                          role="menuitem"
                        >
                          {/* Avatar */}
                          {otherParticipant && (
                            <img
                              src={
                                avatarByUser[otherParticipant] ||
                                "/DefaultAvatar.jpg"
                              }
                              alt={otherParticipant}
                              className="w-10 h-10 rounded-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                const img = e.currentTarget;
                                if (img.src.includes("/DefaultAvatar.jpg"))
                                  return; // avoid loops
                                img.src = "/DefaultAvatar.jpg";
                              }}
                            />
                          )}

                          {/* Name + preview */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">
                                {otherParticipant}
                              </span>
                              {unread > 0 && (
                                <span className="bg-neutral-600 px-1.5 h-5 min-w-5 flex justify-center items-center rounded-full ml-auto text-sky-400 text-xs font-bold">
                                  {unread}
                                </span>
                              )}
                            </div>
                            {/* Preview line */}
                            <div className="text-sm text-stone-400 truncate mr-1">
                              {(() => {
                                const lm = lastMsgByConv[conversation.id];
                                if (!lm || !lm.text) return "";
                                const mine = lm.senderId === userCharacter.id;
                                const preview = truncate(lm.text, 20);
                                return mine ? `Du: ${preview}` : preview;
                              })()}
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>
        </div>

        <div className="flex flex-grow min-h-0 relative">
          {/* Chat panel */}
          <section id="chat" className="flex flex-1 min-h-0 flex-col w-full">
            <div id="chat_heading" className="mb-2">
              {/* When creating a chat, render input + button instead of "Velg spiller" */}
              {isCreatingChat ? (
                <div className="py-2 flex flex-col gap-2">
                  {createChatError && (
                    <InfoBox
                      type="failure"
                      onClose={() => setCreateChatError("")}
                    >
                      {createChatError}
                    </InfoBox>
                  )}
                  <H3>Ny chat</H3>
                  <div className="grid grid-cols-[1fr_auto] gap-2 pr-2">
                    <input
                      type="text"
                      value={newChatName}
                      onChange={(e) => setNewChatName(e.target.value)}
                      placeholder="Brukernavn"
                      className="bg-transparent border-b border-neutral-600 py-1 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleStartNewChat();
                      }}
                    />
                    <Button onClick={handleStartNewChat}>Skriv melding</Button>
                  </div>
                </div>
              ) : (
                <H3>
                  {receiverCharacter ? (
                    <Username character={receiverCharacter} />
                  ) : (
                    <p className="font-bold">{receiver}</p>
                  )}
                </H3>
              )}
            </div>

            {!isCreatingChat ? (
              <div
                id="messages_div"
                className="mb-4 mr-2 flex-1 min-h-0 overflow-hidden"
              >
                <ScrollArea
                  className="h-full"
                  contentClassName="h-full pr-4"
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
            ) : (
              <></>
            )}

            {/* Textarea */}
            {isCreatingChat || !receiver ? (
              <></>
            ) : (
              <div id="new_message_div">
                <form
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
                        if (e.shiftKey) {
                          return;
                        } else {
                          e.preventDefault();
                          submitNewMessage(e);
                        }
                      }
                    }}
                    onChange={handleInputChange}
                    className="w-full bg-neutral-800 outline-none placeholder-neutral-500 text-neutral-200 resize-none rounded-3xl px-4 py-2 leading-normal"
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
          </section>
        </div>
      </div>
    </Main>
  );
};

export default Chat;
