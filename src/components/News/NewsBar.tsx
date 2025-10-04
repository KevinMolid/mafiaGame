import { useState, useEffect, cloneElement } from "react";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import "./NewsBar.css";

import { GameEvent, renderGameEvent } from "./GameEventRenderer";

const db = getFirestore();

const NewsBar = () => {
  const [events, setEvents] = useState<GameEvent[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "GameEvents"),
      orderBy("timestamp", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const eventList: GameEvent[] = [];
      querySnapshot.forEach((doc) => {
        eventList.push({ id: doc.id, ...(doc.data() as any) } as GameEvent);
      });
      setEvents(eventList);
    });

    return () => unsubscribe();
  }, []);

  // Render list using the shared renderer (and clone for the duplicate strip)
  const renderEventList = (list: GameEvent[], isDuplicate = false) => (
    <ul aria-hidden={isDuplicate}>
      {list.map((ev) => {
        const node = renderGameEvent(ev);
        if (!node) return null;
        // For the duplicate list, change the key so React treats them as separate
        return isDuplicate ? cloneElement(node, { key: `${ev.id}-dup` }) : node;
      })}
    </ul>
  );

  return (
    <div className="news-bar py-1 border-b bg-neutral-900 border-neutral-600 text-stone-400 text-xs">
      {renderEventList(events)}
      {/* Duplicate the list for seamless scrolling */}
      {renderEventList(events, true)}
    </div>
  );
};

export default NewsBar;
