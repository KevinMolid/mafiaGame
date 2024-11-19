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

// Define the type separately
type EventType = {
  id: string;
  victimId: string;
  victimName: string;
  eventType: string;
  timestamp: any;
};

const NewsBar = () => {
  const [events, setEvents] = useState<EventType[]>([]);

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
        eventType: string;
        timestamp: any;
      }> = [];
      querySnapshot.forEach((doc) => {
        eventList.push({ id: doc.id, ...doc.data() } as {
          id: string;
          victimId: string;
          victimName: string;
          eventType: string;
          timestamp: any;
        });
      });
      setEvents(eventList);
    });

    return () => unsubscribe();
  }, []);

  // Helper function to render the event list
  const renderEventList = (events: EventType[], isDuplicate = false) => {
    return (
      <ul aria-hidden={isDuplicate}>
        {events.map((event: any) => {
          // Handle missing or invalid timestamp cases
          let formattedTime = "Ukjent tid";
          if (event.timestamp && typeof event.timestamp.toDate === "function") {
            formattedTime = new Intl.DateTimeFormat("no-NO", {
              timeStyle: "short",
            }).format(new Date(event.timestamp.toDate()));
          }

          if (event.eventType === "assassination") {
            return (
              <li
                key={isDuplicate ? `${event.id}-duplicate` : event.id}
                className="news-item flex gap-1 justify-end"
              >
                <p>
                  <Username
                    character={{
                      id: event.victimId,
                      username: event.victimName,
                    }}
                  />{" "}
                  ble drept kl. {formattedTime}
                </p>
              </li>
            );
          } else if (event.eventType === "GameReset") {
            return (
              <li
                key={isDuplicate ? `${event.id}-duplicate` : event.id}
                className="news-item flex gap-1 justify-end"
              >
                <p>
                  Spillet ble resatt av{" "}
                  <Username
                    character={{
                      id: event.resetById,
                      username: event.resetByName,
                    }}
                  />{" "}
                  kl. {formattedTime}
                </p>
              </li>
            );
          } else return null;
        })}
      </ul>
    );
  };

  return (
    <div className="news-bar py-1 border-b border-neutral-600 text-stone-400 text-sm">
      {renderEventList(events)}
      {/* Duplicate the list for seamless scrolling */}
      {renderEventList(events, true)}
    </div>
  );
};

export default NewsBar;
