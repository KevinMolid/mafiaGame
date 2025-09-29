import Username from "./Typography/Username";
import Familyname from "./Typography/Familyname";
import ScrollArea from "./ScrollArea";

import { useState, useEffect, useRef } from "react";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";

const db = getFirestore();

type EventType = {
  id: string;
  victimId: string;
  victimName: string;
  eventType: string;
  timestamp: any;
  // Optional fields for specific events:
  resetById?: string;
  resetByName?: string;
  leaderId?: string;
  leaderName?: string;
  familyId?: string;
  familyName?: string;
};

const NewsFeed = () => {
  const [events, setEvents] = useState<EventType[]>([]);
  const listRef = useRef<HTMLUListElement>(null);
  const firstLoadRef = useRef(true);

  useEffect(() => {
    const q = query(
      collection(db, "GameEvents"),
      orderBy("timestamp", "asc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const eventList: EventType[] = [];
      querySnapshot.forEach((doc) => {
        eventList.push({ id: doc.id, ...doc.data() } as EventType);
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
    return el.scrollHeight - el.scrollTop - el.clientHeight < 40; // px threshold
  };

  // Scroll to bottom on first data paint; afterward, only if user is near bottom
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

  const renderEventList = (events: EventType[]) => {
    return (
      <ScrollArea className="max-h-24 w-max" contentClassName="max-h-24">
        {events.map((event) => {
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
              <li key={event.id} className="news-item flex gap-1">
                <small className="mr-1 lg:mr-4 text-xs lg:text-sm">
                  <Username
                    character={{
                      id: event.victimId,
                      username: event.victimName,
                    }}
                  />{" "}
                  ble drept
                </small>
                <small className="ml-auto text-xs lg:text-sm">
                  {formattedTime}
                </small>
              </li>
            );
          } else if (event.eventType === "GameReset") {
            return (
              <li key={event.id} className="news-item flex gap-1">
                <small className="mr-1 lg:mr-4 text-xs lg:text-sm">
                  Spillet ble restartet av{" "}
                  <Username
                    character={{
                      id: event.resetById || "",
                      username: event.resetByName || "Ukjent",
                    }}
                  />
                </small>
                <small className="ml-auto text-xs lg:text-sm">
                  {formattedTime}
                </small>
              </li>
            );
          } else if (event.eventType === "newFamily") {
            return (
              <li key={event.id} className="news-item flex gap-1">
                <small className="mr-1 lg:mr-4 text-xs lg:text-sm">
                  <Username
                    character={{
                      id: event.leaderId || "",
                      username: event.leaderName || "Ukjent",
                    }}
                  />{" "}
                  opprettet familien{" "}
                  <Familyname
                    family={{
                      id: event.familyId || "",
                      name: event.familyName || "Ukjent",
                    }}
                  />
                </small>
                <small className="ml-auto text-xs lg:text-sm">
                  {formattedTime}
                </small>
              </li>
            );
          } else if (event.eventType === "disbandedFamily") {
            return (
              <li key={event.id} className="news-item flex gap-1">
                <small className="mr-1 lg:mr-4 text-xs lg:text-sm">
                  <Username
                    character={{
                      id: event.leaderId || "",
                      username: event.leaderName || "Ukjent",
                    }}
                  />{" "}
                  la ned familien{" "}
                  <Familyname
                    family={{
                      id: event.familyId || "",
                      name: event.familyName || "Ukjent",
                    }}
                  />
                </small>
                <small className="ml-auto text-xs lg:text-sm">
                  {formattedTime}
                </small>
              </li>
            );
          } else {
            return null;
          }
        })}
      </ScrollArea>
    );
  };

  return <div>{renderEventList(events)}</div>;
};

export default NewsFeed;
