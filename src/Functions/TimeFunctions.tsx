import { Timestamp } from "firebase/firestore";

export const mmss = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

// "m:ss" when >= 1 minute (no leading 0 for minutes)
// "s"       when < 1 minute (no colon, no leading 0)
export const compactMmSs = (totalSeconds: number) => {
  const secs = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;

  if (h > 0) {
    // H:MM:SS
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  }
  if (secs >= 60) {
    // M:SS
    return `${m}:${s.toString().padStart(2, "0")}`;
  }
  // SS
  return String(s);
};

export const timeAgo = (timestamp: number) => {
  const secondsElapsed = Math.floor((Date.now() - timestamp) / 1000);

  if (secondsElapsed < 60) return `${secondsElapsed} sek`;
  const minutes = Math.floor(secondsElapsed / 60);
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? `1 time` : `${hours} timer`;

  const days = Math.floor(hours / 24);
  if (days < 30) return days === 1 ? `1 dag` : `${days} dager`;

  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? `1 måned` : `${months} måneder`;

  const years = Math.floor(days / 365);
  return years === 1 ? `1 år` : `${years} år`;
};

export default timeAgo;

export const formatTimestamp = (timestamp: Timestamp | Date): string => {
  // Ensure the input is converted to a Date object
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);

  const dayFormatter = new Intl.DateTimeFormat("no-NO", { weekday: "long" });
  const timeFormatter = new Intl.DateTimeFormat("no-NO", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const dateFormatter = new Intl.DateTimeFormat("no-NO", {
    day: "numeric",
    month: "long",
  });

  if (date >= today) {
    // Same day
    return `kl. ${timeFormatter.format(date)}`;
  } else if (date >= yesterday) {
    // Yesterday
    return `I går kl. ${timeFormatter.format(date)}`;
  } else if (date >= oneWeekAgo) {
    // Less than a week ago
    const dayName = dayFormatter.format(date);
    return `${
      dayName.charAt(0).toUpperCase() + dayName.slice(1)
    } kl. ${timeFormatter.format(date)}`;
  } else {
    // More than a week ago
    const formattedDate = dateFormatter.format(date);
    return `${
      formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)
    } kl. ${timeFormatter.format(date)}`;
  }
};

export const getOsloYmd = (d: Date = new Date()): string => {
  // Returns YYYY-MM-DD in Europe/Oslo
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Oslo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA gives "YYYY-MM-DD"
  return fmt.format(d);
};
