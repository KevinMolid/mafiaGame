// Components
import Main from "../components/Main";
import H2 from "../components/Typography/H2";
import Username from "../components/Typography/Username";
import Familyname from "../components/Typography/Familyname";
import Button from "../components/Button";
import Label from "../components/Label";
import InfoBox from "../components/InfoBox";
import defaultImg from "/default.jpg";

import { useEffect, useState, useRef } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";

import { useAuth } from "../AuthContext";
import { useCharacter } from "../CharacterContext";

import timeAgo from "../Functions/TimeFunctions";
import { bbcodeToHtml } from "../Functions/bbcode";

import {
  getFirestore,
  doc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  increment,
  runTransaction,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../firebaseConfig";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Lokale grenser (ikke importer fra Forum.tsx)
const MAX_TITLE = 120;
const MAX_CONTENT = 10_000;

type ReactionKey = "like" | "dislike" | "heart" | "fire" | "poop";

interface Thread {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: any;
  categoryId?: string;
  editedAt?: any;
  reactions?: Partial<Record<ReactionKey, number>>;
  reactionsByUser?: Record<string, ReactionKey>;
  isSticky?: boolean;
  isClosed?: boolean;
}

interface Reply {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: any;
  editedAt?: any;
  reactions?: Partial<Record<ReactionKey, number>>;
  reactionsByUser?: Record<string, ReactionKey>;
  censored?: boolean;
  censoredBy?: string;
  censoredAt?: any;
  censoredReason?: string;
  deleted?: boolean;
}

/** Small card that shows a reply author's avatar + family, live */
const ReplyAuthorCard = ({
  authorId,
  authorName,
}: {
  authorId: string;
  authorName: string;
}) => {
  const [authorDoc, setAuthorDoc] = useState<any | null>(null);

  useEffect(() => {
    if (!authorId) return;
    const unsub = onSnapshot(doc(db, "Characters", authorId), (snap) => {
      setAuthorDoc(snap.exists() ? snap.data() : null);
    });
    return () => unsub();
  }, [authorId]);

  return (
    <div className="flex flex-col items-center text-center">
      <Link to={`/profil/${authorId}`}>
        <img
          src={authorDoc?.img || defaultImg}
          alt={`${authorName}'s avatar`}
          className="w-[80px] h-[80px] md:w-28 md:h-28 mb-2 object-cover"
        />
      </Link>

      <p className="text-sm">
        <Username character={{ id: authorId, username: authorName }} />
      </p>

      {authorDoc?.familyId ? (
        <p className="text-sm">
          <Familyname
            family={{ id: authorDoc.familyId, name: authorDoc.familyName }}
          />
        </p>
      ) : (
        <p className="text-sm">Ingen familie</p>
      )}
    </div>
  );
};

/** Reusable “+” reaction dropdown */
const ReactionMenu = ({
  onReact,
}: {
  onReact?: (emoji: ReactionKey) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const handle = (which: ReactionKey) => {
    onReact?.(which);
    setOpen(false);
  };

  return (
    <div className="relative inline-block" ref={ref}>
      <Button
        type="button"
        size="small-square"
        style="secondary"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <i className="fa-solid fa-plus"></i>
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 z-20 mt-1 min-w-32 rounded-md border border-neutral-700 bg-neutral-900 p-1 shadow-lg"
        >
          <button
            role="menuitem"
            className="w-full text-left px-2 py-1 rounded hover:bg-neutral-800"
            onClick={() => handle("like")}
            title="Liker"
          >
            👍 Liker
          </button>
          <button
            role="menuitem"
            className="w-full text-left px-2 py-1 rounded hover:bg-neutral-800"
            onClick={() => handle("dislike")}
            title="Misliker"
          >
            👎 Misliker
          </button>
          <button
            role="menuitem"
            className="w-full text-left px-2 py-1 rounded hover:bg-neutral-800"
            onClick={() => handle("heart")}
            title="Hjerte"
          >
            ❤️ Hjerte
          </button>
          <button
            role="menuitem"
            className="w-full text-left px-2 py-1 rounded hover:bg-neutral-800"
            onClick={() => handle("fire")}
            title="Flamme"
          >
            🔥 Flamme
          </button>
          <button
            role="menuitem"
            className="w-full text-left px-2 py-1 rounded hover:bg-neutral-800"
            onClick={() => handle("poop")}
            title="Dritt"
          >
            💩 Dritt
          </button>
        </div>
      )}
    </div>
  );
};

