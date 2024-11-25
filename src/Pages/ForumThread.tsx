// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import Username from "../components/Typography/Username";
import Familyname from "../components/Typography/Familyname";
import Button from "../components/Button";
import InfoBox from "../components/InfoBox";
import defaultImg from "/default.jpg";

import { useEffect, useState, Fragment } from "react";
import { Link, useParams } from "react-router-dom";

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
  const { postId } = useParams<{ postId: string }>();
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState<any | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<"info" | "warning">("info");
  const { userCharacter } = useCharacter();

  useEffect(() => {
    const fetchThread = async () => {
      if (postId) {
        try {
          const threadDoc = await getDoc(doc(db, "ForumThreads", postId));
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
                setAuthor(authorDoc.data());
              }
            }

            // Fetch replies for the thread
            const repliesQuery = query(
              collection(db, "ForumThreads", postId, "Replies"),
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
            console.log("Finnes ingen slik tråd!");
          }
        } catch (error) {
          console.error("Feil ved lasting av tråd: ", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchThread();
  }, [postId]);

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
      console.error("Ingen tråd ID-ble funnet.");
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

  if (loading) {
    return <p>Laster tråd...</p>;
  }

  if (!thread) {
    return <p>Tråd ikke funnet.</p>;
  }

  return (
    <Main>
      {message && <InfoBox type={messageType}>{message}</InfoBox>}
      <div className="grid grid-cols-[auto_max-content] gap-4 mb-2 lg:mb-4 bg-neutral-900 border p-4 border-neutral-600">
        <div>
          <p>
            <small>
              {thread.createdAt
                ? format(
                    typeof thread.createdAt === "string"
                      ? new Date(thread.createdAt)
                      : thread.createdAt.toDate(),
                    "dd.MM.yyyy - HH:mm"
                  )
                : "Sending..."}
            </small>
          </p>
          <div>
            <H1>{thread.title}</H1>
          </div>

          {/* Thread */}
          <div className=" pb-4">
            {thread.content.split("\n").map((line, index) => (
              <Fragment key={index}>
                {line}
                <br />
              </Fragment>
            ))}
          </div>

          {/* Icons */}
          <div className="flex gap-1 text-neutral-200 font-medium">
            <div className="bg-neutral-800 py-1 px-2 rounded-md cursor-pointer">
              👍0
            </div>
            <div className="bg-neutral-800 py-1 px-2 rounded-md cursor-pointer">
              👎0
            </div>
            <div className="bg-neutral-800 py-1 px-2 rounded-md cursor-pointer">
              ❤️0
            </div>
            <div className="bg-neutral-800 py-1 px-2 rounded-md cursor-pointer">
              🔥0
            </div>
          </div>
        </div>

        {/* Author data */}
        <div className="flex flex-col items-center text-center">
          <Link to={`/profil/${thread.authorId}`}>
            <img
              src={author.img || defaultImg}
              alt={`${thread.authorName}'s avatar`}
              className="w-24 h-24 md:w-28 md:h-28 mb-2 border border-neutral-600 object-cover"
            />
          </Link>

          <p className="text-sm">
            <Username
              character={{ id: thread.authorId, username: thread.authorName }}
            />
          </p>
          {author.familyId ? (
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
        {replies.map((reply) => (
          <div
            key={reply.id}
            className="bg-neutral-900 border border-neutral-600 px-4 pt-2 pb-4 mb-2"
          >
            <div className="text-sm flex gap-1 mb-2">
              <p>
                <Username
                  character={{ id: reply.authorId, username: reply.authorName }}
                />
              </p>
              <p>
                <small>
                  {reply.createdAt
                    ? format(reply.createdAt.toDate(), "dd.MM.yyyy - HH:mm")
                    : "Sender..."}
                </small>
              </p>
            </div>
            <div className=" pb-4">
              {reply.content.split("\n").map((line, index) => (
                <Fragment key={index}>
                  {line}
                  <br />
                </Fragment>
              ))}
            </div>

            {/* Icons */}
            <div className="flex gap-1 text-neutral-200 font-medium">
              <div className="bg-neutral-800 py-1 px-2 rounded-md cursor-pointer">
                👍0
              </div>
              <div className="bg-neutral-800 py-1 px-2 rounded-md cursor-pointer">
                👎0
              </div>
              <div className="bg-neutral-800 py-1 px-2 rounded-md cursor-pointer">
                ❤️0
              </div>
              <div className="bg-neutral-800 py-1 px-2 rounded-md cursor-pointer">
                🔥0
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form to reply */}
      <H2>Skriv svar</H2>
      <form action="" onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          className="bg-neutral-900 border border-neutral-600 py-2 px-4 text-white placeholder-neutral-400 w-full resize-none"
          name="reply"
          id="reply"
          rows={6}
          onChange={handleReplyChange}
          value={newReply}
        ></textarea>
        <div>
          <Button type="submit">Post</Button>
        </div>
      </form>
    </Main>
  );
};

export default ForumThread;
