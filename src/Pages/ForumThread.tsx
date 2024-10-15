import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../firebaseConfig";

import H1 from "../components/Typography/H1";
import Username from "../components/Typography/Username";
import Button from "../components/Button"; // in case we want actions like replying

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ForumThread = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const [thread, setThread] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThread = async () => {
      if (threadId) {
        const threadDoc = await getDoc(doc(db, "ForumThreads", threadId));
        if (threadDoc.exists()) {
          setThread({ id: threadDoc.id, ...threadDoc.data() });
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
      <div className="grid grid-cols-[3fr_1fr] gap-4 mb-4">
        <div className="bg-neutral-800 p-4">
          <H1>{thread.title}</H1>
          <p>{thread.content}</p>
        </div>
        <div className="text-xs bg-neutral-950 p-4">
          <p>
            Posted by:{" "}
            <Username
              character={{ id: thread.authorId, username: thread.authorName }}
            />
          </p>
          <p>Created at: {new Date(thread.createdAt).toLocaleString()}</p>
        </div>
      </div>

      {/* Add reply functionality here later */}
      <Button onClick={() => alert("Reply feature coming soon!")}>Reply</Button>
    </section>
  );
};

export default ForumThread;
