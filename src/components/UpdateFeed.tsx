import ScrollArea from "./ScrollArea";

import { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";

const db = getFirestore();

type UpdateType = {
  id: string;
  createdAt: any; // Firestore Timestamp
  authorId: string;
  authorName: string;
  text?: string;
};

const UpdateFeed = () => {
  const [updates, setUpdates] = useState<UpdateType[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "Updates"),
      orderBy("createdAt", "asc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const updateList: UpdateType[] = [];
      querySnapshot.forEach((doc) => {
        updateList.push({ id: doc.id, ...doc.data() } as UpdateType);
      });
      setUpdates(updateList);
    });

    return () => unsubscribe();
  }, []);

  return (
    <ScrollArea
      className="max-h-24 w-full max-w-full"
      contentClassName="max-h-24"
      stickToBottom
    >
      <ul className="pr-4">
        {updates.map((update) => {
          let formattedTime = "Ukjent tid";
          if (
            update.createdAt &&
            typeof update.createdAt.toDate === "function"
          ) {
            const eventDate = new Date(update.createdAt.toDate());
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
              formattedTime = `kl. ${new Intl.DateTimeFormat("no-NO", {
                timeStyle: "short",
              }).format(eventDate)}`;
            } else if (
              eventDate.getDate() === yesterday.getDate() &&
              eventDate.getMonth() === yesterday.getMonth() &&
              eventDate.getFullYear() === yesterday.getFullYear()
            ) {
              formattedTime = `i går kl. ${new Intl.DateTimeFormat("no-NO", {
                timeStyle: "short",
              }).format(eventDate)}`;
            } else if (daysAgo < 7) {
              const dayOfWeek = new Intl.DateTimeFormat("no-NO", {
                weekday: "long",
              }).format(eventDate);
              formattedTime = `${dayOfWeek} kl. ${new Intl.DateTimeFormat(
                "no-NO",
                { timeStyle: "short" }
              ).format(eventDate)}`;
            } else {
              formattedTime = `${new Intl.DateTimeFormat("no-NO", {
                dateStyle: "short",
              }).format(eventDate)} kl. ${new Intl.DateTimeFormat("no-NO", {
                timeStyle: "short",
              }).format(eventDate)}`;
            }
          }

          return (
            <li key={update.id} className="news-item flex gap-2 items-start">
              <small className="text-xs lg:text-sm flex-1 min-w-0 break-words whitespace-normal">
                {update.text ?? ""}
              </small>
              <small className="ml-2 shrink-0 text-xs lg:text-sm">
                {formattedTime}
              </small>
            </li>
          );
        })}
      </ul>
    </ScrollArea>
  );
};

export default UpdateFeed;
