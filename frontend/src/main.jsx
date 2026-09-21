import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './models/context/AuthContext.jsx';
import { CartProvider } from './components/Auth/Cart/CartContext.jsx';

createRoot(document.getElementById('root')).render(
 <BrowserRouter>
  <AuthProvider>
    <CartProvider>
      <App />
    </CartProvider>
  </AuthProvider>
</BrowserRouter>
);