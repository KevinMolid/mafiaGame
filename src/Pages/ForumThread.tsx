import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../firebaseConfig";

import H1 from "../components/Typography/H1";
import Username from "../components/Typography/Username";
import Button from "../components/Button";

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
  createdAt: string | any;
}

const ForumThread = () => {
  const { threadId } = useParams<{ threadId: string }>(); // Get threadId from URL params
  const [thread, setThread] = useState<Thread | null>(null); // Thread state now uses the Thread interface
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState<any | null>(null); // State to hold the author's character data

  useEffect(() => {
    const fetchThread = async () => {
      if (threadId) {
        const threadDoc = await getDoc(doc(db, "ForumThreads", threadId));
        if (threadDoc.exists()) {
          const threadData = {
            id: threadDoc.id,
            ...threadDoc.data(),
          } as Thread; // Type assertion to tell TypeScript that this data conforms to the Thread type

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
        } else {
          console.log("No such thread!");
        }
        setLoading(false);
      }
    };
    fetchThread();
  }, [threadId]);

  if (loading) {
    return <p>Loading thread...</p>;
  }

  if (!thread) {
    return <p>Thread not found.</p>;
  }

  return (
    <section>
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

      <Button onClick={() => alert("Reply feature coming soon!")}>Reply</Button>
    </section>
  );
};

export default ForumThread;
