import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import { auth, db } from "./firebase";

// Create the AuthContext
const AuthContext = createContext<any>(null);

// Create a provider component
export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<any>(null); // User from Auth
  const [userData, setUserData] = useState<any>(null); // User data from Firestore
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setUserData(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      const userDoc = await getOrCreateUserDocument(firebaseUser);

      setUserData(userDoc);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Function to get or create the user document from Firestore
  const getOrCreateUserDocument = async (firebaseUser: any) => {
    const uid = firebaseUser.uid;

    const userDocRef = doc(db, "Users", uid);

    try {
      const snap = await getDoc(userDocRef);

      // If user document exists -> return it
      if (snap.exists()) {
        const data = snap.data();
        return {
          ...data,
          characters: data.characters || [],
        };
      }

      // Create the first-time user document
      const newUserDoc = {
        email: firebaseUser.email ?? null,
        displayName: firebaseUser.displayName ?? null,
        createdAt: serverTimestamp(),
        characters: [],
        role: "player", // optional
      };

      await setDoc(userDocRef, newUserDoc);

      return {
        ...newUserDoc,
        createdAt: new Date(), // local placeholder; serverTimestamp resolves later
      };
    } catch (error) {
      console.error("Failed to get or create user document", error);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, setUserData, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Create a custom hook to use the AuthContext
export const useAuth = () => useContext(AuthContext);
