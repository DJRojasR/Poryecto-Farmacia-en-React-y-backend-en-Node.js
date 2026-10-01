import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShoppingCart,
  ShieldCheck,
  User,
  ClipboardList,
} from 'lucide-react';
import logo from '../../assets/logo.png';
import { useAuth } from '../../models/context/AuthContext.jsx';
import { rutaInicioPorRol } from '../../models/context/AuthRoutes.jsx';
import './Login.css';
import './Registro.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CAPSULAS = [
  { tipo: 'ambar', top: '6%', left: '58%', ancho: 150, alto: 56, giro: -32, duracion: 8, retraso: 0, opacidad: 0.95 },
  { tipo: 'menta', top: '70%', left: '62%', ancho: 190, alto: 70, giro: 24, duracion: 10, retraso: 1.2, opacidad: 0.55 },
  { tipo: 'blanca', top: '84%', left: '6%', ancho: 120, alto: 44, giro: -18, duracion: 9, retraso: 0.6, opacidad: 0.35 },
  { tipo: 'ambar', top: '46%', left: '84%', ancho: 84, alto: 32, giro: 62, duracion: 7, retraso: 1.8, opacidad: 0.5 },
];

const BENEFICIOS = [
  { icono: ShoppingCart, titulo: 'Tu carrito guardado', texto: 'Sigue tu compra desde cualquier dispositivo.' },
  { icono: ClipboardList, titulo: 'Historial de compras', texto: 'Consulta y repite tus pedidos.' },
  { icono: ShieldCheck, titulo: 'Datos protegidos', texto: 'Solo tú ves tu perfil y tu historial.' },
];

const contenedor = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

// 0 a 4 según largo, mayúsculas/minúsculas, números y símbolos
function fuerza(pw) {
  if (!pw) return 0;
  let puntos = 0;
  if (pw.length >= 8) puntos += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) puntos += 1;
  if (/\d/.test(pw)) puntos += 1;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) puntos += 1;
  return puntos;
}

function Campo({ id, etiqueta, icono: Icono, error, extra, children, pie }) {
  return (
    <motion.div className={`login__field${error ? ' login__field--error' : ''}`} variants={item}>
      <label htmlFor={id}>{etiqueta}</label>
      <div className="login__control">
        <Icono size={18} aria-hidden="true" />
        {children}
        {extra}
      </div>
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            id={`${id}-error`}
            className="login__error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AlertCircle size={14} aria-hidden="true" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
      {pie}
    </motion.div>
  );
}

