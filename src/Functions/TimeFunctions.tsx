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
