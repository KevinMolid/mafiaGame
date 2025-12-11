// components/news/GameEventRenderer.tsx
import Username from "../Typography/Username";
import Familyname from "../Typography/Familyname";

/** Firestore Timestamp-like type */
type FsTimestamp = { toDate?: () => Date } | null | undefined;

export type GameEvent = {
  id: string;
  eventType: string;
  timestamp?: FsTimestamp;

  // Common/optional fields used by various event types:
  victimId?: string;
  victimName?: string;

  resetById?: string;
  resetByName?: string;

  leaderId?: string;
  leaderName?: string;
  familyId?: string;
  familyName?: string;

  userId?: string;
  userName?: string;
  actorId?: string;
  actorName?: string;
  role?: "admin" | "moderator";
  newRank?: string;

  message?: string;
};

export function formatEventTime(ts?: FsTimestamp): string {
  if (!ts || typeof ts.toDate !== "function") return "Ukjent tid";
  const eventDate = new Date(ts.toDate());
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const daysAgo = Math.floor(
    (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const timeShort = new Intl.DateTimeFormat("no-NO", { timeStyle: "short" });
  const dateShort = new Intl.DateTimeFormat("no-NO", { dateStyle: "short" });
  const weekdayLong = new Intl.DateTimeFormat("no-NO", { weekday: "long" });

  const sameDay =
    eventDate.getDate() === now.getDate() &&
    eventDate.getMonth() === now.getMonth() &&
    eventDate.getFullYear() === now.getFullYear();

  const isYesterday =
    eventDate.getDate() === yesterday.getDate() &&
    eventDate.getMonth() === yesterday.getMonth() &&
    eventDate.getFullYear() === yesterday.getFullYear();

  if (sameDay) return `kl. ${timeShort.format(eventDate)}`;
  if (isYesterday) return `i går kl. ${timeShort.format(eventDate)}`;
  if (daysAgo < 7)
    return `${weekdayLong.format(eventDate)} kl. ${timeShort.format(
      eventDate
    )}`;
  return `${dateShort.format(eventDate)} kl. ${timeShort.format(eventDate)}`;
}

/**
 * Returns a <li> for a single game event (or null if unknown type).
 * Keeps the exact structure/classes you already use.
 */
export function renderGameEvent(ev: GameEvent) {
  const formattedTime = formatEventTime(ev.timestamp);

  switch (ev.eventType) {
    case "megaphone":
      return (
        <li key={ev.id} className="news-item flex gap-1">
          <small className="mr-1 lg:mr-4 text-xs lg:text-sm">
          <Username
              character={{
                id: ev.userId || "",
                username: ev.userName || "Ukjent",
              }}
            />: {ev.message}
          </small>
          <small className="ml-auto text-xs lg:text-sm">{formattedTime}</small>
        </li>
      );

    case "assassination":
      return (
        <li key={ev.id} className="news-item flex gap-1">
          <small className="mr-1 lg:mr-4 text-xs lg:text-sm">
            <Username
              character={{
                id: ev.victimId || "",
                username: ev.victimName || "Ukjent",
              }}
            />{" "}
            ble drept
          </small>
          <small className="ml-auto text-xs lg:text-sm">{formattedTime}</small>
        </li>
      );

    case "GameReset":
      return (
        <li key={ev.id} className="news-item flex gap-1">
          <small className="mr-1 lg:mr-4 text-xs lg:text-sm">
            Spillet ble restartet av{" "}
            <Username
              character={{
                id: ev.resetById || "",
                username: ev.resetByName || "Ukjent",
              }}
            />
          </small>
          <small className="ml-auto text-xs lg:text-sm">{formattedTime}</small>
        </li>
      );

    case "newFamily":
      return (
        <li key={ev.id} className="news-item flex gap-1">
          <small className="mr-1 lg:mr-4 text-xs lg:text-sm">
            <Username
              character={{
                id: ev.leaderId || "",
                username: ev.leaderName || "Ukjent",
              }}
            />{" "}
            opprettet familien{" "}
            <Familyname
              family={{
                id: ev.familyId || "",
                name: ev.familyName || "Ukjent",
              }}
            />
          </small>
          <small className="ml-auto text-xs lg:text-sm">{formattedTime}</small>
        </li>
      );

    case "disbandedFamily":
      return (
        <li key={ev.id} className="news-item flex gap-1">
          <small className="mr-1 lg:mr-4 text-xs lg:text-sm">
            <Username
              character={{
                id: ev.leaderId || "",
                username: ev.leaderName || "Ukjent",
              }}
            />{" "}
            la ned familien{" "}
            <Familyname
              family={{
                id: ev.familyId || "",
                name: ev.familyName || "Ukjent",
              }}
            />
          </small>
          <small className="ml-auto text-xs lg:text-sm">{formattedTime}</small>
        </li>
      );

    // Role change
    case "newRole":
      return (
        <li key={ev.id} className="news-item flex gap-1">
          <small className="mr-1 lg:mr-4 text-xs lg:text-sm">
            <Username
              character={{
                id: ev.userId || "",
                username: ev.userName || "Ukjent",
              }}
            />{" "}
            ble satt som{" "}
            <strong
              className={
                (ev.role === "admin"
                  ? "text-sky-400"
                  : ev.role === "moderator"
                  ? "text-green-400"
                  : "") + " capitalize"
              }
            >
              {ev.role}
            </strong>
            .
          </small>
          <small className="ml-auto text-xs lg:text-sm">{formattedTime}</small>
        </li>
      );

    case "removeRole":
      return (
        <li key={ev.id} className="news-item flex gap-1">
          <small className="mr-1 lg:mr-4 text-xs lg:text-sm">
            <Username
              character={{
                id: ev.userId || "",
                username: ev.userName || "Ukjent",
              }}
            />{" "}
            mistet rollen som{" "}
            <strong
              className={
                (ev.role === "admin"
                  ? "text-sky-400"
                  : ev.role === "moderator"
                  ? "text-green-400"
                  : "") + " capitalize"
              }
            >
              {ev.role}
            </strong>
            .
          </small>
          <small className="ml-auto text-xs lg:text-sm">{formattedTime}</small>
        </li>
      );

    // Rank up
    case "newRank":
      return (
        <li key={ev.id} className="news-item flex gap-1">
          <small className="mr-1 lg:mr-4 text-xs lg:text-sm">
            <Username
              character={{
                id: ev.userId || "",
                username: ev.userName || "Ukjent",
              }}
            />{" "}
            nådde ranken <strong className="text-white">{ev.newRank}</strong>.
          </small>
          <small className="ml-auto text-xs lg:text-sm">{formattedTime}</small>
        </li>
      );

    default:
      return null;
  }
}
