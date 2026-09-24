import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  ClipboardList,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import logo from '../../assets/logo.png';
import { useAuth } from '../../models/context/AuthContext.jsx'
import './Login.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CAPSULAS = [
  { tipo: 'ambar', top: '6%', left: '58%', ancho: 150, alto: 56, giro: -32, duracion: 8, retraso: 0, opacidad: 0.95 },
  { tipo: 'menta', top: '70%', left: '62%', ancho: 190, alto: 70, giro: 24, duracion: 10, retraso: 1.2, opacidad: 0.55 },
  { tipo: 'blanca', top: '84%', left: '6%', ancho: 120, alto: 44, giro: -18, duracion: 9, retraso: 0.6, opacidad: 0.35 },
  { tipo: 'menta', top: '28%', left: '-3%', ancho: 100, alto: 38, giro: 48, duracion: 11, retraso: 2, opacidad: 0.25 },
  { tipo: 'ambar', top: '46%', left: '84%', ancho: 84, alto: 32, giro: 62, duracion: 7, retraso: 1.8, opacidad: 0.5 },
];

const BENEFICIOS = [
  { icono: ClipboardList, titulo: 'Tus compras anteriores', texto: 'Revisa qué pediste y cuándo.' },
  { icono: RotateCcw, titulo: 'Volver a comprar', texto: 'Repite un pedido con un solo clic.' },
  { icono: ShieldCheck, titulo: 'Tus datos protegidos', texto: 'Solo tú ves tu perfil y tu historial.' },
];

const contenedor = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

function Campo({ id, etiqueta, icono: Icono, error, extra, children }) {
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
    </motion.div>
  );
}

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const reducirMovimiento = useReducedMotion();
  const sacudida = useAnimationControls();

  const destinoSolicitado = location.state?.from?.pathname;
  const destinoPara = (usuario) => destinoSolicitado || (usuario?.rol === 'admin' ? '/admin' : '/');


  // Si ya había sesión al abrir /login, no tiene sentido mostrar el formulario
  const [yaTeniaSesion] = useState(Boolean(user));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [bienvenido, setBienvenido] = useState(null);

  // Tras el mensaje de bienvenida, se va a la página de origen (o al inicio)
  useEffect(() => {
  if (!bienvenido) return undefined;
  const temporizador = setTimeout(
    () => navigate(destinoPara(bienvenido), { replace: true }),
    1300
  );
  return () => clearTimeout(temporizador);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [bienvenido, navigate]);

if (yaTeniaSesion) return <Navigate to={destinoPara(user)} replace />;

  const sacudir = () =>
    sacudida.start({ x: [0, -10, 10, -7, 7, 0], transition: { duration: 0.4 } });

  const validar = () => {
    const nuevos = {};
    if (!email.trim()) nuevos.email = 'Escribe tu correo electrónico.';
    else if (!EMAIL_RE.test(email.trim())) nuevos.email = 'Revisa el correo: falta el @ o el dominio.';
    if (!password) nuevos.password = 'Escribe tu contraseña.';
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
      const usuario = await login(email, password);
      setBienvenido(usuario);
    } catch (err) {
      setErrores({ general: err.message || 'No se pudo iniciar sesión. Inténtalo de nuevo.' });
      sacudir();
    } finally {
      setEnviando(false);
    }
  };

  const usarDatosDeEjemplo = () => {
    setEmail('cliente@sanmarcos.pe');
    setPassword('123456');
    setErrores({});
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

          <motion.h1 variants={item}>Tus pedidos y tus compras, siempre a la mano.</motion.h1>

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
                    cx="26"
                    cy="26"
                    r="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                  <motion.path
                    d="M15 27l8 8 14-16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4, delay: 0.35 }}
                  />
                </svg>
                <h2>Hola, {bienvenido.nombre}</h2>
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
                      <h2 className="login__title">Iniciar sesión</h2>
                      <p className="login__subtitle">Entra para ver tu carrito, tus compras y tu perfil.</p>
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

                    <Campo id="login-email" etiqueta="Correo electrónico" icono={Mail} error={errores.email}>
                      <input
                        id="login-email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="tucorreo@ejemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        aria-invalid={Boolean(errores.email)}
                        aria-describedby={errores.email ? 'login-email-error' : undefined}
                      />
                    </Campo>

                    <Campo
                      id="login-password"
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
                    >
                      <input
                        id="login-password"
                        type={verPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="Tu contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        aria-invalid={Boolean(errores.password)}
                        aria-describedby={errores.password ? 'login-password-error' : undefined}
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
                            Entrando…
                          </>
                        ) : (
                          'Iniciar sesión'
                        )}
                      </motion.button>
                    </motion.div>

                    {/* Solo para pruebas: se quita cuando exista el backend */}
                    <motion.p className="login__demo" variants={item}>
                      Modo de prueba: entra con cualquier correo y contraseña.{' '}
                      <button type="button" onClick={usarDatosDeEjemplo}>
                        Usar datos de ejemplo
                      </button>
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