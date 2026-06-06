const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/inventarioController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/equipos', authenticate, ctrl.getEquipos);
router.get('/equipos/estadisticas', authenticate, ctrl.getEstadisticas);
router.get('/equipos/:id', authenticate, ctrl.getEquipoById);
router.post('/equipos', authenticate, authorize('Administrador', 'Encargado'), ctrl.createEquipo);
router.put('/equipos/:id', authenticate, authorize('Administrador', 'Encargado'), ctrl.updateEquipo);
router.patch('/equipos/:id/baja', authenticate, authorize('Administrador'), ctrl.darDeBaja);

module.exports = router;