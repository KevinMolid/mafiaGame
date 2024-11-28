import Username from "./Typography/Username";
import Familyname from "./Typography/Familyname";

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
            formattedTime = (() => {
              const eventDate = new Date(event.timestamp.toDate());
              const now = new Date();
              const yesterday = new Date();
              yesterday.setDate(now.getDate() - 1);
              const daysAgo = Math.floor(
                (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24)
              );

              if (
                eventDate.getDate() === now.getDate() &&
                eventDate.getMonth() === now.getMonth() &&
                eventDate.getFullYear() === now.getFullYear()
              ) {
                // Today
                return `kl. ${new Intl.DateTimeFormat("no-NO", {
                  timeStyle: "short",
                }).format(eventDate)}`;
              } else if (
                eventDate.getDate() === yesterday.getDate() &&
                eventDate.getMonth() === yesterday.getMonth() &&
                eventDate.getFullYear() === yesterday.getFullYear()
              ) {
                // Yesterday
                return `i går kl. ${new Intl.DateTimeFormat("no-NO", {
                  timeStyle: "short",
                }).format(eventDate)}`;
              } else if (daysAgo < 7) {
                // Less than a week ago
                const dayOfWeek = new Intl.DateTimeFormat("no-NO", {
                  weekday: "long",
                }).format(eventDate);
                return `${dayOfWeek} kl. ${new Intl.DateTimeFormat("no-NO", {
                  timeStyle: "short",
                }).format(eventDate)}`;
              } else {
                // More than a week ago
                return `${new Intl.DateTimeFormat("no-NO", {
                  dateStyle: "short",
                }).format(eventDate)} kl. ${new Intl.DateTimeFormat("no-NO", {
                  timeStyle: "short",
                }).format(eventDate)}`;
              }
            })();
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
                  ble drept {formattedTime}
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
                  Spillet ble restartet av{" "}
                  <Username
                    character={{
                      id: event.resetById,
                      username: event.resetByName,
                    }}
                  />{" "}
                  {formattedTime}
                </p>
              </li>
            );
          } else if (event.eventType === "newFamily") {
            return (
              <li
                key={isDuplicate ? `${event.id}-duplicate` : event.id}
                className="news-item flex gap-1 justify-end"
              >
                <p>
                  <Username
                    character={{
                      id: event.leaderId,
                      username: event.leaderName,
                    }}
                  />{" "}
                  opprettet familien{" "}
                  <Familyname
                    family={{
                      id: event.familyId,
                      name: event.familyName,
                    }}
                  />{" "}
                  {formattedTime}
                </p>
              </li>
            );
          } else if (event.eventType === "disbandedFamily") {
            return (
              <li
                key={isDuplicate ? `${event.id}-duplicate` : event.id}
                className="news-item flex gap-1 justify-end"
              >
                <p>
                  <Username
                    character={{
                      id: event.leaderId,
                      username: event.leaderName,
                    }}
                  />{" "}
                  la ned familien{" "}
                  <Familyname
                    family={{
                      id: event.familyId,
                      name: event.familyName,
                    }}
                  />{" "}
                  {formattedTime}
                </p>
              </li>
            );
          } else return null;
        })}
      </ul>
    );
  };

  return (
    <div className="news-bar py-1 border-b bg-neutral-900 border-neutral-600 text-stone-400 text-sm">
      {renderEventList(events)}
      {/* Duplicate the list for seamless scrolling */}
      {renderEventList(events, true)}
    </div>
  );
};

export default NewsBar;
