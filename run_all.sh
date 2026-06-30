#!/bin/bash

# Directorio base del proyecto
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================="
echo "🚀 Iniciando Sistema Completo (Backend + Frontend)"
echo "========================================="

# 1. Iniciar el Backend
echo "Iniciando Backend..."
cd "$BASE_DIR/BACKEND"
# Ejecutamos el script de backend en segundo plano
bash run_backend.sh &
BACKEND_PID=$!

# 2. Iniciar el Frontend
echo "Iniciando Frontend..."
cd "$BASE_DIR/FRONTEND"
# Ejecutamos npm start en segundo plano
npm start &
FRONTEND_PID=$!

echo "========================================="
echo "✅ Todos los servicios están en proceso de inicio."
echo "❌ Presiona Ctrl+C para detener todo el sistema."
echo "========================================="

# 3. Función para detener todos los procesos
cleanup() {
    echo ""
    echo "========================================="
    echo "🛑 Deteniendo Sistema Completo..."
    
    # Matar a todos los procesos en el mismo grupo de procesos
    # Esto asegura que también se detengan los microservicios y React
    kill 0
    echo "========================================="
}

# Capturar señal de interrupción (Ctrl+C)
trap cleanup SIGINT SIGTERM EXIT

# Esperar a los procesos en segundo plano
wait
