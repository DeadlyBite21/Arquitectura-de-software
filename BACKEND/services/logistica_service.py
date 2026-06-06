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
        
        # 3. Bucle principal de trabajo
        while True:
            data = receive_message(sock)
            if not data:
                print("[LOGISTICA] Conexión cerrada por el bus.")
                break
                
            mensaje_str = data[5:].decode()
            print(f"[LOGISTICA] Mensaje recibido del cliente: '{mensaje_str}'")
            
            respuesta = {"status": "success", "message": "Logística no implementada aún"}
            
            # Responder al cliente a través del bus
            send_message(sock, "logis", json.dumps(respuesta))

    except Exception as e:
        print(f"[LOGISTICA] Error en el servicio: {e}")
    finally:
        sock.close()

if __name__ == "__main__":
    start_service()
