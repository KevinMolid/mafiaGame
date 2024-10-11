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
import Admin from "./Pages/Admin.tsx";
import Profile from "./Pages/Profile.tsx";
import EditProfile from "./Pages/EditProfile.tsx";
import About from "./Pages/About.tsx";
import Forum from "./Pages/Forum.tsx";
import Leaderboard from "./Pages/Leaderboard.tsx";
import Signup from "./Pages/Signup.tsx";
import Login from "./Pages/Login.tsx";
import CreateCharacter from "./Pages/CreateCharacter.tsx";
import SelectCharacter from "./Pages/SelectCharacter.tsx";
import Chat from "./Pages/Chat.tsx";
import Influence from "./Pages/Reputation/Influence";
import StreetCrime from "./Pages/Crime/StreetCrime.tsx";
import Travel from "./Pages/General/Travel.tsx";
import Prison from "./Pages/General/Prison.tsx";
import Parking from "./Pages/General/Parking.tsx";
import Family from "./Pages/Family.tsx";
import Assassinate from "./Pages/Crime/Assassinate.tsx";

import ProtectedRoute from "./Routes/ProtectedRoute.tsx";

function App() {
  return (
    <AuthProvider>
      <CharacterProvider>
        <Router>
          <div id="page-container" className="relative min-h-dvh">
            <div id="content-wrap" className="pb-8">
              <Header />
              <Infobar />
              <Layout>
                <Sidebar />
                <main className="p-4 sm:p-12 text-stone-400">
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/about" element={<About />} />
                    <Route
                      path="/createcharacter"
                      element={<CreateCharacter />}
                    />
                    <Route
                      path="/selectcharacater"
                      element={<SelectCharacter />}
                    />
                    <Route path="/chat" element={<Chat />} />

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
                      path="/admin"
                      element={
                        <ProtectedRoute>
                          <Admin />
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
                      path="/family"
                      element={
                        <ProtectedRoute>
                          <Family />
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

                    <Route
                      path="/parking"
                      element={
                        <ProtectedRoute>
                          <Parking />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/prison"
                      element={
                        <ProtectedRoute>
                          <Prison />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/travel"
                      element={
                        <ProtectedRoute>
                          <Travel />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/assassinate"
                      element={
                        <ProtectedRoute>
                          <Assassinate />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </main>
              </Layout>
            </div>
            <Footer />
          </div>
        </Router>
      </CharacterProvider>
    </AuthProvider>
  );
}

export default App;
