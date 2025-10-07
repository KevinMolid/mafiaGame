// components/ChatMessage.tsx
import Username from "./Typography/Username";
import { Fragment } from "react/jsx-runtime";
import { useCharacter } from "../CharacterContext";
import { Message } from "../Functions/messageService";

type Props = Message & {
  /** Only show name/meta on the first bubble in a sender group */
  showMeta?: boolean;
  /** Show a single status below the bubble for your own message */
  statusBelow?: "sent" | "read" | null;
};

const ChatMessage = ({
  id,
  senderId,
  senderName,
  text,
  isOwn = false,
  showMeta = true,
  statusBelow = null,
}: Props) => {
  const { userCharacter } = useCharacter();
  if (!userCharacter) return null;

  const rowAlign = isOwn ? "items-end" : "items-start";
  const bubbleAlign = isOwn ? "ml-auto" : "mr-auto";
  const bubbleColor = isOwn
    ? "bg-sky-600 text-white"
    : "bg-neutral-800 text-neutral-100";

  return (
    <li id={id} className={`mb-2 flex flex-col ${rowAlign}`}>
      {/* Group header: only the other user's name; no time/read here */}
      {showMeta && !isOwn && (
        <div className="flex items-center gap-2 text-stone-400 text-xs sm:text-sm mb-0.5">
          <Username character={{ id: senderId, username: senderName }} />
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[90%] sm:max-w-[75%] ${bubbleAlign} ${bubbleColor} px-3 py-1 rounded-2xl`}
        style={{
          borderTopRightRadius: isOwn && !showMeta ? 6 : 16,
          borderTopLeftRadius: !isOwn && !showMeta ? 6 : 16,
        }}
      >
        <div className="whitespace-pre-wrap break-words">
          {text.split("\n").map((line, idx, arr) => (
            <Fragment key={idx}>
              {line}
              {idx < arr.length - 1 && <br />}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Single icon-only status BELOW the correct last own bubble */}
      {isOwn && statusBelow && (
        <div className="mt-1 text-xs text-stone-400 text-right">
          <span title={statusBelow === "read" ? "Sett" : "Sendt"}>
            {statusBelow === "read" ? (
              <i className="fa-solid fa-check-double" />
            ) : (
              <i className="fa-solid fa-check" />
            )}
          </span>
        </div>
      )}
    </li>
  );
};

export default ChatMessage;
