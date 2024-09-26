import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Components
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Layout from "./components/Layout";
import Infobar from "./components/Infobar";

// Pages
import Influence from "./Pages/Reputation/Influence";

function App() {
  return (
    <Router>
      <Header />
      <Infobar />
      <Layout>
        <Sidebar />
        <Routes>
          <Route path="/" element={<Influence />} />
          <Route path="/influence" element={<Influence />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
