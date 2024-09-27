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
import About from "./Pages/About.tsx";
import Signup from "./Pages/Signup.tsx";
import Login from "./Pages/Login.tsx";
import CreateCharacter from "./Pages/CreateCharacter.tsx";
import Influence from "./Pages/Reputation/Influence";

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
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={<Login />} />
                <Route path="/createcharacter" element={<CreateCharacter />} />
                <Route path="/influence" element={<Influence />} />
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
