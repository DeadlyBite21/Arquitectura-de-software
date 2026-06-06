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
        print("[MANTENIMIENTO] Registrando servicio 'mante'...")
        send_message(sock, "sinit", "mante")
        
        # 2. Procesar respuesta del sinit
        init_data = receive_message(sock)
        print(f"[MANTENIMIENTO] Confirmación de bus recibida: {init_data!r}")
        print("[MANTENIMIENTO] Servicio listo para recibir transacciones.\n")
        
        # 3. Bucle principal de trabajo
        while True:
            data = receive_message(sock)
            if not data:
                print("[MANTENIMIENTO] Conexión cerrada por el bus.")
                break
                
            mensaje_str = data[5:].decode()
            print(f"[MANTENIMIENTO] Mensaje recibido del cliente: '{mensaje_str}'")
            
            respuesta = {"status": "success", "message": "Mantenimiento no implementado aún"}
            
            # Responder al cliente a través del bus
            send_message(sock, "mante", json.dumps(respuesta))

    except Exception as e:
        print(f"[MANTENIMIENTO] Error en el servicio: {e}")
    finally:
        sock.close()

if __name__ == "__main__":
    start_service()
