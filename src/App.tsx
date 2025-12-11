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
import SidebarRight from "./components/SidebarRight";
import Layout from "./components/Layout";
import ContentWrap from "./components/ContentWrap";
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
import FindPlayer from "./Pages/FindPlayer.tsx";
import Statistics from "./Pages/Statistics.tsx";

import Intro from "./Pages/Sceenes/Intro.tsx";

// Left dropdown menu
import Profile from "./Pages/Profile.tsx";
import EditProfile from "./Pages/EditProfile.tsx";
import Blacklist from "./Pages/Contacts.tsx";
// _____________________________________________
import Home from "./Pages/Home.tsx";
import Market from "./Pages/Market.tsx";
import Bank from "./Pages/General/Bank.tsx";
// _____________________________________________
import Family from "./Pages/Family.tsx";
import FamilyProfile from "./Pages/FamilyProfile.tsx";
// _____________________________________________
import Influence from "./Pages/Reputation/Influence";
// Crimes ______________________________________
import StreetCrime from "./Pages/Crime/StreetCrime.tsx";
import GTA from "./Pages/Crime/GTA.tsx";
import Robbery from "./Pages/Crime/Robbery.tsx";
import Heist from "./Pages/Crime/Heist.tsx";
import Assassinate from "./Pages/Crime/Assassinate.tsx";
// General ______________________________________
import Travel from "./Pages/General/Travel.tsx";
import Prison from "./Pages/General/Prison.tsx";
import Hospital from "./Pages/General/Hospital.tsx";
import Parking from "./Pages/General/Parking.tsx";
// Gambling ______________________________________
import Casino from "./Pages/Gambling/Casino.tsx";

import Support from "./Pages/Support.tsx";
import SalesTermsAndConditions from "./Pages/SalesTerms&Conditions.tsx";
import PrivacyPolicy from "./Pages/PrivacyPolicy.tsx";

import Signup from "./Pages/Signup.tsx";
import Login from "./Pages/Login.tsx";
import ForgotPassword from "./Pages/ForgotPassword.tsx";
import CreateCharacter from "./Pages/CreateCharacter.tsx";
import SelectCharacter from "./Pages/SelectCharacter.tsx";
import Dead from "./Pages/Dead.tsx";

// City specific
import StreetRacing from "./Pages/StreetRacing.tsx";
import Production from "./Pages/Production/Production.tsx";
import Hacking from "./Pages/Hacking.tsx";

// Protected routes
import ProtectedRoute from "./Routes/ProtectedRoute.tsx";
import ProtectedAdminRoute from "./Routes/ProtectedAdminRoute.tsx";

import NotFound from "./Pages/NotFound.tsx";

// Version control
import VersionWatcher from "./components/VersionWatcher";

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
                  className="flex flex-col relative min-h-dvh "
                >
                  <ContentWrap>
                    <div className="sticky z-30 top-0 left-0 h-[max-content] w-full">
                      <Header />
                      <DropdownLeft />
                      <DropdownRight />
                      <Infobar />
                    </div>

                    <VersionWatcher />

                    <div className="relative flex flex-col flex-grow items-center">
                      <Layout>
                        <ErrorBoundary>
                          <Sidebar />
                        </ErrorBoundary>

                        <Routes>
                          {/* Public Routes */}
                          <Route path="/spillguide" element={<GameGuide />} />
                          <Route path="/support" element={<Support />} />
                          <Route path="/salgsvilkaar" element={<SalesTermsAndConditions />} />
                          <Route path="/personvern" element={<PrivacyPolicy />} />

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
                          <Route path="/finnspiller" element={<FindPlayer />} />

                          <Route path="/statistikk" element={<Statistics />} />
                          <Route path="/registrer" element={<Signup />} />
                          <Route path="/logginn" element={<Login />} />
                          <Route
                            path="/glemtpassord"
                            element={<ForgotPassword />}
                          />
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
                            path="/intro"
                            element={
                              <ProtectedRoute>
                                <Intro />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/marked"
                            element={
                              <ProtectedRoute>
                                <Market />
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
                            path="/biltyveri"
                            element={
                              <ProtectedRoute>
                                <GTA />
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
                            path="/brekk"
                            element={
                              <ProtectedRoute>
                                <Heist />
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
                            path="/sykehus"
                            element={
                              <ProtectedRoute>
                                <Hospital />
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
                            path="/casino"
                            element={
                              <ProtectedRoute>
                                <Casino />
                              </ProtectedRoute>
                            }
                          />

                          {/* City specific */}
                          <Route
                            path="/streetracing"
                            element={
                              <ProtectedRoute>
                                <StreetRacing />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/produksjon"
                            element={
                              <ProtectedRoute>
                                <Production />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/hacking"
                            element={
                              <ProtectedRoute>
                                <Hacking />
                              </ProtectedRoute>
                            }
                          />

                          {/* 404 Route */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>

                        <ErrorBoundary>
                          <SidebarRight />
                        </ErrorBoundary>
                      </Layout>
                    </div>
                  </ContentWrap>
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
