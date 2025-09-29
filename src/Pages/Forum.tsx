// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H3 from "../components/Typography/H3";
import Username from "../components/Typography/Username";
import Button from "../components/Button";
import InfoBox from "../components/InfoBox";

import { useCharacter } from "../CharacterContext";

import { format } from "date-fns";

// React
import { useEffect, useRef, useState } from "react";
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

const Forum = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedCategory, setSelectedCategory] = useState<string | null>("");
  const [selectedCategoryTitle, setSelectedCategoryTitle] =
    useState<string>("");
  const [selectedCategoryDescription, setSelectedCategoryDescription] =
    useState<string>("");

  const [threads, setThreads] = useState<any[]>([]);
  const [repliesCount, setRepliesCount] = useState<{ [key: string]: number }>(
    {}
  );
  const [lastReplies, setLastReplies] = useState<{
    [key: string]: {
      authorId: string;
      authorName: string;
      createdAt: Timestamp;
    };
  }>({});

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

  // Når categories eller ?cat endres, velg riktig fane
  useEffect(() => {
    if (!categories.length) return;

    const params = new URLSearchParams(location.search);
    const catId = params.get("cat");

    // bruk ?cat hvis gyldig, ellers "Generelt", ellers første
    const chosen =
      (catId && categories.find((c) => c.id === catId)) ||
      categories.find((c) => c.title === "Generelt") ||
      categories[0];

    if (!chosen) return;

    // unngå unødvendig refetch hvis samme kategori allerede er valgt
    if (selectedCategory === chosen.id) return;

    fetchThreads(chosen.id, chosen.title, chosen.description);
  }, [categories, location.search]); // <- viktig

  const fetchThreads = async (
    categoryId: string,
    categoryTitle: string,
    categoryDescription: string
  ) => {
    const myFetchId = ++fetchIdRef.current;

    // hent tråder
    const qThreads = query(
      collection(db, "ForumThreads"),
      where("categoryId", "==", categoryId),
      orderBy("createdAt", "desc")
    );
    const thSnap = await getDocs(qThreads);

    // bygg lokal liste
    const fetchedThreads: any[] = [];
    thSnap.forEach((d) => fetchedThreads.push({ id: d.id, ...d.data() }));

    // hent stats for hver tråd parallelt (count + siste svar)
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
          last: lastSnap.empty ? null : lastSnap.docs[0].data(),
        };
      })
    );

    // hvis en nyere fetch har startet, dropp resultatet
    if (myFetchId !== fetchIdRef.current) return;

    // bygg objekter for state
    const repliesCountObj: Record<string, number> = {};
    const lastRepliesObj: Record<
      string,
      { authorId: string; authorName: string; createdAt: Timestamp }
    > = {};

    for (const s of stats) {
      repliesCountObj[s.id] = s.count;
      if (s.last) {
        const { authorId, authorName, createdAt } = s.last as any;
        if (authorId && authorName && createdAt) {
          lastRepliesObj[s.id] = { authorId, authorName, createdAt };
        }
      }
    }

    // sett alt atomisk (i riktig rekkefølge)
    setThreads(fetchedThreads);
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

      // focus the first invalid field
      if (!selectedCategory) {
        // nothing to focus here; next checks:
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
      createdAt: new Date().toISOString(), // keep your existing format
      authorId: userCharacter?.id,
      authorName: userCharacter?.username,
    };

    try {
      const docRef = await addDoc(collection(db, "ForumThreads"), newThread);

      setThreads((prev) => [{ ...newThread, id: docRef.id }, ...prev]); // show on top
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

  // Validate new thread
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
    navigate(`/forum/post/${threadId}?cat=${selectedCategory}`);
  };

  if (loading) {
    return <p>Laster kategorier...</p>;
  }

  return (
    <Main>
      {/* Categories Section */}
      <div>
        <ul className="mb-8 flex">
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
                  navigate(`/forum?cat=${category.id}`, { replace: true })
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

          {/* Threads */}
          {!creatingNew && (
            <ul className="mt-2 mb-4">
              {threads.length > 0 ? (
                threads.map((thread) => (
                  <li
                    className="border-b border-neutral-700 pt-4 pb-2"
                    key={thread.id || "new"}
                  >
                    <div className="grid grid-cols-[auto_max-content]">
                      <small>
                        <Username
                          character={{
                            id: thread.authorId,
                            username: thread.authorName,
                          }}
                        ></Username>{" "}
                      </small>
                      <small>
                        <i className="fa-regular fa-clock"></i>{" "}
                        {thread.createdAt
                          ? format(
                              typeof thread.createdAt === "string"
                                ? new Date(thread.createdAt)
                                : thread.createdAt.toDate(),
                              "dd.MM.yyyy - HH:mm"
                            )
                          : "Sending..."}
                      </small>
                    </div>

                    <p
                      className="text-stone-200 font-bold text-lg hover:underline cursor-pointer"
                      onClick={() => handleThreadClick(thread.id)}
                    >
                      {thread.title}
                    </p>
                    <div className="flex gap-2">
                      {repliesCount[thread.id] > 0 && (
                        <small>
                          <strong>{repliesCount[thread.id]} svar</strong>
                        </small>
                      )}

                      {lastReplies[thread.id] && (
                        <small>
                          Sist besvart av{" "}
                          <Username
                            character={{
                              id: lastReplies[thread.id].authorId,
                              username: lastReplies[thread.id].authorName,
                            }}
                          />{" "}
                          {lastReplies[thread.id]?.createdAt
                            ? format(
                                lastReplies[thread.id].createdAt.toDate(),
                                "dd.MM.yyyy - HH:mm"
                              )
                            : "No replies"}
                        </small>
                      )}
                    </div>
                  </li>
                ))
              ) : (
                <p>Det er ingen tråder i denne kategorien.</p>
              )}
            </ul>
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
                onChange={(e) => setNewThreadContent(e.target.value)}
                className="bg-neutral-900 py-2 border border-neutral-600 px-4 text-white placeholder-neutral-400 w-full resize-none"
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
