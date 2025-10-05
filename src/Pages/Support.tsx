import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import Button from "../components/Button";
import InfoBox from "../components/InfoBox";
import { useState, useEffect } from "react";
import { useCharacter } from "../CharacterContext";

import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { getDocs, where, query as fsQuery } from "firebase/firestore";

import { getAuth } from "firebase/auth";
import firebaseConfig from "../firebaseConfig";

import { useLocation } from "react-router-dom";

// trygg init ved HMR
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

import { CATEGORIES, CategoryValue } from "../constants/support";

type MessageKind = "success" | "failure" | "important" | "warning" | "info";
type MessageState = { kind: MessageKind; text: string } | null;

const Support = () => {
  const { userCharacter } = useCharacter();
  const [category, setCategory] = useState<CategoryValue | "">("");
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);

  const location = useLocation();
  const preset = (location.state ?? {}) as {
    presetCategoryLabel?: string;
    presetUsername?: string;
  };

  const [useUsernameField, setUseUsernameField] = useState(false);

  useEffect(() => {
    if (preset.presetCategoryLabel) {
      const match = CATEGORIES.find(
        (c) => c.label === preset.presetCategoryLabel
      );
      if (match) setCategory(match.value);
    }
    if (preset.presetUsername) {
      setTopic(preset.presetUsername);
      setUseUsernameField(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTopicChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setTopic(e.target.value);
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setContent(e.target.value);
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setCategory(e.target.value as CategoryValue);

  const validate = () => {
    const errors: string[] = [];
    if (!category) errors.push("Velg en kategori.");
    if (topic.trim().length < 3)
      errors.push(
        useUsernameField
          ? "Brukernavn må ha minst 3 tegn."
          : "Emne må ha minst 3 tegn."
      );
    if (content.trim().length < 10)
      errors.push("Beskrivelse må ha minst 10 tegn.");
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validate();

    // VIS INFOBOX-ADVARSEL HVIS UGYLDIG
    if (errors.length > 0) {
      setMessage({
        kind: "warning",
        text: errors.join(" "),
      });
      return;
    }

    if (submitting) return;
    setSubmitting(true);
    setMessage(null);

    if (submitting) return;
    setSubmitting(true);
    setMessage(null);

    // NEW: if reporting a player, verify the username exists and capture ID+username
    let reportedId: string | null = null;
    let reportedUsername: string | null = null;

    if (useUsernameField) {
      const lowered = topic.trim().toLowerCase();
      const snap = await getDocs(
        fsQuery(
          collection(db, "Characters"),
          where("username_lowercase", "==", lowered)
        )
      );
      if (snap.empty) {
        setMessage({
          kind: "failure",
          text: `Fant ingen spiller med brukernavn "${topic.trim()}".`,
        });
        setSubmitting(false);
        return;
      }
      const docSnap = snap.docs[0];
      reportedId = docSnap.id;
      reportedUsername = (docSnap.data().username as string) || topic.trim();
    }

    try {
      await addDoc(collection(db, "SupportTickets"), {
        category,
        topic: topic.trim(),
        content: content.trim(),
        status: "open",
        createdAt: serverTimestamp(),
        reportedId,
        reportedUsername,

        // who is logged-in (Firebase Auth)
        user: (() => {
          const auth = getAuth();
          const u = auth.currentUser;
          return u
            ? {
                uid: u.uid,
                displayName: u.displayName || null,
                email: u.email || null,
              }
            : null;
        })(),

        // active character (from your game context)
        character: userCharacter
          ? {
              id: userCharacter.id ?? null,
              name: userCharacter.username ?? null,
            }
          : null,

        client: {
          ua: typeof navigator !== "undefined" ? navigator.userAgent : null,
          tzOffsetMin: new Date().getTimezoneOffset(),
        },
      });

      setMessage({ kind: "success", text: "Takk! Henvendelsen er sendt." });
      setCategory("");
      setTopic("");
      setContent("");
    } catch (err) {
      console.error(err);
      setMessage({
        kind: "failure",
        text: "Noe gikk galt ved innsending. Prøv igjen.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Main>
      <H1>Support</H1>

      {message && (
        <div className="mb-4 max-w-2xl">
          <InfoBox type={message.kind}>{message.text}</InfoBox>
        </div>
      )}

      <div className="flex flex-col gap-4 max-w-2xl">
        <select
          id="category"
          name="category"
          className="bg-transparent border border-neutral-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-white"
          value={category}
          onChange={handleCategoryChange}
          aria-invalid={!category ? true : undefined}
        >
          <option value="" disabled>
            Velg kategori…
          </option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value} className="bg-neutral-900">
              {c.label}
            </option>
          ))}
        </select>

        <input
          className="bg-transparent border-b border-neutral-600 py-2 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
          id={useUsernameField ? "username" : "title"}
          placeholder={
            useUsernameField
              ? "Brukernavn (minst 3 tegn)"
              : "Emne (minst 3 tegn)"
          }
          value={topic}
          type="text"
          onChange={handleTopicChange}
          aria-invalid={topic.trim().length < 3 ? true : undefined}
        />

        <textarea
          rows={8}
          id="content"
          placeholder="Beskriv problemet (minst 10 tegn). Ta med brukernavn, tidspunkt, hva du gjorde, ev. feilmelding."
          className="bg-transparent border border-neutral-600 rounded-md px-3 py-2 text-white placeholder-neutral-500 resize-none focus:outline-none focus:border-white"
          value={content}
          onChange={handleContentChange}
          aria-invalid={content.trim().length < 10 ? true : undefined}
        />

        <div className="flex items-center gap-3">
          <Button
            disabled={submitting}
            onClick={handleSubmit}
            aria-disabled={submitting}
          >
            {submitting ? "Sender…" : "Send"}
          </Button>
        </div>
      </div>
    </Main>
  );
};

export default Support;
