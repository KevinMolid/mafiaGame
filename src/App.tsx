import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";

// Components
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Layout from "./components/Layout";
import Infobar from "./components/Infobar";
import Footer from "./components/Footer";

// Pages
import Influence from "./Pages/Reputation/Influence";
import Login from "./Pages/Login";
import CreateCharacter from "./Pages/CreateCharacter.tsx";

// Firebase
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import firebaseConfig from "./firebaseConfig.tsx";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function App() {
  const [userID, setUserID] = useState("");

  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user
      const uid = user.uid;
      setUserID(uid);
      // ...
    } else {
      // User is signed out
      // ...
    }
  });

  return (
    <Router>
      <Header />
      <Infobar />
      <Layout>
        <Sidebar user={userID} />
        <main className="p-12">
          <Routes>
            <Route path="/" element={<Influence />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/createcharacter"
              element={<CreateCharacter user={userID} />}
            />
            <Route path="/influence" element={<Influence />} />
          </Routes>
        </main>
      </Layout>
      <Footer />
    </Router>
  );
}

export default App;
