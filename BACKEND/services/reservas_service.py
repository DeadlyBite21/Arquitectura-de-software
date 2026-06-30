import json
import sys
import os

# Añadir la carpeta shared al path para importar soa_lib
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'shared')))
from soa_lib import connect_to_bus, send_message, receive_message

def start_service():
    sock = connect_to_bus()
    
    try:
        # 1. Registro inicial (sinit)
        print("[RESERVAS] Registrando servicio 'reser'...")
        send_message(sock, "sinit", "reser")
        
        # 2. Procesar respuesta del sinit
        init_data = receive_message(sock)
        print(f"[RESERVAS] Confirmación de bus recibida: {init_data!r}")
        print("[RESERVAS] Servicio listo para recibir transacciones.\n")
        
        # Base de datos persistente en archivo JSON
        data_file = os.path.join(os.path.dirname(__file__), '..', 'data', 'reservas.json')
        
        def save_data(reservas_list):
            with open(data_file, 'w') as f:
                json.dump(reservas_list, f, indent=4)
                
        def load_data():
            if os.path.exists(data_file):
                with open(data_file, 'r') as f:
                    return json.load(f)
            return []
            
        reservas = load_data()
        next_id = max([r["id_reserva"] for r in reservas], default=0) + 1
        
        # 3. Bucle principal de trabajo
        while True:
            data = receive_message(sock)
            if not data:
                print("[RESERVAS] Conexión cerrada por el bus.")
                break
                
            # Extraer el payload
            mensaje_str = data[5:].decode()
            print(f"[RESERVAS] Mensaje recibido del cliente: '{mensaje_str}'")
            
            try:
                peticion = json.loads(mensaje_str)
                accion = peticion.get("accion", "")
                
                if accion == "solicitar":
                    # Crear nueva reserva
                    equipos_sol = peticion.get("equipos", [])
                    if len(equipos_sol) > 0:
                        nueva_reserva = {
                            "id_reserva": next_id,
                            "evento": peticion.get("evento", "Evento sin nombre"),
                            "fecha_inicio": peticion.get("fecha_inicio"),
                            "fecha_fin": peticion.get("fecha_fin"),
                            "estado_equipos": "Pendiente",
                            "observaciones": peticion.get("observaciones", ""),
                            "solicitante": "Administrador", # Simulado
                            "cantidad_solicitada": sum(e.get("cantidad", 1) for e in equipos_sol),
                            "equipos": equipos_sol
                        }
                        # Rellenar datos falsos para la vista detallada
                        for i, eq in enumerate(nueva_reserva["equipos"]):
                            eq["codigo_inventario"] = f"EQ-TEMP-{i}"
                            eq["modelo"] = "Modelo Solicitado"
                            eq["id_detalle"] = i
                            
                        reservas.append(nueva_reserva)
                        save_data(reservas)
                        next_id += 1
                        respuesta = {"status": "success", "message": "Reserva creada exitosamente", "data": nueva_reserva}
                    else:
                        respuesta = {"status": "error", "message": "Debes solicitar al menos un equipo."}
                        
                elif accion == "":
                    # Listar todas las reservas (GET /api/reservas)
                    estado = peticion.get("estado", "")
                    resultado = reservas
                    if estado:
                        resultado = [r for r in reservas if r.get("estado_equipos") == estado]
                    respuesta = {"status": "success", "data": resultado}
                    
                elif accion.isdigit():
                    # Obtener reserva por ID (GET /api/reservas/<id>)
                    res_id = int(accion)
                    reserva = next((r for r in reservas if r["id_reserva"] == res_id), None)
                    if reserva:
                        respuesta = {"status": "success", "data": reserva}
                    else:
                        respuesta = {"status": "error", "message": "Reserva no encontrada"}
                        
                elif accion.endswith("/aprobar"):
                    # Aprobar o rechazar reserva
                    partes = accion.split("/")
                    res_id = int(partes[0]) if partes[0].isdigit() else -1
                    reserva = next((r for r in reservas if r["id_reserva"] == res_id), None)
                    
                    if reserva:
                        nuevo_estado = peticion.get("estado", "Aprobada")
                        reserva["estado_equipos"] = nuevo_estado
                        save_data(reservas)
                        respuesta = {"status": "success", "message": f"Reserva {nuevo_estado}", "data": reserva}
                    else:
                        respuesta = {"status": "error", "message": "Reserva no encontrada"}
                else:
                    respuesta = {"status": "error", "message": f"Acción desconocida en reservas: {accion}"}
                    
            except json.JSONDecodeError:
                respuesta = {"status": "error", "message": "Formato JSON inválido"}
            except Exception as e:
                respuesta = {"status": "error", "message": f"Error interno: {str(e)}"}
            
            # Responder al cliente a través del bus
            send_message(sock, "reser", json.dumps(respuesta))
            print("[RESERVAS] Respuesta enviada.")

    except Exception as e:
        print(f"[RESERVAS] Error en el servicio: {e}")
    finally:
        print('[RESERVAS] Cerrando socket del servicio')
        sock.close()

if __name__ == "__main__":
    start_service()
