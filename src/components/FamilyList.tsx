import { useState, useEffect } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { initializeApp } from "firebase/app";

import firebaseConfig from "../firebaseConfig";

import Familyname from "./Typography/Familyname";

const FamilyList = () => {
  const [families, setFamilies] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const fetchFamilies = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "Families"));

      const familyData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        createdAt: doc.data().createdAt,
        leaderId: doc.data().leaderId,
        leaderName: doc.data().leaderName,
        members: doc.data().members,
        name: doc.data().name,
        wealth: doc.data().wealth,
      }));

      setFamilies(familyData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching families:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilies();
  }, []);

  // Function to sort families
  const sortedFamilies = families.sort((a, b) => {
    return a.name.localeCompare(b.name); // Sort alphabetically
  });

  if (loading) {
    return <p>Laster familier...</p>;
  }

  if (families.length === 0) {
    return <p>Det finnes ingen familier.</p>;
  }

  // Type == Rank
  {
    return (
      <section>
        <ul>
          <li className="grid grid-cols-[40px_auto] border-b border-neutral-700 mb-2 font-bold text-neutral-200">
            <p>#</p>
            <p>Familie</p>
          </li>
          {sortedFamilies.map((family, index) => (
            <li key={family.id} className="grid grid-cols-[40px_auto]">
              <p
                className={
                  "mr-2 " +
                  (index === 0
                    ? "font-bold text-yellow-400"
                    : index === 1
                    ? "font-bold text-slate-300"
                    : index === 2
                    ? "font-bold text-amber-600"
                    : index < 10
                    ? "font-bold text-stone-400"
                    : "font-medium text-stone-500")
                }
              >
                #{index + 1}
              </p>
              <Familyname family={family} />
            </li>
          ))}
        </ul>
      </section>
    );
  }
};

export default FamilyList;
