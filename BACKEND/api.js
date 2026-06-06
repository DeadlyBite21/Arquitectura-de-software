const express = require('express');
const router  = express.Router();

const reservasCtrl     = require('../controllers/reservasController');
const prestamosCtrl    = require('../controllers/prestamosController');
const mantenimientoCtrl = require('../controllers/mantenimientoController');
const reportesCtrl     = require('../controllers/reportesController');
const { authenticate, authorize } = require('../middleware/auth');

// ─── RESERVAS ─────────────────────────────────────────────────────────────────
router.post('/reservas/solicitar',     authenticate, reservasCtrl.solicitarReserva);
router.get('/reservas',                authenticate, reservasCtrl.getReservas);
router.get('/reservas/:id',            authenticate, reservasCtrl.getReservaById);
router.patch('/reservas/:id/aprobar',  authenticate, authorize('Administrador'), reservasCtrl.aprobarReserva);

// ─── LOGÍSTICA / PRÉSTAMOS ────────────────────────────────────────────────────
router.post('/logistica/entrega',                      authenticate, authorize('Administrador', 'Encargado'), prestamosCtrl.registrarEntrega);
router.post('/logistica/devolucion/:id_prestamo',      authenticate, authorize('Administrador', 'Encargado'), prestamosCtrl.registrarDevolucion);
router.get('/logistica/prestamos',                     authenticate, prestamosCtrl.getPrestamos);
router.get('/logistica/prestamos/:id',                 authenticate, prestamosCtrl.getPrestamoById);

// ─── MANTENIMIENTO Y BITÁCORA ─────────────────────────────────────────────────
router.post('/mantenimiento/bitacora',          authenticate, authorize('Administrador', 'Encargado'), mantenimientoCtrl.registrarBitacora);
router.get('/mantenimiento/bitacora',           authenticate, mantenimientoCtrl.getBitacora);
router.get('/mantenimiento/bitacora/:id',       authenticate, mantenimientoCtrl.getBitacoraById);
router.post('/mantenimiento/programar',         authenticate, authorize('Administrador', 'Encargado'), mantenimientoCtrl.programarMantenimiento);
router.get('/mantenimiento/programados',        authenticate, mantenimientoCtrl.getMantenimientos);
router.patch('/mantenimiento/programados/:id/completar', authenticate, authorize('Administrador', 'Encargado'), mantenimientoCtrl.completarMantenimiento);
router.get('/mantenimiento/alertas',            authenticate, mantenimientoCtrl.getAlertas);

// ─── REPORTES ─────────────────────────────────────────────────────────────────
router.get('/reportes/disponibilidad',           authenticate, reportesCtrl.getDisponibilidad);
router.get('/reportes/equipos-mas-solicitados',  authenticate, reportesCtrl.getEquiposMasSolicitados);
router.get('/reportes/tasa-danos',               authenticate, reportesCtrl.getTasaDanos);
router.get('/reportes/resumen-general',          authenticate, reportesCtrl.getResumenGeneral);

module.exports = router;