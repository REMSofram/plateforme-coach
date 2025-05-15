import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ClientList from "./pages/ClientList";
import ClientDetail from "./pages/ClientDetail";
import Layout from "./components/Layout";
import Profil from "./pages/Profil";
import Settings from "./pages/Settings";
import Help from "./pages/Help";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="clients" element={<ClientList />} />
          <Route path="client/:id" element={<ClientDetail />} />
          <Route path="profil" element={<Profil />} />
          <Route path="parametres" element={<Settings />} />
          <Route path="aide" element={<Help />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
