import { Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar/Navbar.jsx';
import Footer from './components/Footer/Footer.jsx';
import Inicio from './components/Inicio/Inicio.jsx';
import Medicamentos from './components/Medicamentos/Medicamentos.jsx';
// import Recetas from './components/Recetas/Recetas.jsx';
import Nosotros from './components/Nosotros/Nosotros.jsx';
import Contacto from './components/Contacto/Contacto.jsx';

const App = () => {
  return (
    <div className="app">
      <Navbar />

      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/medicamentos" element={<Medicamentos />} />
        {/*<Route path="/recetas" element={<Recetas />} />*/}
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="*" element={<h2 style={{ padding: '2rem' }}>Página no encontrada</h2>} />
      </Routes>

      <Footer />
    </div>
  );
};

export default App;