// React
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary.tsx";

// Context
import { AuthProvider } from "./AuthContext";
import { CharacterProvider } from "./CharacterContext";
import { CooldownProvider } from "./CooldownContext.tsx";
import { MusicProvider } from "./MusicContext";
import { MenuProvider } from "./MenuContext.tsx";

// Components
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Layout from "./components/Layout";
import Infobar from "./components/Infobar";
import Footer from "./components/Footer";
import DropdownLeft from "./components/DropdownLeft.tsx";
import DropdownRight from "./components/DropdownRight.tsx";

/***** PAGES *****/
// Right dropdown menu
import Admin from "./Pages/Admin.tsx";
import Alerts from "./Pages/Alerts.tsx";
import GameGuide from "./Pages/GameGuide.tsx";
import Chat from "./Pages/Chat.tsx";
import Forum from "./Pages/Forum.tsx";
import ForumThread from "./Pages/ForumThread.tsx";
import Leaderboard from "./Pages/Leaderboard.tsx";

// Left dropdown menu
import Profile from "./Pages/Profile.tsx";
import EditProfile from "./Pages/EditProfile.tsx";
import Notebook from "./Pages/Notebook.tsx";
import Blacklist from "./Pages/Blacklist.tsx";
// _____________________________________________
import Home from "./Pages/Home.tsx";
import Shop from "./Pages/Shop.tsx";
import Bank from "./Pages/General/Bank.tsx";
// _____________________________________________
import Family from "./Pages/Family.tsx";
import FamilyProfile from "./Pages/FamilyProfile.tsx";
// _____________________________________________
import Influence from "./Pages/Reputation/Influence";
// Crimes ______________________________________
import StreetCrime from "./Pages/Crime/StreetCrime.tsx";
import Robbery from "./Pages/Crime/Robbery.tsx";
import GTA from "./Pages/Crime/GTA.tsx";
import Assassinate from "./Pages/Crime/Assassinate.tsx";
// General ______________________________________
import Travel from "./Pages/General/Travel.tsx";
import Prison from "./Pages/General/Prison.tsx";
import Parking from "./Pages/General/Parking.tsx";
// Gambling ______________________________________
import Jackpot from "./Pages/Gambling/Jackpot.tsx";

import Support from "./Pages/Support.tsx";
import Signup from "./Pages/Signup.tsx";
import Login from "./Pages/Login.tsx";
import CreateCharacter from "./Pages/CreateCharacter.tsx";
import SelectCharacter from "./Pages/SelectCharacter.tsx";
import Dead from "./Pages/Dead.tsx";

// Protected routes
import ProtectedRoute from "./Routes/ProtectedRoute.tsx";
import ProtectedAdminRoute from "./Routes/ProtectedAdminRoute.tsx";

function App() {
  return (
    <AuthProvider>
      <CharacterProvider>
        <CooldownProvider>
          <MusicProvider>
            <MenuProvider>
              <Router>
                <div
                  id="page-container"
                  className="flex flex-col relative min-h-dvh"
                >
                  <div id="content-wrap" className="flex flex-col flex-grow">
                    <Header />
                    <Infobar />
                    <div className="relative flex flex-col flex-grow">
                      <Layout>
                        <ErrorBoundary>
                          <Sidebar />
                          <DropdownLeft />
                          <DropdownRight />
                        </ErrorBoundary>

                        <Routes>
                          {/* Public Routes */}
                          <Route path="/spillguide" element={<GameGuide />} />
                          <Route path="/support" element={<Support />} />

                          <Route
                            path="/nyspiller"
                            element={<CreateCharacter />}
                          />
                          <Route
                            path="/velgspiller"
                            element={<SelectCharacter />}
                          />
                          <Route path="/meldinger" element={<Chat />} />

                          <Route path="/toppliste" element={<Leaderboard />} />
                          <Route path="/registrer" element={<Signup />} />
                          <Route path="/logginn" element={<Login />} />
                          <Route path="/drept" element={<Dead />} />

                          {/* Protected Admin Routes */}
                          <Route
                            path="/admin"
                            element={
                              <ProtectedAdminRoute>
                                <Admin />
                              </ProtectedAdminRoute>
                            }
                          />

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
                            path="/varsler"
                            element={
                              <ProtectedRoute>
                                <Alerts />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/butikk"
                            element={
                              <ProtectedRoute>
                                <Shop />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/profil/:spillerID"
                            element={
                              <ProtectedRoute>
                                <Profile />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/endreprofil"
                            element={
                              <ProtectedRoute>
                                <EditProfile />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/notater"
                            element={
                              <ProtectedRoute>
                                <Notebook />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/svarteliste"
                            element={
                              <ProtectedRoute>
                                <Blacklist />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/familie"
                            element={
                              <ProtectedRoute>
                                <Family />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/familie/profil/:familieID"
                            element={
                              <ProtectedRoute>
                                <FamilyProfile />
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
                            path="/forum/post/:postId"
                            element={
                              <ProtectedRoute>
                                <ForumThread />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/innflytelse"
                            element={
                              <ProtectedRoute>
                                <Influence />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/kriminalitet"
                            element={
                              <ProtectedRoute>
                                <StreetCrime />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/ran"
                            element={
                              <ProtectedRoute>
                                <Robbery />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/biltyveri"
                            element={
                              <ProtectedRoute>
                                <GTA />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/drep"
                            element={
                              <ProtectedRoute>
                                <Assassinate />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/bank"
                            element={
                              <ProtectedRoute>
                                <Bank />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/parkering"
                            element={
                              <ProtectedRoute>
                                <Parking />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/fengsel"
                            element={
                              <ProtectedRoute>
                                <Prison />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/flyplass"
                            element={
                              <ProtectedRoute>
                                <Travel />
                              </ProtectedRoute>
                            }
                          />

                          {/* Gambling */}
                          <Route
                            path="/jackpot"
                            element={
                              <ProtectedRoute>
                                <Jackpot />
                              </ProtectedRoute>
                            }
                          />
                        </Routes>
                      </Layout>
                    </div>
                  </div>
                  <Footer />
                </div>
              </Router>
            </MenuProvider>
          </MusicProvider>
        </CooldownProvider>
      </CharacterProvider>
    </AuthProvider>
  );
}

export default App;
