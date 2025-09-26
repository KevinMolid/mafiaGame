import Username from "./Typography/Username";
import { Fragment } from "react/jsx-runtime";
import type { Timestamp as FsTimestamp } from "firebase/firestore";
import { useCharacter } from "../CharacterContext";
import { timeAgo } from "../Functions/TimeFunctions";

interface MessageProps {
  id: string;
  senderId: string;
  senderName: string;
  // Be flexible on timestamp input shape
  timestamp?: FsTimestamp | Date | string | number | null;
  messageText: string;
}

const ChatMessage = ({
  id,
  senderId,
  senderName,
  timestamp,
  messageText,
}: MessageProps) => {
  const { userCharacter } = useCharacter();
  if (!userCharacter) return null;

  // Normalize to epoch milliseconds for timeAgo()
  const toEpochMs = (t: MessageProps["timestamp"]): number | null => {
    if (t === null || t === undefined) return null;
    // Firestore Timestamp
    // @ts-expect-error runtime check for Firestore Timestamp
    if (typeof t?.toDate === "function") return (t as any).toDate().getTime();
    if (t instanceof Date) return t.getTime();
    if (typeof t === "number") return t; // assume already ms
    // string -> Date parse
    const d = new Date(t as string);
    return isNaN(d.getTime()) ? null : d.getTime();
  };

  const epoch = toEpochMs(timestamp);
  const pretty = epoch !== null ? timeAgo(epoch) : "Sender...";

  return (
    <li className="mb-2" id={id}>
      {/* Sender and timestamp */}
      <div className="flex gap-2 text-stone-400 text-xs sm:text-sm">
        <Username character={{ id: senderId, username: senderName }} />
        <p>
          <small>{pretty}</small>
        </p>
      </div>
      <div className="text-neutral-200 mb-2">
        {messageText.split("\n").map((line, index) => (
          <Fragment key={index}>
            {line}
            <br />
          </Fragment>
        ))}
      </div>
    </li>
  );
};

export default ChatMessage;
