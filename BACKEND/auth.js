const express = require('express');
const router = express.Router();
const { login, me, register, getUsuarios, toggleUsuario } = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', authenticate, me);
router.post('/register', authenticate, authorize('Administrador'), register);
router.get('/usuarios', authenticate, authorize('Administrador'), getUsuarios);
router.patch('/usuarios/:id/toggle', authenticate, authorize('Administrador'), toggleUsuario);

module.exports = router;