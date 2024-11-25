import H2 from "../components/Typography/H2";
import H3 from "../components/Typography/H3";
import Username from "../components/Typography/Username";

import { useCharacter } from "../CharacterContext";

const Contacts = () => {
  const { character } = useCharacter();

  if (!character) return;

  return (
    <div>
      <H2>Kontakter</H2>
      <p>Her er en liste over kontaktene dine.</p>
      <div className="grid grid-cols-2 mt-4 gap-8">
        <div className="border-r border-neutral-700 min-h-40">
          <H3>
            <i className="fa-solid fa-user-group"></i> Venner
          </H3>
          {character.friends ? (
            <ul>
              {character.friends.map((friend: any) => {
                return (
                  <li key={friend.id}>
                    <Username
                      character={{ id: friend.id, username: friend.name }}
                    />
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>Vennelisten er tom.</p>
          )}
        </div>
        <div>
          <H3>
            <i className="fa-solid fa-skull-crossbones"></i> Svarteliste
          </H3>
          {character.blacklist ? (
            <ul>
              {character.blacklist.map((player: any) => {
                return (
                  <li key={player.id}>
                    <Username
                      character={{ id: player.id, username: player.name }}
                    />
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>Svartelisten er tom.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contacts;
