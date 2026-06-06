#!/bin/bash

# Moverse al directorio del backend
cd /home/seba/github/Arquitectura-de-software/BACKEND

# Activar entorno virtual
source .venv/bin/activate

echo "Iniciando Bus SOA..."
python bus/soa_bus.py &
BUS_PID=$!
sleep 1

echo "Iniciando microservicios..."
python services/auth_service.py &
python services/inventario_service.py &
python services/logistica_service.py &
python services/mantenimiento_service.py &
python services/reservas_service.py &

echo "Iniciando API Gateway..."
python api_gateway/gateway_app.py &
GATEWAY_PID=$!

echo "========================================="
echo "✅ Todos los servicios están corriendo en segundo plano."
echo "API Gateway escuchando en el puerto 8080."
echo "Presiona Ctrl+C para detener todos los servicios."
echo "========================================="

# Esperar infinitamente hasta recibir una señal (como Ctrl+C)
trap "echo 'Deteniendo servicios...'; kill 0" SIGINT SIGTERM EXIT
wait
