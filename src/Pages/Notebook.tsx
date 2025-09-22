import H2 from "../components/Typography/H2";
import { useEffect, useState } from "react";

type NotebookProps = {
  notes: string;
  onChangeNotes: (val: string) => void;
};

const Notebook = ({ notes: incomingNotes, onChangeNotes }: NotebookProps) => {
  const [notes, setNotes] = useState(incomingNotes);

  // keep local state in sync if snapshot updates while open
  useEffect(() => {
    setNotes(incomingNotes);
  }, [incomingNotes]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNotes(value); // instant UI
    onChangeNotes(value); // debounced save handled by parent
  };

  return (
    <div className="flex flex-col gap-2">
      <H2>Notater</H2>
      <div className="mb-2">
        <textarea
          value={notes}
          onChange={handleChange}
          rows={8}
          className="bg-neutral-900 py-2 border border-neutral-600 px-4 text-white placeholder-neutral-400 w-full resize-none"
        />
      </div>
    </div>
  );
};

export default Notebook;
