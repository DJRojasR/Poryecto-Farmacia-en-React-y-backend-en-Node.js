import { Router } from 'express';
import { login, perfil, registrar } from '../controller/controller_auth.js';
import { verificarToken } from '../middlewares/auth.js';
import { limiteLogin, limiteRegistro } from '../middlewares/rate_limit.js';

const router = Router();

router.post('/registro', limiteRegistro, registrar);
router.post('/login', limiteLogin, login);
router.get('/me', verificarToken, perfil);

export default router;