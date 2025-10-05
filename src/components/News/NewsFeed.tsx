import ScrollArea from "../ScrollArea";
import { useState, useEffect, useRef } from "react";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { GameEvent, renderGameEvent } from "./GameEventRenderer";

const db = getFirestore();

const NewsFeed = () => {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const listRef = useRef<HTMLUListElement>(null);
  const firstLoadRef = useRef(true);

  useEffect(() => {
    const q = query(
      collection(db, "GameEvents"),
      orderBy("timestamp", "asc"),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const eventList: GameEvent[] = [];
      querySnapshot.forEach((doc) => {
        eventList.push({ id: doc.id, ...doc.data() } as GameEvent);
      });
      setEvents(eventList);
    });
    return () => unsubscribe();
  }, []);

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  };

  const isNearBottom = () => {
    const el = listRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };

  useEffect(() => {
    if (events.length === 0) return;
    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      requestAnimationFrame(() => scrollToBottom("auto"));
      return;
    }
    if (isNearBottom()) {
      requestAnimationFrame(() => scrollToBottom("smooth"));
    }
  }, [events.length]);

  return (
    <ScrollArea
      className="max-h-24 w-full max-w-full"
      contentClassName="max-h-24 max-w-full"
    >
      <ul
        ref={listRef}
        className="w-full max-w-full min-w-0 break-words whitespace-normal pr-4"
      >
        {events.map((ev) => renderGameEvent(ev))}
      </ul>
    </ScrollArea>
  );
};

export default NewsFeed;
