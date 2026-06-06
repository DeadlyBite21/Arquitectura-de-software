import json
import time
import sys
import os

# Añadir la carpeta shared al path para importar soa_lib
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'shared')))
from soa_lib import connect_to_bus, send_message, receive_message

def start_service():
    sock = connect_to_bus()
    
    try:
        # 1. Registro inicial (sinit)
        print("[INVENTARIO] Registrando servicio 'inven'...")
        send_message(sock, "sinit", "inven")
        
        # 2. Procesar respuesta del sinit
        init_data = receive_message(sock)
        print(f"[INVENTARIO] Confirmación de bus recibida: {init_data!r}")
        print("[INVENTARIO] Servicio listo para recibir transacciones.\n")
        
        # 3. Bucle principal de trabajo
        while True:
            data = receive_message(sock)
            if not data:
                print("[INVENTARIO] Conexión cerrada por el bus.")
                break
                
            # Extraer el payload (salta los 5 caracteres del nombre del servicio)
            mensaje_str = data[5:].decode()
            print(f"[INVENTARIO] Mensaje recibido del cliente: '{mensaje_str}'")
            
            try:
                peticion = json.loads(mensaje_str)
                accion = peticion.get("accion")
                
                if accion == "listar_equipos":
                    estado = peticion.get("estado", "")
                    tipo = peticion.get("tipo", "")
                    
                    # Simular datos de base de datos
                    equipos = [
                        {"id": 1, "nombre": "Osciloscopio Digital", "tipo": "Medición", "estado": "Disponible"},
                        {"id": 2, "nombre": "Multímetro Fluke", "tipo": "Medición", "estado": "En Uso"},
                        {"id": 3, "nombre": "Generador de Señales", "tipo": "Generación", "estado": "Disponible"}
                    ]
                    
                    # Filtrar si es necesario
                    if estado:
                        equipos = [e for e in equipos if e["estado"].lower() == estado.lower()]
                    if tipo:
                        equipos = [e for e in equipos if e["tipo"].lower() == tipo.lower()]
                        
                    respuesta = {"status": "success", "data": equipos}
                else:
                    respuesta = {"status": "error", "message": f"Acción desconocida: {accion}"}
                    
            except json.JSONDecodeError:
                respuesta = {"status": "error", "message": "Formato JSON inválido"}
            except Exception as e:
                respuesta = {"status": "error", "message": f"Error interno: {str(e)}"}
            
            # Responder al cliente a través del bus
            send_message(sock, "inven", json.dumps(respuesta))
            print("[INVENTARIO] Respuesta enviada.")

    except Exception as e:
        print(f"[INVENTARIO] Error en el servicio: {e}")
    finally:
        print('[INVENTARIO] Cerrando socket del servicio')
        sock.close()

if __name__ == "__main__":
    start_service()
