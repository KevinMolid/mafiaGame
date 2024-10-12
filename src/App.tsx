// React
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary.tsx";

// Context
import { AuthProvider } from "./AuthContext";
import { CharacterProvider } from "./CharacterContext";

// Components
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Layout from "./components/Layout";
import Infobar from "./components/Infobar";
import Footer from "./components/Footer";

/***** PAGES *****/
import Home from "./Pages/Home.tsx";
import Admin from "./Pages/Admin.tsx";
import Profile from "./Pages/Profile.tsx";
import EditProfile from "./Pages/EditProfile.tsx";
import Notebook from "./Pages/Notebook.tsx";
import Blacklist from "./Pages/Blacklist.tsx";
import About from "./Pages/About.tsx";
import Forum from "./Pages/Forum.tsx";
import Leaderboard from "./Pages/Leaderboard.tsx";
import Signup from "./Pages/Signup.tsx";
import Login from "./Pages/Login.tsx";
import CreateCharacter from "./Pages/CreateCharacter.tsx";
import SelectCharacter from "./Pages/SelectCharacter.tsx";
import Influence from "./Pages/Reputation/Influence";

// Crimes
import StreetCrime from "./Pages/Crime/StreetCrime.tsx";
import GTA from "./Pages/Crime/GTA.tsx";
import Assassinate from "./Pages/Crime/Assassinate.tsx";

// General
import Travel from "./Pages/General/Travel.tsx";
import Prison from "./Pages/General/Prison.tsx";
import Parking from "./Pages/General/Parking.tsx";

// Social
import Family from "./Pages/Family.tsx";
import Chat from "./Pages/Chat.tsx";

import ProtectedRoute from "./Routes/ProtectedRoute.tsx";

function App() {
  return (
    <AuthProvider>
      <CharacterProvider>
        <Router>
          <div id="page-container" className="flex flex-col relative min-h-dvh">
            <div id="content-wrap" className="flex flex-col flex-grow">
              <Header />
              <Infobar />
              <div className="flex flex-col flex-grow">
                <Layout>
                  <ErrorBoundary>
                    <Sidebar />
                  </ErrorBoundary>
                  <main className="pb-24 sm:pb-24 p-4 sm:p-12 text-stone-400">
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
                        path="/notebook"
                        element={
                          <ProtectedRoute>
                            <Notebook />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/blacklist"
                        element={
                          <ProtectedRoute>
                            <Blacklist />
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
                        path="/gta"
                        element={
                          <ProtectedRoute>
                            <GTA />
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
                    </Routes>
                  </main>
                </Layout>
              </div>
            </div>
            <Footer />
          </div>
        </Router>
      </CharacterProvider>
    </AuthProvider>
  );
}

export default App;
