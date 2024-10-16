import H1 from "../components/Typography/H1";
import H3 from "../components/Typography/H3";
import Username from "../components/Typography/Username";
import Button from "../components/Button";

import { useCharacter } from "../CharacterContext";

import { format } from "date-fns";

// React
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

const Forum = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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
      authorId: String;
      authorName: string;
      createdAt: Timestamp;
    };
  }>({});

  const [creatingNew, setCreatingNew] = useState<boolean>(false);
  const [newThreadTitle, setNewThreadTitle] = useState<string>("");
  const [newThreadContent, setNewThreadContent] = useState<string>("");

  const { character } = useCharacter();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "ForumCategories"));
      const fetchedCategories: any[] = [];
      querySnapshot.forEach((doc) => {
        fetchedCategories.push({ id: doc.id, ...doc.data() });
      });
      setCategories(fetchedCategories);
      setLoading(false);

      // Automatically select "General Discussion" after categories are fetched
      const generalDiscussion = fetchedCategories.find(
        (category) => category.title === "General Discussion"
      );
      if (generalDiscussion) {
        fetchThreads(
          generalDiscussion.id,
          generalDiscussion.title,
          generalDiscussion.description
        );
      }
    };

    fetchCategories();
  }, []);

  const fetchThreads = async (
    categoryId: string,
    categoryTitle: string,
    categoryDescription: string
  ) => {
    const querySnapshot = await getDocs(
      query(
        collection(db, "ForumThreads"),
        where("categoryId", "==", categoryId),
        orderBy("createdAt", "desc")
      )
    );
    const fetchedThreads: any[] = [];
    querySnapshot.forEach((doc) => {
      fetchedThreads.push({ id: doc.id, ...doc.data() });
    });
    setThreads(fetchedThreads);
    setSelectedCategory(categoryId);
    setSelectedCategoryTitle(categoryTitle);
    setSelectedCategoryDescription(categoryDescription);

    // Fetch replies count and last reply for each thread
    const repliesCountObj: { [key: string]: number } = {};
    const lastRepliesObj: {
      [key: string]: {
        authorId: String;
        authorName: string;
        createdAt: Timestamp;
      };
    } = {};

    for (const thread of fetchedThreads) {
      const repliesSnapshot = await getDocs(
        collection(db, "ForumThreads", thread.id, "Replies")
      );
      repliesCountObj[thread.id] = repliesSnapshot.size;
    }
    setRepliesCount(repliesCountObj);

    for (const thread of fetchedThreads) {
      const repliesSnapshot = await getDocs(
        collection(db, "ForumThreads", thread.id, "Replies")
      );
      repliesCountObj[thread.id] = repliesSnapshot.size;

      // Fetch the last reply (if it exists)
      const lastReplySnapshot = await getDocs(
        query(
          collection(db, "ForumThreads", thread.id, "Replies"),
          orderBy("createdAt", "desc"),
          limit(1)
        )
      );
      if (!lastReplySnapshot.empty) {
        const lastReply = lastReplySnapshot.docs[0].data();
        lastRepliesObj[thread.id] = {
          authorId: lastReply.authorId,
          authorName: lastReply.authorName,
          createdAt: lastReply.createdAt,
        };
      }
    }
    setRepliesCount(repliesCountObj);
    setLastReplies(lastRepliesObj);
  };

  // Handle submision of new forum post
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadTitle || !newThreadContent) return;

    const newThread = {
      title: newThreadTitle,
      content: newThreadContent,
      categoryId: selectedCategory,
      createdAt: new Date().toISOString(),
      authorId: character?.id,
      authorName: character?.username,
    };

    try {
      const docRef = await addDoc(collection(db, "ForumThreads"), newThread);

      setThreads((prev) => [...prev, { ...newThread, id: docRef.id }]);

      setNewThreadTitle("");
      setNewThreadContent("");
      setCreatingNew(false);
    } catch (error) {
      console.error("Error creating thread: ", error);
    }
  };

  const handleThreadClick = (threadId: string) => {
    navigate(`/forum/thread/${threadId}`);
  };

  if (loading) {
    return <p>Loading categories...</p>;
  }

  return (
    <section>
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
                  fetchThreads(
                    category.id,
                    category.title,
                    category.description
                  )
                }
              >
                <p className="text-neutral-200 font-medium">{category.title}</p>
              </li>
            ))
          ) : (
            <p>No categories found.</p>
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
                <Button onClick={() => setCreatingNew(true)}>
                  <i className="fa-solid fa-plus mr-1"></i> New Post
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
                          <strong>{repliesCount[thread.id]} replies</strong>
                        </small>
                      )}

                      {lastReplies[thread.id] && (
                        <small>
                          Last reply by{" "}
                          <Username
                            character={{
                              id: lastReplies[thread.id].authorId,
                              username: lastReplies[thread.id].authorName,
                            }}
                          />{" "}
                          {" at "}
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
                <p>No threads found in this category.</p>
              )}
            </ul>
          )}

          {/* New Thread Form */}
          {creatingNew && (
            <form className="flex flex-col gap-2 mt-4" onSubmit={handleSubmit}>
              <div className="flex justify-between items-center">
                <H3>Create a New Thread</H3>
                <div>
                  {" "}
                  <button
                    className="flex justify-center items-center gap-1  hover:text-neutral-200 px-2 py-1"
                    onClick={() => setCreatingNew(false)}
                  >
                    <i className="fa-solid fa-xmark"></i> Cancel Thread
                  </button>
                </div>
              </div>
              <input
                type="text"
                placeholder="Title"
                value={newThreadTitle}
                onChange={(e) => setNewThreadTitle(e.target.value)}
                className="bg-neutral-700 py-2 px-4 text-white placeholder-neutral-400 w-full"
                required
              />
              <textarea
                placeholder="Content"
                rows={8}
                value={newThreadContent}
                onChange={(e) => setNewThreadContent(e.target.value)}
                className="bg-neutral-700 py-2 px-4 text-white placeholder-neutral-400 w-full resize-none"
                required
              />

              <div>
                {" "}
                <Button type="submit">Create Thread</Button>
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  );
};

export default Forum;
