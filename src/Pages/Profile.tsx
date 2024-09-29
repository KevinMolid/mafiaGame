// Context
import { useCharacter } from "../CharacterContext";

// Functions
import { getCurrentRank } from "../Functions/RankFunctions";

const Profile = () => {
  const { character } = useCharacter();

  if (!character) {
    return null;
  }

  return (
    <section>
      <p className="font-bold mb-4">{character.username}'s profile</p>
      <div className="grid grid-cols-[max-content_max-content] gap-8 pb-4 border-b border-neutral-700">
        <img
          className="w-52 h-52 object-cover"
          src="https://i.imgur.com/lEwhDHl.png"
          alt=""
        />
        <div>
          <ul className="grid grid-cols-[min-content_max-content] gap-x-4">
            <li className="text-stone-400">Username</li>
            <li>{character.username}</li>

            <li className="text-stone-400">Rank</li>
            <li>{getCurrentRank(character.stats.xp)}</li>

            <li className="text-stone-400">Money</li>
            <li>$ {character.stats.money.toLocaleString()}</li>

            <li className="text-stone-400">Family</li>
            <li>Norwegian Gangsters</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default Profile;
