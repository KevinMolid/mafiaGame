import H2 from "../components/Typography/H2";
import Box from "../components/Box";
import Button from "../components/Button";

import { useState } from "react";

const Notebook = () => {
  const [notes, setNotes] = useState(
    "Her er notatene dine. Trykk for å redigere."
  );
  const [editing, setEditing] = useState(false);

  const handleChange = (e: any) => {
    setNotes(e.target.value);
  };

  return (
    <div className="flex flex-col gap-2">
      <H2>Notater</H2>
      <div className="mb-2">
        <Box>
          {!editing && (
            <p className="h-52" onClick={() => setEditing(true)}>
              {notes}
            </p>
          )}
          {editing && (
            <textarea
              name=""
              id=""
              className="bg-inherit w-full h-52 resize-none text-white"
              value={notes}
              onChange={handleChange}
            ></textarea>
          )}
        </Box>
      </div>
      {editing && (
        <div>
          {" "}
          <Button onClick={() => setEditing(false)}>Save changes</Button>
        </div>
      )}
    </div>
  );
};

export default Notebook;
