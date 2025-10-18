import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import Button from "../components/Button";
import { useMemo, useState } from "react";
import InfoBox from "../components/InfoBox";

const letters = ["б", "д", "ж", "щ", "ф", "ц"];
const rows = 10; // max attempts
const guessLen = 4; // 4 columns for guesses; 5th column is feedback

type Feedback = { exact: number; present: number };

function randomAnswer(): string[] {
  // allow duplicates like classic Mastermind
  return Array.from(
    { length: guessLen },
    () => letters[Math.floor(Math.random() * letters.length)]
  );
}

function getFeedback(secret: string[], guess: string[]): Feedback {
  // First pass: exact matches
  const usedSecret = Array(secret.length).fill(false);
  const usedGuess = Array(guess.length).fill(false);
  let exact = 0;

  for (let i = 0; i < guessLen; i++) {
    if (guess[i] === secret[i]) {
      exact++;
      usedSecret[i] = true;
      usedGuess[i] = true;
    }
  }

  // Second pass: present (right letter, wrong place)
  let present = 0;
  for (let i = 0; i < guessLen; i++) {
    if (usedGuess[i]) continue;
    for (let j = 0; j < guessLen; j++) {
      if (usedSecret[j]) continue;
      if (guess[i] === secret[j]) {
        present++;
        usedSecret[j] = true;
        usedGuess[i] = true;
        break;
      }
    }
  }

  return { exact, present };
}

const Hacking = () => {
  const [answer, setAnswer] = useState<string[]>(() => randomAnswer());
  const [board, setBoard] = useState<string[][]>(() =>
    Array.from({ length: rows }, () =>
      Array.from({ length: guessLen }, () => "")
    )
  );
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(() =>
    Array.from({ length: rows }, () => ({ exact: 0, present: 0 }))
  );
  const [currentRow, setCurrentRow] = useState(0);
  const [currentCol, setCurrentCol] = useState(0);
  const [visibleRows, setVisibleRows] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState<React.ReactNode>("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "info" | "warning"
  >("info");

  const won = useMemo(() => {
    if (currentRow === 0) return false;
    const lastRow = currentRow - 1;
    return feedbacks[lastRow]?.exact === guessLen;
  }, [currentRow, feedbacks]);

  function handleLetterClick(l: string) {
    if (gameOver) return;
    if (currentRow >= rows) return;
    if (currentCol >= guessLen) return;

    setBoard((prev) => {
      const next = prev.map((r) => r.slice());
      next[currentRow][currentCol] = l;
      return next;
    });

    const nextCol = currentCol + 1;
    if (nextCol < guessLen) {
      setCurrentCol(nextCol);
      return;
    }

    // Row complete -> compute feedback
    const rowGuess = [...board[currentRow]];
    rowGuess[currentCol] = l; // include the last placed letter

    const fb = getFeedback(answer, rowGuess);
    setFeedbacks((prev) => {
      const next = prev.slice();
      next[currentRow] = fb;
      return next;
    });

    const nextRow = currentRow + 1;
    const didWin = fb.exact === guessLen;

    // Advance to next row/attempt (so currentRow always points to next empty row)
    setCurrentRow(nextRow);
    setCurrentCol(0);

    // Reveal the next row ONLY if the game is NOT over
    setVisibleRows((v) => {
      const targetCount = didWin || nextRow >= rows ? nextRow : nextRow + 1;
      return Math.min(rows, Math.max(v, targetCount));
    });

    // End game if win or out of rows — set InfoBox message here
    if (didWin || nextRow >= rows) {
      const attemptsUsed = Math.min(nextRow, rows);
      if (didWin) {
        setMessageType("success");
        setMessage(<>Du vant på {attemptsUsed} forsøk</>);
      } else {
        setMessageType("failure");
        setMessage(<>Du tapte</>);
      }
      setGameOver(true);
    }
  }

  function handleBackspace() {
    if (gameOver) return;
    if (currentCol > 0) {
      setBoard((prev) => {
        const next = prev.map((r) => r.slice());
        next[currentRow][currentCol - 1] = "";
        return next;
      });
      setCurrentCol((c) => c - 1);
    }
  }

  function newGame() {
    setAnswer(randomAnswer());
    setBoard(
      Array.from({ length: rows }, () =>
        Array.from({ length: guessLen }, () => "")
      )
    );
    setFeedbacks(
      Array.from({ length: rows }, () => ({ exact: 0, present: 0 }))
    );
    setCurrentRow(0);
    setCurrentCol(0);
    setVisibleRows(1);
    setGameOver(false);
    setMessage(""); // clear InfoBox
    setMessageType("info");
  }

  return (
    <Main>
      <H1>Hacking</H1>

      {message && (
        <InfoBox type={messageType} onClose={() => setMessage("")}>
          {message}
        </InfoBox>
      )}

      {/* Answer row on game over */}
      {gameOver && (
        <div className="mb-3">
          <div className="w-max h-12 flex gap-1 mb-2">
            {answer.map((ch, i) => (
              <div
                key={i}
                className={`w-12 h-12 rounded-md grid place-items-center text-xl text-white ${
                  won ? "bg-green-600" : "bg-red-600"
                }`}
              >
                <span className="select-none">{ch}</span>
              </div>
            ))}
            {/* Empty spacer to align with board's 5th feedback cell */}
            <div className="w-12 h-12" />
          </div>
        </div>
      )}

      {/* Board */}
      <div className="w-max flex flex-col gap-1 mb-4">
        {Array.from({ length: visibleRows }).map((_, r) => (
          <div key={r} className="w-max h-12 flex gap-1">
            {/* 4 guess slots */}
            {Array.from({ length: guessLen }).map((__, c) => {
              const val = board[r][c];
              const isCurrent = r === currentRow && c === currentCol;
              return (
                <div
                  key={c}
                  className={`w-12 h-12 rounded-md grid place-items-center bg-neutral-800 text-xl ${
                    isCurrent ? "ring-2 ring-neutral-500" : ""
                  }`}
                >
                  <span className="select-none">{val}</span>
                </div>
              );
            })}

            {/* 5th cell: feedback as circles */}
            <div className="w-12 h-12 rounded-md bg-neutral-900 grid place-items-center">
              <div className="flex flex-wrap gap-1 justify-center items-center w-9">
                {Array.from({ length: feedbacks[r].exact }).map((_, i) => (
                  <span
                    key={`e-${i}`}
                    className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"
                    aria-label="Riktig bokstav på riktig plass"
                    title="Riktig bokstav på riktig plass"
                  />
                ))}
                {Array.from({ length: feedbacks[r].present }).map((_, i) => (
                  <span
                    key={`p-${i}`}
                    className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block"
                    aria-label="Riktig bokstav på feil plass"
                    title="Riktig bokstav på feil plass"
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-sm text-neutral-300 mb-3">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />{" "}
          = riktig plass
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />{" "}
          = feil plass
        </span>
      </div>

      {/* Letter keypad */}
      <div className="bg-neutral-800 w-max px-2 py-1 rounded-3xl flex gap-1 mb-3">
        {letters.map((l) => (
          <Button
            key={l}
            style="secondary"
            size="square"
            onClick={() => handleLetterClick(l)}
          >
            {l}
          </Button>
        ))}
        <Button
          style="secondary"
          size="square"
          onClick={handleBackspace}
          aria-label="Slett"
        >
          <i className="fa-solid fa-delete-left"></i>
        </Button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button onClick={newGame}>Nytt spill</Button>
      </div>
    </Main>
  );
};

export default Hacking;
