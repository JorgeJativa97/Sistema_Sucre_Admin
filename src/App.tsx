// Componente raíz de la aplicación.
// Define todas las rutas usando React Router v7.
// Las rutas dentro de <AppLayout> comparten el layout principal (sidebar + header).
// La ruta comodín (*) muestra la página 404 para cualquier URL no reconocida.

import { BrowserRouter as Router, Routes, Route } from "react-router";
import NotFound from "./pages/OtherPage/NotFound";
import Blank from "./pages/Blank";
import Home from "./pages/Dashboard/Home";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import MyReporte from "./pages/Reporte/MyReporte";
import BienesInmuebles from "./pages/Reporte/BienesInmuebles";
import Comprobante from "./pages/Reporte/Comprobante";
import Recaudacion from "./pages/Reporte/Recaudacion";

export default function App() {
  return (
    <Router>
      {/* Hace scroll al tope de la página cada vez que cambia la ruta */}
      <ScrollToTop />
      <Routes>
        {/* Rutas con layout principal (sidebar + header) */}
        <Route element={<AppLayout />}>
          <Route index path="/" element={<Home />} />
          <Route path="/blank" element={<Blank />} />
          <Route path="/MyReporte" element={<MyReporte />} />
          <Route path="/BienesInmuebles" element={<BienesInmuebles />} />
          <Route path="/Comprobante" element={<Comprobante />} />
          <Route path="/Recaudacion" element={<Recaudacion />} />
        </Route>

        {/* Ruta comodín: cualquier URL no reconocida muestra la página 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
