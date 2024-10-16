import H1 from "../../components/Typography/H1";
import Button from "../../components/Button";

import { useCharacter } from "../../CharacterContext";

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import firebaseConfig from "../../firebaseConfig";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const Robbery = () => {
  const { character } = useCharacter();

  // Function to commit robbery
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      // Find players in same location
      const charactersRef = query(
        collection(db, "Characters"),
        where("location", "==", character?.location)
      );

      const charactersSnapshot = await getDocs(charactersRef);
      charactersSnapshot.forEach((char: any) => {
        console.log(char.data());
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <section>
      <H1>Robbery</H1>
      <p>
        Here you can steal money from a random player in your location, or
        attempt to rob a player of your choosing.
      </p>
      <form onSubmit={handleSubmit} action="" className="mt-4">
        <Button type="submit">Commit Robbery</Button>
      </form>
    </section>
  );
};

export default Robbery;
