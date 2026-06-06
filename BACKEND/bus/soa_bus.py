import socket
import threading
import sys
import os

# Añadir la carpeta shared al path para importar soa_lib
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'shared')))
from soa_lib import send_message, receive_message

HOST = 'localhost'
PORT = 5000

# Diccionario para almacenar los sockets de los servicios y sus locks
# Formato: { "nombre_servicio": {"socket": socket, "lock": threading.Lock()} }
services = {}

def handle_client(client_socket, addr):
    print(f"[BUS] Nueva conexión desde {addr}")
    is_service = False
    try:
        while True:
            data = receive_message(client_socket)
            if not data:
                break
            
            # El contenido es: service_name (5 bytes) + payload
            service_name = data[:5].decode()
            payload = data[5:].decode()
            
            print(f"[BUS] Mensaje recibido para '{service_name}': {payload}")

            if service_name == "sinit":
                # Registro de un nuevo microservicio
                # El payload contiene el nombre del servicio que se registra
                service_id = payload
                services[service_id] = {
                    "socket": client_socket,
                    "lock": threading.Lock()
                }
                print(f"[BUS] Servicio '{service_id}' registrado con éxito.")
                send_message(client_socket, "sinit", "OK")
                
                # Para evitar que el finally cierre el socket, seteamos una variable
                is_service = True
                return

            else:
                # Petición a un microservicio
                if service_name in services:
                    svc_info = services[service_name]
                    svc_socket = svc_info["socket"]
                    svc_lock = svc_info["lock"]
                    
                    try:
                        # Bloquear el servicio para manejar esta petición de forma sincrona
                        with svc_lock:
                            # Reenviar petición al servicio
                            send_message(svc_socket, service_name, payload)
                            # Esperar respuesta del servicio
                            respuesta = receive_message(svc_socket)
                            if respuesta:
                                # Reenviar respuesta al cliente
                                client_socket.sendall(str(len(respuesta)).zfill(5).encode() + respuesta)
                            else:
                                print(f"[BUS] El servicio '{service_name}' se desconectó.")
                                del services[service_name]
                                send_message(client_socket, service_name, "Error: Servicio desconectado")
                    except Exception as e:
                        print(f"[BUS] Error al comunicar con '{service_name}': {e}")
                        send_message(client_socket, service_name, f"Error interno: {e}")
                else:
                    print(f"[BUS] Servicio '{service_name}' no encontrado.")
                    send_message(client_socket, service_name, "Error: Servicio no encontrado")
                    
    except Exception as e:
        print(f"[BUS] Error en la conexión con {addr}: {e}")
    finally:
        if not is_service:
            print(f"[BUS] Conexión cerrada con {addr}")
            client_socket.close()

def start_bus():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind((HOST, PORT))
    server.listen(5)
    print(f"[BUS] Escuchando en {HOST}:{PORT}")

    try:
        while True:
            client, addr = server.accept()
            thread = threading.Thread(target=handle_client, args=(client, addr))
            thread.start()
    except KeyboardInterrupt:
        print("\n[BUS] Apagando bus...")
    finally:
        server.close()

if __name__ == "__main__":
    start_bus()
