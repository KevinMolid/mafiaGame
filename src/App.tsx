// React
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Context
import { AuthProvider } from "./AuthContext";
import { CharacterProvider } from "./CharacterContext";

// Components
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Layout from "./components/Layout";
import Infobar from "./components/Infobar";
import Footer from "./components/Footer";

// Pages
import Home from "./Pages/Home.tsx";
import Profile from "./Pages/Profile.tsx";
import EditProfile from "./Pages/EditProfile.tsx";
import About from "./Pages/About.tsx";
import Forum from "./Pages/Forum.tsx";
import Leaderboard from "./Pages/Leaderboard.tsx";
import Signup from "./Pages/Signup.tsx";
import Login from "./Pages/Login.tsx";
import CreateCharacter from "./Pages/CreateCharacter.tsx";
import Influence from "./Pages/Reputation/Influence";
import StreetCrime from "./Pages/Crime/StreetCrime.tsx";

import ProtectedRoute from "./Routes/ProtectedRoute.tsx";

function App() {
  return (
    <AuthProvider>
      <CharacterProvider>
        <Router>
          <Header />
          <Infobar />
          <Layout>
            <Sidebar />
            <main className="p-12">
              <Routes>
                {/* Public Routes */}
                <Route path="/about" element={<About />} />
                <Route path="/createcharacter" element={<CreateCharacter />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={<Login />} />

                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/:characterID"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/editprofile"
                  element={
                    <ProtectedRoute>
                      <EditProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/forum"
                  element={
                    <ProtectedRoute>
                      <Forum />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/influence"
                  element={
                    <ProtectedRoute>
                      <Influence />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/streetcrime"
                  element={
                    <ProtectedRoute>
                      <StreetCrime />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
          </Layout>
          <Footer />
        </Router>
      </CharacterProvider>
    </AuthProvider>
  );
}

export default App;