export default function Registro() {
  const { user, registrar } = useAuth();
  const navigate = useNavigate();
  const reducirMovimiento = useReducedMotion();
  const sacudida = useAnimationControls();

  // Si ya había sesión al abrir /registro, no se muestra el formulario
  const [yaTeniaSesion] = useState(Boolean(user));

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [bienvenido, setBienvenido] = useState(null);

  // Tras el mensaje de bienvenida, va a la vista que le corresponde
  useEffect(() => {
    if (!bienvenido) return undefined;
    const temporizador = setTimeout(() => navigate(rutaInicioPorRol(bienvenido), { replace: true }), 1300);
    return () => clearTimeout(temporizador);
  }, [bienvenido, navigate]);

  if (yaTeniaSesion) return <Navigate to={rutaInicioPorRol(user)} replace />;

  const nivel = fuerza(password);
  const etiquetasFuerza = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];

  const sacudir = () => sacudida.start({ x: [0, -10, 10, -7, 7, 0], transition: { duration: 0.4 } });

  const validar = () => {
    const nuevos = {};
    if (nombre.trim().length < 2) nuevos.nombre = 'Escribe tu nombre.';
    if (!email.trim()) nuevos.email = 'Escribe tu correo electrónico.';
    else if (!EMAIL_RE.test(email.trim())) nuevos.email = 'Revisa el correo: falta el @ o el dominio.';
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      nuevos.password = 'Mínimo 8 caracteres, con letras y números.';
    }
    if (confirmar !== password) nuevos.confirmar = 'Las contraseñas no coinciden.';
    return nuevos;
  };

  const handleSubmit = async (evento) => {
    evento.preventDefault();
    if (enviando) return;

    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) {
      sacudir();
      return;
    }

    setEnviando(true);
    try {
      const usuario = await registrar(nombre.trim(), email.trim(), password);
      setBienvenido(usuario);
    } catch (err) {
      // El servidor indica a qué campo pertenece el error (por ejemplo, correo ya registrado)
      setErrores(
        err.campo
          ? { [err.campo]: err.message }
          : { general: err.message || 'No se pudo crear la cuenta. Inténtalo de nuevo.' }
      );
      sacudir();
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="login">
      <aside className="login__aside">
        {CAPSULAS.map((c, i) => (
          <motion.span
            key={i}
            className={`login__capsule login__capsule--${c.tipo}`}
            style={{ top: c.top, left: c.left, width: c.ancho, height: c.alto, opacity: c.opacidad }}
            initial={{ rotate: c.giro }}
            animate={reducirMovimiento ? undefined : { y: [0, -16, 0], rotate: [c.giro, c.giro + 10, c.giro] }}
            transition={{ duration: c.duracion, delay: c.retraso, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden="true"
          />
        ))}

        <motion.div className="login__aside-content" variants={contenedor} initial="hidden" animate="visible">
          <motion.div variants={item}>
            <Link to="/" className="login__brand">
              <img src={logo} alt="" />
              <span>Farmacia San Marcos</span>
            </Link>
          </motion.div>

          <motion.h1 variants={item}>Crea tu cuenta y compra sin hacer fila.</motion.h1>

          <motion.ul className="login__benefits" variants={item}>
            {BENEFICIOS.map(({ icono: Icono, titulo, texto }) => (
              <li key={titulo}>
                <Icono size={20} aria-hidden="true" />
                <span>
                  <strong>{titulo}</strong>
                  {texto}
                </span>
              </li>
            ))}
          </motion.ul>
        </motion.div>
      </aside>

      <main className="login__main">
        <Link to="/" className="login__back">
          <ArrowLeft size={16} aria-hidden="true" />
          Volver al inicio
        </Link>

        <div className="login__panel">
          <Link to="/" className="login__brand login__brand--mobile">
            <img src={logo} alt="" />
            <span>Farmacia San Marcos</span>
          </Link>

          <AnimatePresence mode="wait">
            {bienvenido ? (
              <motion.div
                key="ok"
                className="login__ok"
                role="status"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
              >
                <svg className="login__ok-icon" viewBox="0 0 52 52" width="76" height="76" aria-hidden="true">
                  <motion.circle
                    cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeWidth="3"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }}
                  />
                  <motion.path
                    d="M15 27l8 8 14-16" fill="none" stroke="currentColor" strokeWidth="3.5"
                    strokeLinecap="round" strokeLinejoin="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.35 }}
                  />
                </svg>
                <h2>Cuenta creada, {bienvenido.nombre}</h2>
                <p>Preparando tu cuenta…</p>
              </motion.div>
            ) : (
              <motion.div key="form" exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}>
                <motion.div animate={sacudida}>
                  <motion.form
                    className="login__form"
                    onSubmit={handleSubmit}
                    noValidate
                    variants={contenedor}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.div variants={item}>
                      <h2 className="login__title">Crear cuenta</h2>
                      <p className="login__subtitle">Solo necesitas tu nombre, un correo y una contraseña.</p>
                    </motion.div>

                    <AnimatePresence initial={false}>
                      {errores.general && (
                        <motion.p
                          className="login__alert"
                          role="alert"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <AlertCircle size={16} aria-hidden="true" />
                          {errores.general}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <Campo id="registro-nombre" etiqueta="Nombre" icono={User} error={errores.nombre}>
                      <input
                        id="registro-nombre"
                        type="text"
                        autoComplete="name"
                        placeholder="Tu nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        aria-invalid={Boolean(errores.nombre)}
                        aria-describedby={errores.nombre ? 'registro-nombre-error' : undefined}
                      />
                    </Campo>

                    <Campo id="registro-email" etiqueta="Correo electrónico" icono={Mail} error={errores.email}>
                      <input
                        id="registro-email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="tucorreo@ejemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        aria-invalid={Boolean(errores.email)}
                        aria-describedby={errores.email ? 'registro-email-error' : undefined}
                      />
                    </Campo>

                    <Campo
                      id="registro-password"
                      etiqueta="Contraseña"
                      icono={Lock}
                      error={errores.password}
                      extra={
                        <button
                          type="button"
                          className="login__toggle"
                          onClick={() => setVerPassword((v) => !v)}
                          aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          aria-pressed={verPassword}
                        >
                          {verPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      }
                      pie={
                        <div className="registro__strength" aria-live="polite">
                          <div className={`registro__bars registro__bars--${nivel}`} aria-hidden="true">
                            <span /><span /><span /><span />
                          </div>
                          <p className="registro__hint">
                            {nivel ? `Seguridad: ${etiquetasFuerza[nivel]}` : 'Mínimo 8 caracteres, con letras y números.'}
                          </p>
                        </div>
                      }
                    >
                      <input
                        id="registro-password"
                        type={verPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Crea una contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        aria-invalid={Boolean(errores.password)}
                        aria-describedby={errores.password ? 'registro-password-error' : undefined}
                      />
                    </Campo>

                    <Campo id="registro-confirmar" etiqueta="Confirmar contraseña" icono={Lock} error={errores.confirmar}>
                      <input
                        id="registro-confirmar"
                        type={verPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Repite tu contraseña"
                        value={confirmar}
                        onChange={(e) => setConfirmar(e.target.value)}
                        aria-invalid={Boolean(errores.confirmar)}
                        aria-describedby={errores.confirmar ? 'registro-confirmar-error' : undefined}
                      />
                    </Campo>

                    <motion.div variants={item}>
                      <motion.button
                        type="submit"
                        className="btn btn--primary btn--full login__submit"
                        disabled={enviando}
                        whileHover={enviando ? undefined : { scale: 1.02 }}
                        whileTap={enviando ? undefined : { scale: 0.97 }}
                      >
                        {enviando ? (
                          <>
                            <Loader2 size={18} className="login__spin" aria-hidden="true" />
                            Creando cuenta…
                          </>
                        ) : (
                          'Crear cuenta'
                        )}
                      </motion.button>
                    </motion.div>

                    <motion.p className="registro__switch" variants={item}>
                      ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
                    </motion.p>
                  </motion.form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
