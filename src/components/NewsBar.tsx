import Username from "./Typography/Username";

import { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import "../NewsBar.css";

const db = getFirestore();

const NewsBar = () => {
  const [events, setEvents] = useState<
    Array<{
      id: string;
      victimId: string;
      victimName: string;
      type: string;
      timestamp: any;
    }>
  >([]);

  useEffect(() => {
    const q = query(
      collection(db, "GameEvents"),
      orderBy("timestamp", "desc"),
      limit(3)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const eventList: Array<{
        id: string;
        victimId: string;
        victimName: string;
        type: string;
        timestamp: any;
      }> = [];
      querySnapshot.forEach((doc) => {
        eventList.push({ id: doc.id, ...doc.data() } as {
          id: string;
          victimId: string;
          victimName: string;
          type: string;
          timestamp: any;
        });
      });
      setEvents(eventList);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="news-bar py-1 border-b border-neutral-600 text-stone-400 text-sm">
      <ul>
        {events.map((event) => (
          <li key={event.id} className="news-item flex gap-1 justify-end">
            <p>
              Spilleren{" "}
              <Username
                character={{ id: event.victimId, username: event.victimName }}
              />{" "}
              ble{" "}
              {event.type === "assassination"
                ? "drept"
                : "involvert i en hendelse"}
            </p>
            <p className="text-neutral-200">
              kl.{" "}
              {new Intl.DateTimeFormat("no-NO", {
                timeStyle: "short",
              }).format(new Date(event.timestamp.toDate()))}
            </p>
          </li>
        ))}
      </ul>
      {/* Duplicate the list for seamless scrolling */}
      <ul aria-hidden="true">
        {events.map((event) => (
          <li
            key={`${event.id}-duplicate`}
            className="news-item flex gap-1 justify-end"
          >
            <p>
              Spilleren{" "}
              <Username
                character={{ id: event.victimId, username: event.victimName }}
              />{" "}
              ble{" "}
              {event.type === "assassination"
                ? "drept"
                : "involvert i en hendelse"}{" "}
              kl.{" "}
              {new Intl.DateTimeFormat("no-NO", {
                timeStyle: "short",
              }).format(new Date(event.timestamp.toDate()))}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NewsBar;