// Render a reaction chip with optional highlight background
function ReactionChip({
  icon,
  count,
  highlight,
  label,
}: {
  icon: string;
  count: number | undefined;
  highlight: boolean;
  label: string;
}) {
  if (!count || count <= 0) return null; // hide zero-count reactions entirely
  return (
    <span
      aria-label={label}
      className={
        "inline-flex items-center justify-center px-2 py-1 rounded-full " +
        (highlight ? "bg-neutral-800" : "bg-transparent")
      }
    >
      <span className="flex items-center">
        <span aria-hidden>{icon}</span>
        <span className="tabular-nums">{count}</span>
      </span>
    </span>
  );
}

const ForumThread = () => {
  const { userData } = useAuth();
  const { postId } = useParams<{ postId: string }>();
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState<any | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<
    "info" | "warning" | "success" | "failure"
  >("info");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const [deleting, setDeleting] = useState(false);

  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyContent, setEditReplyContent] = useState<string>("");
  const [savingReplyId, setSavingReplyId] = useState<string | null>(null);

  const { userCharacter } = useCharacter();

  const navigate = useNavigate();
  const location = useLocation();

  // Live-listener for tråden + replies
  useEffect(() => {
    if (!postId) return;

    setLoading(true);

    const threadRef = doc(db, "ForumThreads", postId);
    const unsubThread = onSnapshot(
      threadRef,
      (snap) => {
        if (!snap.exists()) {
          setThread(null);
          setLoading(false);
          return;
        }
        const data = snap.data() as any;
        const t = { id: snap.id, ...data } as Thread;
        setThread(t);

        setEditTitle((t.title ?? "").toString());
        setEditContent((t.content ?? "").toString());

        setLoading(false);
      },
      (err) => {
        console.error("Feil ved onSnapshot for tråd:", err);
        setLoading(false);
      }
    );

    const repliesQuery = query(
      collection(db, "ForumThreads", postId, "Replies"),
      orderBy("createdAt", "asc")
    );
    const unsubReplies = onSnapshot(repliesQuery, (snapshot) => {
      const repliesData = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Reply[];
      setReplies(repliesData);
    });

    return () => {
      unsubThread();
      unsubReplies();
    };
  }, [postId]);

  // Live-listener for forfatter
  useEffect(() => {
    if (!thread?.authorId) return;
    const unsubAuthor = onSnapshot(
      doc(db, "Characters", thread.authorId),
      (snap) => {
        if (snap.exists()) setAuthor(snap.data());
        else setAuthor(null);
      }
    );
    return () => unsubAuthor();
  }, [thread?.authorId]);

  const handleReplyChange = (e: any) => {
    setNewReply(e.target.value);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const replyContent = e.target.elements.reply.value.trim();

    if (!replyContent) {
      setMessageType("warning");
      setMessage("Svaret ditt har ikke noe innhold.");
      return;
    }

    if (!postId) {
      console.error("Ingen tråd-ID ble funnet.");
      return;
    }

    try {
      const replyData = {
        content: newReply,
        authorId: userCharacter?.id,
        authorName: userCharacter?.username,
        createdAt: serverTimestamp(),
      };

      await addDoc(
        collection(db, "ForumThreads", postId, "Replies"),
        replyData
      );

      setNewReply("");
    } catch (error) {
      console.error("Error adding reply: ", error);
    }
  };

  const isAuthor = !!userCharacter && thread?.authorId === userCharacter.id;
  const isStaff =
    userData?.type === "admin" ||
    userCharacter?.role === "admin" ||
    userCharacter?.role === "moderator";

  // --- Admin actions ---
  const toggleSticky = async () => {
    if (!postId || !isStaff || !thread) return;
    const next = !thread.isSticky;
    try {
      await updateDoc(doc(db, "ForumThreads", postId), {
        isSticky: next,
        ...(next
          ? { stickyAt: serverTimestamp(), stickyBy: userCharacter?.id ?? null }
          : { stickyAt: null, stickyBy: null }),
      });
      setMessageType("success");
      setMessage(
        next ? "Tråden er nå festet." : "Tråden er ikke lenger festet."
      );
    } catch (e) {
      console.error(e);
      setMessageType("failure");
      setMessage("Kunne ikke oppdatere festing. Prøv igjen.");
    }
  };

  const toggleClosed = async () => {
    if (!postId || !isStaff || !thread) return;
    const next = !thread.isClosed;
    try {
      await updateDoc(doc(db, "ForumThreads", postId), {
        isClosed: next,
        ...(next
          ? { closedAt: serverTimestamp(), closedBy: userCharacter?.id ?? null }
          : { closedAt: null, closedBy: null }),
      });
      setMessageType("success");
      setMessage(next ? "Tråden er nå stengt." : "Tråden er åpnet igjen.");
    } catch (e) {
      console.error(e);
      setMessageType("failure");
      setMessage("Kunne ikke oppdatere lukking. Prøv igjen.");
    }
  };

  const startEditing = () => {
    if (!thread) return;
    setEditTitle(thread.title || "");
    setEditContent(thread.content || "");
    setMessage("");
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setMessage("");
  };

  const saveEdit = async () => {
    if (!postId || !thread || !isAuthor) return;

    const title = editTitle.trim();
    const content = editContent.trim();

    const errs: string[] = [];
    if (title.length < 3) errs.push("Emne må ha minst 3 tegn.");
    if (title.length > MAX_TITLE) errs.push("Emne er for langt.");
    if (content.length < 10) errs.push("Innhold må ha minst 10 tegn.");
    if (content.length > MAX_CONTENT) errs.push("Innhold er for langt.");

    if (errs.length) {
      setMessageType("warning");
      setMessage(errs.join(" "));
      return;
    }

    try {
      setSaving(true);
      await updateDoc(doc(db, "ForumThreads", postId), {
        title,
        content,
        editedAt: serverTimestamp(),
        editedBy: userCharacter?.id || null,
      });

      setMessageType("success");
      setMessage("Tråden ble oppdatert.");
      setEditing(false);
    } catch (e) {
      console.error(e);
      setMessageType("failure");
      setMessage("Kunne ikke oppdatere tråden. Prøv igjen.");
    } finally {
      setSaving(false);
    }
  };

  const deleteThread = async () => {
    if (!postId || !thread) return;
    if (!isAuthor && !isStaff) {
      setMessageType("warning");
      setMessage("Du har ikke tilgang til å slette denne tråden.");
      return;
    }

    if (
      !confirm(
        "Er du sikker på at du vil slette denne tråden og alle svar? Dette kan ikke angres."
      )
    ) {
      return;
    }

    setDeleting(true);
    setMessage("");
    try {
      // 1) load replies
      const repliesCol = collection(db, "ForumThreads", postId, "Replies");
      const repliesSnap = await getDocs(repliesCol);

      // 2) delete in batches (max 500 ops per batch). We'll do chunks of 400 for safety.
      const docsToDelete = repliesSnap.docs.map((d) => d.ref);
      // append the thread doc ref at the end
      const threadRef = doc(db, "ForumThreads", postId);

      const chunkSize = 400;
      for (let i = 0; i < docsToDelete.length; i += chunkSize) {
        const batch = writeBatch(db);
        const chunk = docsToDelete.slice(i, i + chunkSize);
        chunk.forEach((ref) => batch.delete(ref));
        await batch.commit();
      }

      // finally delete the thread doc itself (separate batch)
      {
        const batch = writeBatch(db);
        batch.delete(threadRef);
        await batch.commit();
      }

      // navigate back to forum (preserve category if provided)
      const params = new URLSearchParams(location.search);
      const cat = params.get("cat") || thread?.categoryId;
      navigate(cat ? `/forum?cat=${cat}` : "/forum");
    } catch (err) {
      console.error("Failed to delete thread:", err);
      setMessageType("failure");
      setMessage("Kunne ikke slette tråden. Prøv igjen.");
    } finally {
      setDeleting(false);
    }
  };

  const deleteReply = async (replyId: string) => {
    if (!postId) return;

    const reply = replies.find((r) => r.id === replyId);
    const canDelete = !!userCharacter && reply?.authorId === userCharacter.id;
    const canStaffDelete = isStaff; // optional: allow staff too
    if (!canDelete && !canStaffDelete) {
      setMessageType("warning");
      setMessage("Du har ikke tilgang til å slette dette svaret.");
      return;
    }

    if (!confirm("Slette svaret? Dette kan ikke angres.")) return;

    try {
      await updateDoc(doc(db, "ForumThreads", postId, "Replies", replyId), {
        // soft-delete? If you want hard delete, use writeBatch delete instead.
        deleted: true,
        deletedAt: serverTimestamp(),
        deletedBy: userCharacter?.id ?? null,
        content: "[slettet]",
        reactions: {}, // clear counts
        reactionsByUser: {}, // clear who reacted
      });
      setMessageType("success");
      setMessage("Svaret ble slettet.");
    } catch (e) {
      console.error(e);
      setMessageType("failure");
      setMessage("Kunne ikke slette svaret. Prøv igjen.");
    }
  };

  const toggleCensorReply = async (replyId: string) => {
    if (!postId || !isStaff) return;

    const r = replies.find((x) => x.id === replyId);
    const next = !r?.censored;

    try {
      await updateDoc(doc(db, "ForumThreads", postId, "Replies", replyId), {
        censored: next,
        censoredBy: next ? userCharacter?.id ?? null : null,
        censoredAt: next ? serverTimestamp() : null,
        // Optionally keep a reason text; wire a UI input if needed:
        // censoredReason: next ? "Regelbrudd" : null,
      });
      setMessageType("success");
      setMessage(next ? "Svaret er sensurert." : "Sensuren er fjernet.");
    } catch (e) {
      console.error(e);
      setMessageType("failure");
      setMessage("Kunne ikke oppdatere sensur. Prøv igjen.");
    }
  };

  const startEditReply = (reply: Reply) => {
    setEditingReplyId(reply.id);
    setEditReplyContent(reply.content || "");
    setMessage("");
  };

  const cancelEditReply = () => {
    setEditingReplyId(null);
    setEditReplyContent("");
    setMessage("");
  };

  const saveEditReply = async (replyId: string) => {
    if (!postId) return;

    const content = editReplyContent.trim();
    if (content.length === 0) {
      setMessageType("warning");
      setMessage("Svaret kan ikke være tomt.");
      return;
    }
    if (content.length > MAX_CONTENT) {
      setMessageType("warning");
      setMessage("Svaret er for langt.");
      return;
    }

    try {
      setSavingReplyId(replyId);
      await updateDoc(doc(db, "ForumThreads", postId, "Replies", replyId), {
        content,
        editedAt: serverTimestamp(),
        editedBy: userCharacter?.id || null,
      });

      setEditingReplyId(null);
      setEditReplyContent("");
      setMessageType("success");
      setMessage("Svaret ble oppdatert.");
    } catch (e) {
      console.error(e);
      setMessageType("failure");
      setMessage("Kunne ikke oppdatere svaret. Prøv igjen.");
    } finally {
      setSavingReplyId(null);
    }
  };

  // --- Reactions: transaction-based “once per user” ---
  const addReactionToDocOnce = async (
    targetRef: ReturnType<typeof doc>,
    userId: string,
    reaction: ReactionKey
  ) => {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(targetRef);
      if (!snap.exists()) throw new Error("Target does not exist");

      const data = snap.data() as any;
      const reactionsByUser: Record<string, ReactionKey> =
        data?.reactionsByUser ?? {};
      const already = reactionsByUser[userId];

      if (already) {
        throw new Error("already-reacted");
      }

      const fieldCountsPath = `reactions.${reaction}`;
      const userPath = `reactionsByUser.${userId}`;

      tx.update(targetRef, {
        [fieldCountsPath]: increment(1),
        [userPath]: reaction,
      });
    });
  };

  const addReactionToThread = async (reaction: ReactionKey) => {
    if (!userCharacter) {
      setMessageType("warning");
      setMessage("Du må være logget inn for å reagere.");
      return;
    }
    if (!postId) return;

    // prevent self-reaction
    if (thread?.authorId === userCharacter.id) {
      setMessageType("warning");
      setMessage("Du kan ikke reagere på ditt eget innlegg.");
      return;
    }

    try {
      await addReactionToDocOnce(
        doc(db, "ForumThreads", postId),
        userCharacter.id,
        reaction
      );
    } catch (e: any) {
      if (e?.message === "already-reacted") {
        setMessageType("warning");
        setMessage("Du har allerede reagert på denne tråden.");
      } else {
        console.error(e);
        setMessageType("failure");
        setMessage("Kunne ikke lagre reaksjonen. Prøv igjen.");
      }
    }
  };

  const addReactionToReply = async (replyId: string, reaction: ReactionKey) => {
    if (!userCharacter) {
      setMessageType("warning");
      setMessage("Du må være logget inn for å reagere.");
      return;
    }
    if (!postId) return;

    const reply = replies.find((r) => r.id === replyId);
    if (reply && reply.authorId === userCharacter.id) {
      setMessageType("warning");
      setMessage("Du kan ikke reagere på ditt eget svar.");
      return;
    }

    try {
      await addReactionToDocOnce(
        doc(db, "ForumThreads", postId, "Replies", replyId),
        userCharacter.id,
        reaction
      );
    } catch (e: any) {
      if (e?.message === "already-reacted") {
        setMessageType("warning");
        setMessage("Du har allerede reagert på dette svaret.");
      } else {
        console.error(e);
        setMessageType("failure");
        setMessage("Kunne ikke lagre reaksjonen. Prøv igjen.");
      }
    }
  };

  // Helpers to know if user has reacted (hide the "+" in that case) and if user is author (also hide)
  const userId = userCharacter?.id;
  const threadUserReaction: ReactionKey | undefined =
    (userId && thread?.reactionsByUser?.[userId]) || undefined;
  const threadAlreadyReacted = !!threadUserReaction;
  const isThreadAuthor = !!userId && userId === thread?.authorId;

  if (loading) {
    return <p>Laster tråd...</p>;
  }

  if (!thread) {
    return <p>Tråd ikke funnet.</p>;
  }

  return (
    <Main>
      <div className="mb-3">
        <Button
          onClick={() => {
            const params = new URLSearchParams(location.search);
            const cat = params.get("cat") || thread?.categoryId;
            navigate(cat ? `/forum?cat=${cat}` : "/forum");
          }}
        >
          <i className="fa-solid fa-arrow-left mr-2" />
          Tilbake
        </Button>
      </div>

      {message && (
        <InfoBox type={messageType} onClose={() => setMessage("")}>
          {message}
        </InfoBox>
      )}

      <div className="grid grid-cols-[auto_max-content] gap-4 mb-2 lg:mb-4 bg-neutral-900 border p-4 border-neutral-600">
        <div className="flex flex-col">
          <div className="flex justify-between text-sm">
            <small>
              Skrevet{" "}
              {thread.createdAt
                ? timeAgo(
                    typeof thread.createdAt === "string"
                      ? new Date(thread.createdAt)
                      : thread.createdAt.toDate()
                  )
                : "Sending..."}{" "}
              siden
              {thread.editedAt && (
                <> • Redigert {timeAgo(thread.editedAt.toDate())} siden</>
              )}
            </small>
          </div>

          {!editing ? (
            <div className="flex flex-1 flex-col">
              <div className="flex justify-between">
                <div className="flex gap-2 items-center mb-2">
                  {(thread.isSticky || thread.isClosed) && (
                    <div className="flex gap-1">
                      {thread.isSticky && <Label type="pinned" />}
                      {thread.isClosed && <Label type="closed" />}
                    </div>
                  )}
                  <h2 className="font-medium text-white text-xl sm:text-2xl">
                    {thread.title}
                  </h2>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {isAuthor && !editing && !thread.isClosed && (
                    <Button
                      onClick={startEditing}
                      size="small-square"
                      style="secondary"
                      title="Rediger tråd"
                    >
                      <i className="fa-solid fa-pen" />
                    </Button>
                  )}
                  {isAuthor && !editing && !isStaff && (
                    <Button
                      onClick={deleteThread}
                      size="small-square"
                      style="danger"
                      disabled={deleting}
                      title="Slett tråd"
                    >
                      <i className="fa-solid fa-trash" />
                    </Button>
                  )}
                  {isStaff && (
                    <>
                      <Button
                        onClick={toggleSticky}
                        size="small-square"
                        // give a subtle visual toggle as well
                        style="helpActive"
                        title={thread?.isSticky ? "Løsne tråd" : "Fest tråd"}
                      >
                        {/* different icon when toggled on */}
                        <i
                          className={`fa-solid ${
                            thread?.isSticky
                              ? "fa-thumbtack-slash"
                              : "fa-thumbtack"
                          }`}
                        />
                      </Button>

                      <Button
                        onClick={toggleClosed}
                        size="small-square"
                        style="helpActive"
                        title={thread?.isClosed ? "Åpne tråd" : "Steng tråd"}
                      >
                        {/* lock when closed, unlock when open */}
                        <i
                          className={`fa-solid ${
                            thread?.isClosed ? "fa-unlock" : "fa-lock"
                          }`}
                        />
                      </Button>

                      <Button
                        onClick={deleteThread}
                        size="small-square"
                        style="helpActive"
                        disabled={deleting}
                        title="Slett tråd"
                      >
                        <i className="fa-solid fa-trash" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Thread content */}
              <div className="pb-4 prose prose-invert max-w-none text-stone-300 ">
                <div
                  dangerouslySetInnerHTML={{
                    __html: bbcodeToHtml((thread.content ?? "").toString()),
                  }}
                />
              </div>

              {/* Reactions: counts (hide 0) + chosen highlight + conditionally show "+" */}
              <div className="flex flex-1 items-end text-neutral-200 font-medium">
                {thread.reactions && (
                  <div className="flex items-center text-sm text-neutral-300">
                    <ReactionChip
                      icon="👍"
                      label="Liker"
                      count={thread.reactions?.like}
                      highlight={threadUserReaction === "like"}
                    />
                    <ReactionChip
                      icon="👎"
                      label="Misliker"
                      count={thread.reactions?.dislike}
                      highlight={threadUserReaction === "dislike"}
                    />
                    <ReactionChip
                      icon="❤️"
                      label="Hjerte"
                      count={thread.reactions?.heart}
                      highlight={threadUserReaction === "heart"}
                    />
                    <ReactionChip
                      icon="🔥"
                      label="Flamme"
                      count={thread.reactions?.fire}
                      highlight={threadUserReaction === "fire"}
                    />
                    <ReactionChip
                      icon="💩"
                      label="Dritt"
                      count={thread.reactions?.poop}
                      highlight={threadUserReaction === "poop"}
                    />
                  </div>
                )}

                {/* Hide plus if already reacted OR if user is the author */}
                {!threadAlreadyReacted && !isThreadAuthor && (
                  <ReactionMenu onReact={(r) => addReactionToThread(r)} />
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 my-2">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={MAX_TITLE}
                spellCheck={false}
                className="bg-transparent border-b border-neutral-600 py-1 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
                placeholder="Emne (minst 3 tegn)"
              />
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                maxLength={MAX_CONTENT}
                rows={8}
                spellCheck={false}
                className="bg-neutral-900 text-white placeholder-neutral-400 resize-none p-1"
                placeholder="Innhold (minst 10 tegn)"
              />
              <div className="flex flex-wrap gap-1">
                <Button size="small" onClick={saveEdit} disabled={saving}>
                  {saving ? "Lagrer…" : "Lagre"}
                </Button>
                <Button size="small" onClick={cancelEditing} style="secondary">
                  Avbryt
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Author data (thread author) */}
        <div className="flex flex-col items-center text-center">
          <Link to={`/profil/${thread.authorId}`}>
            <img
              src={author?.img || defaultImg}
              alt={`${thread.authorName}'s avatar`}
              className="w-[80px] h-[80px] md:w-28 md:h-28 mb-2 object-cover"
            />
          </Link>

          <p className="text-sm">
            <Username
              character={{ id: thread.authorId, username: thread.authorName }}
            />
          </p>
          {author?.familyId ? (
            <p className="text-sm">
              <Familyname
                family={{ id: author.familyId, name: author.familyName }}
              />
            </p>
          ) : (
            <p className="text-sm">Ingen familie</p>
          )}
        </div>
      </div>

      {/* Display replies */}
      <div className="mb-2 lg:mb-4">
        {replies.map((reply) => {
          const isOwnReply =
            !!userCharacter && reply.authorId === userCharacter.id;
          const isEditingThis = editingReplyId === reply.id;

          const replyUserReaction: ReactionKey | undefined =
            (userId && reply.reactionsByUser?.[userId]) || undefined;
          const replyAlreadyReacted = !!replyUserReaction;

          return (
            <div
              key={reply.id}
              className="grid grid-cols-[auto_max-content] gap-4 bg-neutral-900 border border-neutral-600 px-4 pt-2 pb-4 mb-2"
            >
              {/* Left: reply content */}
              <div className="flex flex-col">
                {/* Header-linje med tidspunkt + Endre-knapp */}
                <div className="text-sm flex justify-between items-start mb-2">
                  <div className="flex gap-2 items-center flex-wrap">
                    <p>
                      <small>
                        Skrevet{" "}
                        {reply.createdAt && (reply as any).createdAt?.toDate
                          ? timeAgo((reply as any).createdAt.toDate())
                          : "Sender..."}{" "}
                        siden
                        {reply.editedAt && (reply as any).editedAt?.toDate && (
                          <>
                            {" "}
                            • Redigert{" "}
                            {timeAgo((reply as any).editedAt.toDate())} siden
                          </>
                        )}
                      </small>
                    </p>
                  </div>

                  <div className="flex gap-1">
                    {isOwnReply && !isEditingThis && !thread.isClosed && (
                      <Button
                        size="small-square"
                        style="secondary"
                        onClick={() => startEditReply(reply)}
                        title="Rediger svar"
                      >
                        <i className="fa-solid fa-pen" />
                      </Button>
                    )}

                    {/* NEW: Author delete (and optionally allow staff too) */}
                    {(isOwnReply || isStaff) && !isEditingThis && (
                      <Button
                        size="small-square"
                        style="danger"
                        onClick={() => deleteReply(reply.id)}
                        title="Slett svar"
                      >
                        <i className="fa-solid fa-trash" />
                      </Button>
                    )}

                    {/* NEW: Staff censor/uncensor */}
                    {isStaff && (
                      <Button
                        size="small-square"
                        style="helpActive"
                        onClick={() => toggleCensorReply(reply.id)}
                        title={reply.censored ? "Fjern sensur" : "Sensurer"}
                      >
                        <i
                          className={`fa-solid ${
                            reply.censored ? "fa-eye" : "fa-eye-slash"
                          }`}
                        />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Innhold / Redigering */}
                {!isEditingThis ? (
                  <div className="flex flex-col flex-1">
                    <div className="pb-4 prose prose-invert max-w-none text-stone-300">
                      {reply.censored ? (
                        <InfoBox type="warning">
                          Dette svaret er sensurert av staben
                          {reply.censoredAt?.toDate && (
                            <> ({timeAgo(reply.censoredAt.toDate())} siden)</>
                          )}
                          .{/* Optional: reason */}{" "}
                          {reply.censoredReason && (
                            <> Årsak: {reply.censoredReason}</>
                          )}
                        </InfoBox>
                      ) : reply.deleted ? (
                        <i className="text-neutral-400">[slettet]</i>
                      ) : (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: bbcodeToHtml(
                              (reply.content ?? "").toString()
                            ),
                          }}
                        />
                      )}
                    </div>

                    {/* Reactions */}
                    {!reply.censored && !reply.deleted && (
                      <div className="flex flex-1 items-end text-neutral-200 font-medium">
                        {reply.reactions && (
                          <div className="flex items-center text-sm text-neutral-300">
                            <ReactionChip
                              icon="👍"
                              label="Liker"
                              count={reply.reactions?.like}
                              highlight={replyUserReaction === "like"}
                            />
                            <ReactionChip
                              icon="👎"
                              label="Misliker"
                              count={reply.reactions?.dislike}
                              highlight={replyUserReaction === "dislike"}
                            />
                            <ReactionChip
                              icon="❤️"
                              label="Hjerte"
                              count={reply.reactions?.heart}
                              highlight={replyUserReaction === "heart"}
                            />
                            <ReactionChip
                              icon="🔥"
                              label="Flamme"
                              count={reply.reactions?.fire}
                              highlight={replyUserReaction === "fire"}
                            />
                            <ReactionChip
                              icon="💩"
                              label="Dritt"
                              count={reply.reactions?.poop}
                              highlight={replyUserReaction === "poop"}
                            />
                          </div>
                        )}

                        {!replyAlreadyReacted && !isOwnReply && (
                          <ReactionMenu
                            onReact={(r) => addReactionToReply(reply.id, r)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 my-2">
                    <textarea
                      value={editReplyContent}
                      onChange={(e) => setEditReplyContent(e.target.value)}
                      maxLength={MAX_CONTENT}
                      rows={6}
                      spellCheck={false}
                      className="bg-transparent text-white placeholder-neutral-400 w-full resize-none"
                      placeholder="Svar"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="small"
                        onClick={() => saveEditReply(reply.id)}
                        disabled={savingReplyId === reply.id}
                      >
                        {savingReplyId === reply.id ? "Lagrer…" : "Lagre"}
                      </Button>
                      <Button
                        size="small"
                        onClick={cancelEditReply}
                        style="secondary"
                      >
                        Avbryt
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: reply author card */}
              <ReplyAuthorCard
                authorId={reply.authorId}
                authorName={reply.authorName}
              />
            </div>
          );
        })}
      </div>

      {/* Form to reply */}
      {!thread.isClosed && (
        <>
          <H2>Svar</H2>
          <form
            action=""
            onSubmit={handleSubmit}
            className="flex flex-col gap-2"
          >
            <textarea
              className="bg-neutral-900 border border-neutral-600 py-2 px-4 text-white placeholder-neutral-400 w-full resize-none"
              name="reply"
              id="reply"
              rows={6}
              spellCheck={false}
              onChange={handleReplyChange}
              value={newReply}
            ></textarea>
            <div>
              <Button type="submit">Post</Button>
            </div>
          </form>
        </>
      )}
    </Main>
  );
};

export default ForumThread;
