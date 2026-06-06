source .venv/bin/activate
python bus/soa_bus.py &
BUS_PID=$!
sleep 1
python services/inventario_service.py &
INVEN_PID=$!
python services/reservas_service.py &
RESER_PID=$!
python api_gateway/gateway_app.py &
GATEWAY_PID=$!
sleep 3
echo "Probando Inventario:"
curl -s http://localhost:8080/api/inventario/equipos
echo -e "\n\nProbando Reservas:"
curl -s -X POST http://localhost:8080/api/reservas/solicitar -H "Content-Type: application/json" -d '{"equipo_id": 1, "usuario_id": 10}'
echo -e "\n"
kill $BUS_PID $INVEN_PID $RESER_PID $GATEWAY_PID
