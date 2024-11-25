import Username from "./Typography/Username";
import { Fragment } from "react/jsx-runtime";

import { Timestamp } from "firebase/firestore";
import { format } from "date-fns";

import { useCharacter } from "../CharacterContext";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  timestamp: Timestamp;
  messageText: string;
}

const ChatMessage = ({
  id,
  senderId,
  senderName,
  timestamp,
  messageText,
}: Message) => {
  const { userCharacter } = useCharacter();

  if (!userCharacter) return;

  return (
    <li key={id} className="mb-2">
      {/* Sender and timestamp */}
      <div className="flex gap-2 text-stone-400 text-xs sm:text-sm">
        <Username
          character={{
            id: senderId,
            username: senderName,
          }}
        />
        <p>
          <small>
            {timestamp
              ? format(timestamp.toDate(), "dd.MM.yyyy - HH:mm")
              : "Sending..."}
          </small>
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
