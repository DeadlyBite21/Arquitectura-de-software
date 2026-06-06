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
        
        # 3. Bucle principal de trabajo
        while True:
            data = receive_message(sock)
            if not data:
                print("[RESERVAS] Conexión cerrada por el bus.")
                break
                
            # Extraer el payload (salta los 5 caracteres del nombre del servicio)
            mensaje_str = data[5:].decode()
            print(f"[RESERVAS] Mensaje recibido del cliente: '{mensaje_str}'")
            
            try:
                datos_reserva = json.loads(mensaje_str)
                
                # Aquí iría la lógica para guardar la reserva en la base de datos
                # Simularemos éxito
                if "equipo_id" in datos_reserva and "usuario_id" in datos_reserva:
                    respuesta = {
                        "status": "success",
                        "message": "Reserva creada exitosamente",
                        "reserva_id": 101,
                        "detalles": datos_reserva
                    }
                else:
                    respuesta = {
                        "status": "error",
                        "message": "Faltan datos obligatorios (equipo_id, usuario_id)"
                    }
                    
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
