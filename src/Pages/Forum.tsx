// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H3 from "../components/Typography/H3";
import Username from "../components/Typography/Username";
import Button from "../components/Button";
import Label from "../components/Label";
import InfoBox from "../components/InfoBox";

import { useCharacter } from "../CharacterContext";

import timeAgo from "../Functions/TimeFunctions";

// React
import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../firebaseConfig";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const MAX_TITLE = 120;
export const MAX_CONTENT = 10_000;

type ThreadDoc = {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  createdAt: string | Timestamp;
  authorId: string;
  authorName: string;
  isSticky?: boolean;
  isClosed?: boolean;
};

type LastReply = {
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
};

const PAGE_SIZE = 10;

const Forum = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedCategory, setSelectedCategory] = useState<string | null>("");
  const [selectedCategoryTitle, setSelectedCategoryTitle] =
    useState<string>("");
  const [selectedCategoryDescription, setSelectedCategoryDescription] =
    useState<string>("");

  const [threads, setThreads] = useState<ThreadDoc[]>([]);
  const [repliesCount, setRepliesCount] = useState<Record<string, number>>({});
  const [lastReplies, setLastReplies] = useState<Record<string, LastReply>>({});

  const [creatingNew, setCreatingNew] = useState<boolean>(false);
  const [newThreadTitle, setNewThreadTitle] = useState<string>("");
  const [newThreadContent, setNewThreadContent] = useState<string>("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "important" | "warning" | "info"
  >("success");

  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const { userCharacter } = useCharacter();
  const navigate = useNavigate();
  const location = useLocation();
  const fetchIdRef = useRef(0);

  // current page from query (defaults to 1)
  const currentPage = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const p = parseInt(params.get("page") || "1", 10);
    return Number.isFinite(p) && p > 0 ? p : 1;
  }, [location.search]);

  const isInsideInteractive = (el: EventTarget | null) =>
    el instanceof HTMLElement && !!el.closest("a,button");

  /* Fetch Forum Categories */
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "ForumCategories"));
      const fetched: any[] = [];
      querySnapshot.forEach((doc) =>
        fetched.push({ id: doc.id, ...doc.data() })
      );
      setCategories(fetched);
      setLoading(false);
    };
    fetchCategories();
  }, []);

  // pick category based on ?cat (else “Generelt”, else first)
  useEffect(() => {
    if (!categories.length) return;

    const params = new URLSearchParams(location.search);
    const catId = params.get("cat");

    const chosen =
      (catId && categories.find((c) => c.id === catId)) ||
      categories.find((c) => c.title === "Generelt") ||
      categories[0];

    if (!chosen) return;

    if (selectedCategory === chosen.id) return;

    // when switching category, normalize to page 1
    const newParams = new URLSearchParams(location.search);
    newParams.set("cat", chosen.id);
    newParams.set("page", "1");
    navigate(`/forum?${newParams.toString()}`, { replace: true });

    fetchThreads(chosen.id, chosen.title, chosen.description);
  }, [categories, location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  const getMs = (t: string | Timestamp | Date): number => {
    if (!t) return 0;
    if (t instanceof Timestamp) return t.toDate().getTime();
    if (t instanceof Date) return t.getTime();
    if (typeof t === "string") return new Date(t).getTime();
    return 0;
  };

  const fetchThreads = async (
    categoryId: string,
    categoryTitle: string,
    categoryDescription: string
  ) => {
    const myFetchId = ++fetchIdRef.current;

    const qThreads = query(
      collection(db, "ForumThreads"),
      where("categoryId", "==", categoryId),
      orderBy("createdAt", "desc")
    );
    const thSnap = await getDocs(qThreads);

    const fetchedThreads: ThreadDoc[] = [];
    thSnap.forEach((d) =>
      fetchedThreads.push({ id: d.id, ...(d.data() as any) })
    );

    // fetch stats (count + last reply)
    const stats = await Promise.all(
      fetchedThreads.map(async (t) => {
        const repliesRef = collection(db, "ForumThreads", t.id, "Replies");
        const [allSnap, lastSnap] = await Promise.all([
          getDocs(repliesRef),
          getDocs(query(repliesRef, orderBy("createdAt", "desc"), limit(1))),
        ]);

        return {
          id: t.id,
          count: allSnap.size,
          last: lastSnap.empty ? null : (lastSnap.docs[0].data() as LastReply),
        };
      })
    );

    if (myFetchId !== fetchIdRef.current) return;

    const repliesCountObj: Record<string, number> = {};
    const lastRepliesObj: Record<string, LastReply> = {};

    for (const s of stats) {
      repliesCountObj[s.id] = s.count;
      if (s.last) lastRepliesObj[s.id] = s.last;
    }

    // sort threads by last activity (last reply time OR createdAt)
    const sorted = [...fetchedThreads].sort((a, b) => {
      const aSticky = !!a.isSticky ? 1 : 0;
      const bSticky = !!b.isSticky ? 1 : 0;
      if (aSticky !== bSticky) return bSticky - aSticky; // pinned first

      const aLast = lastRepliesObj[a.id]
        ? getMs(lastRepliesObj[a.id].createdAt)
        : getMs(a.createdAt);
      const bLast = lastRepliesObj[b.id]
        ? getMs(lastRepliesObj[b.id].createdAt)
        : getMs(b.createdAt);

      return bLast - aLast; // newest activity first inside each group
    });

    setThreads(sorted);
    setSelectedCategory(categoryId);
    setSelectedCategoryTitle(categoryTitle);
    setSelectedCategoryDescription(categoryDescription);
    setRepliesCount(repliesCountObj);
    setLastReplies(lastRepliesObj);
  };

  // Handle submission of new forum post
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateNew();
    if (errors.length) {
      setMessage(errors.join(" "));
      setMessageType("warning");
      if (!selectedCategory) {
        if (newThreadTitle.trim().length < 3) titleRef.current?.focus();
        else contentRef.current?.focus();
      } else if (newThreadTitle.trim().length < 3) {
        titleRef.current?.focus();
      } else {
        contentRef.current?.focus();
      }
      return;
    }

    const newThread = {
      title: newThreadTitle.trim(),
      content: newThreadContent.trim(),
      categoryId: selectedCategory,
      createdAt: new Date().toISOString(),
      authorId: userCharacter?.id,
      authorName: userCharacter?.username,
    };

    try {
      const docRef = await addDoc(collection(db, "ForumThreads"), newThread);
      // optimistically insert; it’ll get resorted on next fetch if needed
      setThreads((prev) => [
        { ...newThread, id: docRef.id } as ThreadDoc,
        ...prev,
      ]);
      setMessage("Tråden ble opprettet.");
      setMessageType("success");

      setNewThreadTitle("");
      setNewThreadContent("");
      setCreatingNew(false);
    } catch (error) {
      console.error("Feil ved opprettelse av tråd: ", error);
      setMessage("Noe gikk galt ved opprettelse av tråd. Prøv igjen.");
      setMessageType("failure");
    }
  };

  const validateNew = () => {
    const errs: string[] = [];
    if (!selectedCategory) errs.push("Velg en kategori.");
    if (newThreadTitle.trim().length < 3) errs.push("Emne må ha minst 3 tegn.");
    if (newThreadTitle.length > MAX_TITLE) errs.push("Emne er for langt.");
    if (newThreadContent.trim().length < 10)
      errs.push("Innhold må ha minst 10 tegn.");
    if (newThreadContent.length > MAX_CONTENT)
      errs.push("Innhold er for langt.");
    return errs;
  };

  const handleCancelNew = () => {
    setCreatingNew(false);
    setMessage("");
    setNewThreadTitle("");
    setNewThreadContent("");
  };

  const handleThreadClick = (threadId: string) => {
    const params = new URLSearchParams(location.search);
    const cat = params.get("cat") || selectedCategory || "";
    navigate(`/forum/post/${threadId}?cat=${cat}`);
  };

  // Pagination — derive visible slice
  const totalPages = Math.max(1, Math.ceil(threads.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const visibleThreads = threads.slice(startIdx, startIdx + PAGE_SIZE);

  const goToPage = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages);
    const params = new URLSearchParams(location.search);
    if (selectedCategory) params.set("cat", selectedCategory);
    params.set("page", String(next));
    navigate(`/forum?${params.toString()}`, { replace: true });
  };

  // helper to build a 100-char preview from content
  const buildPreview = (s: string) => {
    const clean = (s || "").replace(/\s+/g, " ").trim();
    return clean.length > 100 ? clean.slice(0, 100) + "…" : clean;
  };

  if (loading) {
    return <p>Laster kategorier...</p>;
  }

  return (
    <Main>
      {/* Categories Section */}
      <div>
        <ul className="mb-8 flex flex-wrap">
          {categories.length > 0 ? (
            categories.map((category) => (
              <li
                key={category.id}
                className={
                  " hover:bg-neutral-800 px-4 py-2 max-w-44 border-b-2 border-neutral-700 cursor-pointer " +
                  (selectedCategoryTitle === category.title &&
                    "bg-neutral-800 border-white")
                }
                onClick={() =>
                  navigate(`/forum?cat=${category.id}&page=1`, {
                    replace: true,
                  })
                }
              >
                <p className="text-neutral-200 font-medium">{category.title}</p>
              </li>
            ))
          ) : (
            <p>Ingen kategorier funnet.</p>
          )}
        </ul>
      </div>

      {/* Category Section */}
      {selectedCategory && (
        <div>
          <div className="flex justify-between">
            <H1>{selectedCategoryTitle}</H1>
            {!creatingNew && (
              <div>
                <Button
                  onClick={() => {
                    setCreatingNew(true);
                    setMessage("");
                  }}
                >
                  <i className="fa-solid fa-plus mr-1"></i> Ny tråd
                </Button>
              </div>
            )}
          </div>
          <p>{selectedCategoryDescription}</p>

          {/* Pagination header */}
          {threads.length > PAGE_SIZE && !creatingNew && (
            <div className="bg-neutral-900 p-4 flex gap-3 items-center flex-wrap mt-3">
              <button
                className="hover:underline disabled:opacity-40"
                onClick={() => goToPage(safePage - 1)}
                disabled={safePage <= 1}
              >
                Forrige
              </button>
              <ul className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <li key={p}>
                      <button
                        className={
                          "px-2 py-1 rounded " +
                          (p === safePage
                            ? "bg-neutral-800 text-white"
                            : "hover:bg-neutral-800")
                        }
                        onClick={() => goToPage(p)}
                      >
                        {p}
                      </button>
                    </li>
                  )
                )}
              </ul>
              <button
                className="hover:underline disabled:opacity-40"
                onClick={() => goToPage(safePage + 1)}
                disabled={safePage >= totalPages}
              >
                Neste
              </button>
              <p className="ml-auto">
                Side {safePage} av {totalPages}
              </p>
            </div>
          )}

          {/* Threads */}
          {!creatingNew && (
            <ul className="mt-2 mb-4">
              {visibleThreads.length > 0 ? (
                visibleThreads.map((thread) => {
                  const hasReplies = repliesCount[thread.id] > 0;
                  const last = lastReplies[thread.id];
                  const createdAtMs =
                    typeof thread.createdAt === "string"
                      ? new Date(thread.createdAt).getTime()
                      : (thread.createdAt as Timestamp).toDate().getTime();

                  // whole <li> clickable + keyboard accessible
                  const onKey = (e: React.KeyboardEvent<HTMLLIElement>) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleThreadClick(thread.id);
                    }
                  };

                  return (
                    <li
                      key={thread.id}
                      className="border-b border-neutral-700 pt-4 pb-3 cursor-pointer hover:bg-neutral-800/40 focus:bg-neutral-800/40 outline-none"
                      onClick={(e) => {
                        if (isInsideInteractive(e.target)) return; // let <a> clicks work (Username)
                        handleThreadClick(thread.id);
                      }}
                      tabIndex={0}
                      onKeyDown={onKey}
                      role="button"
                      aria-label={`Åpne tråd: ${thread.title}`}
                    >
                      {/* Title + Labels */}
                      <div className="flex items-center gap-2">
                        {(thread.isSticky || thread.isClosed) && (
                          <div className="flex gap-1">
                            {thread.isSticky && <Label type="pinned" />}
                            {thread.isClosed && <Label type="closed" />}
                          </div>
                        )}
                        <p className="text-white font-bold text-lg underline-offset-2">
                          {thread.title}
                        </p>
                      </div>

                      {/* Started by + time (moved here) */}
                      <div className="text-sm text-stone-400 mt-0.5 mb-1.5">
                        Startet av{" "}
                        <Username
                          character={{
                            id: thread.authorId,
                            username: thread.authorName,
                          }}
                        />{" "}
                        {timeAgo(createdAtMs)} siden
                      </div>

                      {/* 50-char content preview */}
                      <p className="text-stone-300">
                        {buildPreview(thread.content)}
                      </p>

                      {/* Replies info (kept below preview) */}
                      <div className="flex gap-2 mt-1">
                        {hasReplies && (
                          <small>
                            <strong>{repliesCount[thread.id]} svar</strong>
                          </small>
                        )}

                        {last && (
                          <small className="text-stone-400">
                            Sist besvart av{" "}
                            <Username
                              character={{
                                id: last.authorId,
                                username: last.authorName,
                              }}
                            />{" "}
                            {timeAgo(last.createdAt.toDate().getTime())} siden
                          </small>
                        )}
                      </div>
                    </li>
                  );
                })
              ) : (
                <p>Det er ingen tråder i denne kategorien.</p>
              )}
            </ul>
          )}

          {/* Pagination footer */}
          {threads.length > PAGE_SIZE && !creatingNew && (
            <div className="bg-neutral-900 p-4 flex gap-3 items-center flex-wrap">
              <button
                className="hover:underline disabled:opacity-40"
                onClick={() => goToPage(safePage - 1)}
                disabled={safePage <= 1}
              >
                Forrige
              </button>
              <ul className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <li key={p}>
                      <button
                        className={
                          "px-2 py-1 rounded " +
                          (p === safePage
                            ? "bg-neutral-800 text-white"
                            : "hover:bg-neutral-800")
                        }
                        onClick={() => goToPage(p)}
                      >
                        {p}
                      </button>
                    </li>
                  )
                )}
              </ul>
              <button
                className="hover:underline disabled:opacity-40"
                onClick={() => goToPage(safePage + 1)}
                disabled={safePage >= totalPages}
              >
                Neste
              </button>
              <p className="ml-auto">
                Side {safePage} av {totalPages}
              </p>
            </div>
          )}

          {/* New Thread Form */}
          {creatingNew && (
            <form className="flex flex-col gap-2 mt-4" onSubmit={handleSubmit}>
              <div className="flex justify-between items-center">
                <H3>Lag ny tråd</H3>
                <div>
                  <button
                    className="flex justify-center items-center gap-1  hover:text-neutral-200 px-2 py-1"
                    onClick={handleCancelNew}
                    type="button"
                  >
                    <i className="fa-solid fa-xmark"></i> Avbryt
                  </button>
                </div>
              </div>

              {message && <InfoBox type={messageType}>{message}</InfoBox>}

              <input
                ref={titleRef}
                type="text"
                placeholder="Emne"
                value={newThreadTitle}
                spellCheck={false}
                onChange={(e) => setNewThreadTitle(e.target.value)}
                className="bg-transparent border-b border-neutral-600 py-1 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
                maxLength={MAX_TITLE}
              />
              <textarea
                ref={contentRef}
                rows={8}
                value={newThreadContent}
                spellCheck={false}
                placeholder="Innhold (Minst 10 tegn)"
                onChange={(e) => setNewThreadContent(e.target.value)}
                className="bg-transparent text-white placeholder-neutral-400 w-full resize-none"
                maxLength={MAX_CONTENT}
              />

              <div>
                <Button type="submit">Opprett</Button>
              </div>
            </form>
          )}
        </div>
      )}
    </Main>
  );
};

export default Forum;
