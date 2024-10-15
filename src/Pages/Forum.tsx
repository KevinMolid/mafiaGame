import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
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
  const [threads, setThreads] = useState<any[]>([]);
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
    };

    fetchCategories();
  }, []);

  const fetchThreads = async (categoryId: string) => {
    const querySnapshot = await getDocs(
      query(
        collection(db, "ForumThreads"),
        where("categoryId", "==", categoryId)
      )
    );
    const fetchedThreads: any[] = [];
    querySnapshot.forEach((doc) => {
      fetchedThreads.push({ id: doc.id, ...doc.data() });
    });
    setThreads(fetchedThreads);
    setSelectedCategory(categoryId);
  };

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

    // Add new thread to Firestore
    await addDoc(collection(db, "ForumThreads"), newThread);

    // Update local state
    setThreads((prev) => [...prev, newThread]);
    setNewThreadTitle("");
    setNewThreadContent("");
  };

  const handleThreadClick = (threadId: string) => {
    navigate(`/forum/thread/${threadId}`);
  };

  if (loading) {
    return <p>Loading categories...</p>;
  }

  return (
    <section>
      <H1>Forum</H1>
      <p>
        Welcome to the Mafia Reign forum! Discuss, share, and strategize with
        other players.
      </p>

      {/* Categories Section */}
      <div>
        <H2>Forum Categories</H2>
        <ul>
          {categories.length > 0 ? (
            categories.map((category) => (
              <li key={category.id}>
                <p
                  className="hover:text-neutral-200 font-medium cursor-pointer"
                  onClick={() => fetchThreads(category.id)}
                >
                  {category.title}
                </p>
                <p>{category.description}</p>
              </li>
            ))
          ) : (
            <p>No categories found.</p>
          )}
        </ul>
      </div>

      {/* Threads Section */}
      {selectedCategory && (
        <div>
          <H2>Threads in Selected Category</H2>
          <ul className="mb-4">
            {threads.length > 0 ? (
              threads.map((thread) => (
                <li
                  className="border border-neutral-700 px-4 py-1 hover:cursor-pointer"
                  key={thread.id || "new"}
                  onClick={() => handleThreadClick(thread.id)}
                >
                  <p className="text-stone-200 font-bold text-lg">
                    {thread.title}
                  </p>
                  <small>
                    By{" "}
                    <Username
                      character={{
                        id: thread.authorId,
                        username: thread.authorName,
                      }}
                    ></Username>{" "}
                    {thread.createdAt
                      ? format(thread.createdAt.toDate(), "dd.MM.yyyy - HH:mm")
                      : "Sending..."}
                  </small>
                </li>
              ))
            ) : (
              <p>No threads found in this category.</p>
            )}
          </ul>

          {/* New Thread Form */}
          <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
            <H3>Create a New Thread</H3>
            <input
              type="text"
              placeholder="Thread Title"
              value={newThreadTitle}
              onChange={(e) => setNewThreadTitle(e.target.value)}
              className="bg-neutral-700 py-2 px-4 text-white placeholder-neutral-400 w-full"
              required
            />
            <textarea
              placeholder="Thread Content"
              value={newThreadContent}
              onChange={(e) => setNewThreadContent(e.target.value)}
              className="bg-neutral-700 py-2 px-4 text-white placeholder-neutral-400 w-full"
              required
            />

            <div>
              {" "}
              <Button type="submit">Create Thread</Button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};

export default Forum;
