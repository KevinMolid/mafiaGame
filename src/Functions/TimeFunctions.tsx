import { Timestamp } from "firebase/firestore";

const timeAgo = (timestamp: number) => {
  const secondsElapsed = Math.floor((Date.now() - timestamp) / 1000);

  if (secondsElapsed < 60) return `${secondsElapsed} sek`;
  const minutes = Math.floor(secondsElapsed / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} timer`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} dager`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} måneder`;
  const years = Math.floor(months / 12);
  return `${years} år`;
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
