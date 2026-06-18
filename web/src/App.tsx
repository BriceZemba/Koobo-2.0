import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import FloatingWhatsApp from "./components/FloatingWhatsApp";
import Landing from "./pages/Landing";
import Chat from "./pages/Chat";
import Detection from "./pages/Detection";
import Crop from "./pages/Crop";
import Meteo from "./pages/Meteo";
import Usage from "./pages/Usage";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

export default function App() {
  const { pathname } = useLocation();
  // Footer affiché sur l'accueil et la météo (pages "contenu") ; masqué sur les
  // pages outil plein écran (chat, détection, cultures).
  const showFooter = pathname === "/" || pathname === "/meteo" || pathname === "/usage";
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/detection" element={<Detection />} />
          <Route path="/crop" element={<Crop />} />
          <Route path="/meteo" element={<Meteo />} />
          <Route path="/usage" element={<Usage />} />
        </Routes>
      </main>
      {showFooter && <Footer />}
      <FloatingWhatsApp />
    </div>
  );
}
