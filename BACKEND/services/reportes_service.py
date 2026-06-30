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
        print("[REPORTES] Registrando servicio 'repor'...")
        send_message(sock, "sinit", "repor")
        
        # 2. Procesar respuesta del sinit
        init_data = receive_message(sock)
        print(f"[REPORTES] Confirmación de bus recibida: {init_data!r}")
        print("[REPORTES] Servicio listo para recibir transacciones.\n")
        
        data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
        
        def load_json(filename):
            file_path = os.path.join(data_dir, filename)
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r') as f:
                        return json.load(f)
                except Exception:
                    pass
            return []
            
        # 3. Bucle principal de trabajo
        while True:
            data = receive_message(sock)
            if not data:
                print("[REPORTES] Conexión cerrada por el bus.")
                break
                
            mensaje_str = data[5:].decode()
            print(f"[REPORTES] Mensaje recibido del cliente: '{mensaje_str}'")
            try:
                peticion = json.loads(mensaje_str)
                accion = peticion.get("accion", "")
                
                if accion == "resumen-general":
                    inventario = load_json('inventario.json')
                    reservas = load_json('reservas.json')
                    logistica = load_json('logistica.json')
                    
                    equipos_operativos = sum(1 for e in inventario if e.get("estado_operativo") == "Operativo")
                    reservas_pendientes = sum(1 for r in reservas if r.get("estado_equipos") == "Pendiente")
                    prestamos_activos = sum(1 for p in logistica if not p.get("fecha_devolucion_real"))
                    
                    resumen = {
                        "equipos_operativos": equipos_operativos,
                        "reservas_pendientes": reservas_pendientes,
                        "prestamos_activos": prestamos_activos,
                        "alertas_proximas": 0
                    }
                    respuesta = {"status": "success", "data": resumen}
                else:
                    respuesta = {"status": "error", "message": f"Acción desconocida en reportes: {accion}"}
                    
            except json.JSONDecodeError:
                respuesta = {"status": "error", "message": "Formato JSON inválido"}
            except Exception as e:
                respuesta = {"status": "error", "message": f"Error interno: {str(e)}"}
            
            # Responder al cliente a través del bus
            send_message(sock, "repor", json.dumps(respuesta))

    except Exception as e:
        print(f"[REPORTES] Error en el servicio: {e}")
    finally:
        sock.close()

if __name__ == "__main__":
    start_service()
