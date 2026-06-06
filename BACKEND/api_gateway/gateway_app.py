# api_gateway/gateway_app.py
from flask import Flask, request, jsonify
import json
import sys
import os

# Añadir la carpeta shared al path para importar soa_lib
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'shared')))
from soa_lib import connect_to_bus, send_message, receive_message

app = Flask(__name__)

def enviar_a_microservicio(nombre_servicio, payload_dict):
    """Función cliente genérica basada en soa_client.py"""
    sock = connect_to_bus()
    try:
        # Convertir el diccionario a string JSON
        payload_str = json.dumps(payload_dict)
        send_message(sock, nombre_servicio, payload_str)
        
        # Esperar respuesta
        data = receive_message(sock)
        if data:
            # Elimina los 5 caracteres del nombre del servicio en la respuesta
            respuesta_str = data[5:].decode()
            try:
                return json.loads(respuesta_str)
            except json.JSONDecodeError:
                return {"status": "error", "message": respuesta_str}
    except Exception as e:
        return {"error": str(e)}
    finally:
        sock.close()
    return {"error": "Sin respuesta del bus"}

# RF-001 (Gestión de inventario)
@app.route('/api/inventario/equipos', methods=['GET'])
def obtener_equipos():
    estado = request.args.get('estado', '')
    tipo = request.args.get('tipo', '')
    
    # Preparamos el payload y llamamos al servicio de inventario ("inven")
    peticion = {
        "accion": "listar_equipos",
        "estado": estado,
        "tipo": tipo
    }
    respuesta = enviar_a_microservicio("inven", peticion)
    return jsonify(respuesta)

# RF-002 (Sistema de reservas)
@app.route('/api/reservas/solicitar', methods=['POST'])
def solicitar_reserva():
    datos_reserva = request.json
    respuesta = enviar_a_microservicio("reser", datos_reserva)
    return jsonify(respuesta), 201

# Enrutador dinámico (Catch-all) para los demás endpoints del frontend
SERVICE_MAP = {
    'auth': 'authe',
    'inventario': 'inven',
    'reservas': 'reser',
    'logistica': 'logis',
    'mantenimiento': 'mante',
    'reportes': 'repor'
}

@app.route('/api/<modulo>', defaults={'subruta': ''}, methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
@app.route('/api/<modulo>/<path:subruta>', methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
def catch_all(modulo, subruta):
    if modulo in SERVICE_MAP:
        # Construir payload basado en si es json o query params
        payload = request.json if request.is_json else request.args.to_dict()
        if payload is None:
            payload = {}
        payload['accion'] = subruta
        
        # Enviar al microservicio correspondiente
        respuesta = enviar_a_microservicio(SERVICE_MAP[modulo], payload)
        
        # Si el microservicio indicó un error manejado, devolver HTTP 400
        if isinstance(respuesta, dict):
            if respuesta.get("status") == "error":
                # Extraemos el mensaje de error para que React lo parsee de la forma esperada
                return jsonify({"error": respuesta.get("message")}), 400
            if "error" in respuesta:
                return jsonify(respuesta), 500
            
        return jsonify(respuesta), 200
        
    return jsonify({"error": f"Módulo '{modulo}' no encontrado"}), 404

if __name__ == '__main__':
    # El API Gateway corre en el puerto 8080 para recibir peticiones web
    app.run(port=8080, debug=True)