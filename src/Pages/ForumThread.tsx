// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import Username from "../components/Typography/Username";
import Button from "../components/Button";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { useCharacter } from "../CharacterContext";

import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../firebaseConfig";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

import { format } from "date-fns";

// Define the type for a thread
interface Thread {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: any;
}

interface Reply {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: any;
}

const ForumThread = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState<any | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState<string>("");
  const { character } = useCharacter();

  useEffect(() => {
    const fetchThread = async () => {
      if (threadId) {
        try {
          const threadDoc = await getDoc(doc(db, "ForumThreads", threadId));
          if (threadDoc.exists()) {
            const threadData = {
              id: threadDoc.id,
              ...threadDoc.data(),
            } as Thread;

            setThread(threadData);

            // Fetch the author's character data
            if (threadData.authorId) {
              const authorDoc = await getDoc(
                doc(db, "Characters", threadData.authorId)
              );
              if (authorDoc.exists()) {
                setAuthor(authorDoc.data()); // Set the author data, which includes the img
              }
            }

            // Fetch replies for the thread
            const repliesQuery = query(
              collection(db, "ForumThreads", threadId, "Replies"),
              orderBy("createdAt", "asc")
            );
            const unsubscribe = onSnapshot(repliesQuery, (snapshot) => {
              const repliesData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              })) as Reply[];
              setReplies(repliesData);
            });

            // Cleanup subscription when component unmounts
            return () => unsubscribe();
          } else {
            console.log("No such thread!");
          }
        } catch (error) {
          console.error("Error fetching thread: ", error);
        } finally {
          // Ensure loading is set to false even if an error occurs
          setLoading(false);
        }
      }
    };
    fetchThread();
  }, [threadId]);

  const handleReplyChange = (e: any) => {
    setNewReply(e.target.value);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const replyContent = e.target.elements.reply.value.trim();

    if (!replyContent) {
      console.log("Reply cannot be empty");
      return;
    }

    if (!threadId) {
      console.error("No thread ID found.");
      return;
    }

    try {
      const replyData = {
        content: newReply,
        authorId: character?.id,
        authorName: character?.username,
        createdAt: serverTimestamp(),
      };

      await addDoc(
        collection(db, "ForumThreads", threadId, "Replies"),
        replyData
      );

      setNewReply("");
    } catch (error) {
      console.error("Error adding reply: ", error);
    }
  };

  if (loading) {
    return <p>Loading thread...</p>;
  }

  if (!thread) {
    return <p>Thread not found.</p>;
  }

  return (
    <Main>
      <div className="grid grid-cols-[2fr_1fr] md:grid-cols-[3fr_1fr] gap-2 md:gap-4 mb-2 md:mb-4">
        <div className="bg-neutral-800 p-2 md:p-4">
          <H1>{thread.title}</H1>
          <p>{thread.content}</p>
        </div>
        <div className="bg-neutral-950 p-2 md:p-4 text-xs">
          {author?.img && (
            <img
              src={author.img}
              alt={`${thread.authorName}'s avatar`}
              className="w-24 h-24 md:w-28 md:h-28 mb-4 border border-neutral-600 object-cover"
            />
          )}
          <p>
            Posted by:{" "}
            <Username
              character={{ id: thread.authorId, username: thread.authorName }}
            />
          </p>

          <p>
            {thread.createdAt
              ? format(
                  typeof thread.createdAt === "string"
                    ? new Date(thread.createdAt)
                    : thread.createdAt.toDate(),
                  "dd.MM.yyyy - HH:mm"
                )
              : "Sending..."}
          </p>
        </div>
      </div>

      {/* Display replies */}
      <div className="mb-4">
        {replies.map((reply) => (
          <div key={reply.id} className="bg-neutral-800 p-2 mb-2">
            <p className="text-xs mb-2">
              By{" "}
              <Username
                character={{ id: reply.authorId, username: reply.authorName }}
              />
              {" - "}
              {reply.createdAt
                ? format(reply.createdAt.toDate(), "dd.MM.yyyy - HH:mm")
                : "Sending..."}
            </p>
            <p>{reply.content}</p>
          </div>
        ))}
      </div>

      {/* Form to reply */}
      <form action="" onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          className="bg-neutral-700 py-2 px-4 text-white placeholder-neutral-400 w-full resize-none"
          name="reply"
          id="reply"
          placeholder="Write here..."
          rows={6}
          onChange={handleReplyChange}
          value={newReply}
        ></textarea>
        <Button type="submit">Reply</Button>
      </form>
    </Main>
  );
};

export default ForumThread;
