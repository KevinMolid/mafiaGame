import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";

import firebaseConfig from "./firebaseConfig";
import { initializeApp } from "firebase/app";

// Initialize Firebase app
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Create the AuthContext
const AuthContext = createContext<any>(null);

// Create a provider component
export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<any>(null); // User from Auth
  const [userData, setUserData] = useState<any>(null); // User data from Firestore
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user); // Set user in state when logged in
        const userDoc = await getUserDocument(user.uid); // Fetch user document from Firestore
        setUserData(userDoc); // Store user data in state
      } else {
        setUser(null); // No user logged in
        setUserData(null); // Clear user data
      }
      setLoading(false); // Stop loading when done
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  // Function to get the user document from Firestore based on the UID
  const getUserDocument = async (uid: string) => {
    try {
      const userDocRef = doc(db, "Users", uid); // Reference to user document
      const userDocSnap = await getDoc(userDocRef); // Fetch the document snapshot

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        return {
          ...userData,
          characters: userData.characters || [], // Initialize characters as an empty array if undefined
        };
      } else {
        console.log("No such document!");
        return null;
      }
    } catch (error) {
      console.error("Error fetching user document:", error);
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
