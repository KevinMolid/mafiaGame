import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import { auth, db } from "./firebase";

type AuthContextValue = {
  user: any;
  userData: any;
  setUserData: React.Dispatch<React.SetStateAction<any>>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          setUser(null);
          setUserData(null);
          setLoading(false);
          return;
        }

        // Get token claims (cached; no forced refresh)
        const tokenResult = await firebaseUser.getIdTokenResult();

        // Fetch or create Firestore user document
        const userDoc = await getOrCreateUserDocument(firebaseUser);

        setUser({
          ...firebaseUser,
          claims: tokenResult.claims,
        });

        setUserData({
          ...userDoc,
          role: tokenResult.claims.admin ? "admin" : "player",
          banned: tokenResult.claims.banned === true,
        });

        setLoading(false);
      } catch (err) {
        // Hard fail-safe: never leave app in loading state
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const getOrCreateUserDocument = async (firebaseUser: any) => {
    const uid = firebaseUser.uid;
    const userDocRef = doc(db, "Users", uid);

    try {
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        const data = snap.data();
        return {
          ...data,
          characters: data.characters || [],
        };
      }

      const newUserDoc = {
        uid,
        email: firebaseUser.email ?? null,
        displayName: firebaseUser.displayName ?? null,
        createdAt: serverTimestamp(),
        characters: [],
        role: "player",
      };

      await setDoc(userDocRef, newUserDoc);

      return {
        ...newUserDoc,
        createdAt: new Date(), // local placeholder
      };
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, setUserData, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
