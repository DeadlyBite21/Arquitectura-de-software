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
        print("[LOGISTICA] Registrando servicio 'logis'...")
        send_message(sock, "sinit", "logis")
        
        # 2. Procesar respuesta del sinit
        init_data = receive_message(sock)
        print(f"[LOGISTICA] Confirmación de bus recibida: {init_data!r}")
        print("[LOGISTICA] Servicio listo para recibir transacciones.\n")
        
        # Base de datos persistente en archivo JSON
        data_file = os.path.join(os.path.dirname(__file__), '..', 'data', 'logistica.json')
        
        def save_data(prestamos_list):
            with open(data_file, 'w') as f:
                json.dump(prestamos_list, f, indent=4)
                
        def load_data():
            if os.path.exists(data_file):
                with open(data_file, 'r') as f:
                    return json.load(f)
            return []
            
        prestamos = load_data()
        next_id = max([p["id_prestamo"] for p in prestamos], default=0) + 1
        
        # 3. Bucle principal de trabajo
        while True:
            data = receive_message(sock)
            if not data:
                print("[LOGISTICA] Conexión cerrada por el bus.")
                break
                
            mensaje_str = data[5:].decode()
            print(f"[LOGISTICA] Mensaje recibido del cliente: '{mensaje_str}'")
            try:
                peticion = json.loads(mensaje_str)
                accion = peticion.get("accion", "")
                
                if accion == "prestamos":
                    # Listar préstamos
                    solo_activos = peticion.get("activos") == "true"
                    resultado = prestamos
                    if solo_activos:
                        resultado = [p for p in prestamos if not p.get("fecha_devolucion_real")]
                    respuesta = {"status": "success", "data": resultado}
                    
                elif accion == "entrega":
                    # Registrar nueva entrega (Préstamo)
                    nuevo_prestamo = {
                        "id_prestamo": next_id,
                        "id_reserva": peticion.get("id_reserva"),
                        "id_equipo": peticion.get("id_equipo"),
                        "codigo_inventario": f"EQ-{peticion.get('id_equipo', 'X')}", # Simulado
                        "modelo": "Equipo en terreno", # Simulado
                        "evento": f"Reserva #{peticion.get('id_reserva', '?')}", # Simulado
                        "encargado_entrega": "Administrador",
                        "fecha_entrega": "2026-06-24T12:00:00", # Timestamp simulado
                        "fecha_devolucion_esperada": "2026-06-25",
                        "estado_entrega": peticion.get("estado_entrega", "Bueno"),
                        "observaciones_entrega": peticion.get("observaciones", ""),
                        "fecha_devolucion_real": None,
                        "estado_devolucion": None
                    }
                    prestamos.append(nuevo_prestamo)
                    save_data(prestamos)
                    next_id += 1
                    respuesta = {"status": "success", "message": "Entrega registrada", "data": nuevo_prestamo}
                    
                elif accion.startswith("devolucion/"):
                    # Registrar devolución
                    partes = accion.split("/")
                    prestamo_id = int(partes[1]) if len(partes) > 1 and partes[1].isdigit() else -1
                    
                    prestamo = next((p for p in prestamos if p["id_prestamo"] == prestamo_id), None)
                    if prestamo:
                        prestamo["estado_devolucion"] = peticion.get("estado_devolucion", "Bueno")
                        prestamo["observaciones_devolucion"] = peticion.get("observaciones", "")
                        prestamo["fecha_devolucion_real"] = "2026-06-24T18:00:00" # Timestamp simulado
                        save_data(prestamos)
                        respuesta = {"status": "success", "message": "Devolución registrada", "data": prestamo}
                    else:
                        respuesta = {"status": "error", "message": "Préstamo no encontrado"}
                        
                else:
                    respuesta = {"status": "error", "message": f"Acción desconocida en logística: {accion}"}
                    
            except json.JSONDecodeError:
                respuesta = {"status": "error", "message": "Formato JSON inválido"}
            except Exception as e:
                respuesta = {"status": "error", "message": f"Error interno: {str(e)}"}
            
            # Responder al cliente a través del bus
            send_message(sock, "logis", json.dumps(respuesta))

    except Exception as e:
        print(f"[LOGISTICA] Error en el servicio: {e}")
    finally:
        sock.close()

if __name__ == "__main__":
    start_service()
