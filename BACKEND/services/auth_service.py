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
        print("[AUTH] Registrando servicio 'authe'...")
        send_message(sock, "sinit", "authe")
        
        # 2. Procesar respuesta del sinit
        init_data = receive_message(sock)
        print(f"[AUTH] Confirmación de bus recibida: {init_data!r}")
        print("[AUTH] Servicio listo para recibir transacciones.\n")
        
        # 3. Bucle principal de trabajo
        while True:
            data = receive_message(sock)
            if not data:
                print("[AUTH] Conexión cerrada por el bus.")
                break
                
            mensaje_str = data[5:].decode()
            print(f"[AUTH] Mensaje recibido del cliente: '{mensaje_str}'")
            
            try:
                peticion = json.loads(mensaje_str)
                accion = peticion.get("accion")
                
                # Base de datos simulada de usuarios
                USUARIOS = {
                    "admin@agsch.cl":     {"id": 1, "nombre": "Admin", "apellido": "Sistema", "password": "admin1234", "rol": "Administrador"},
                    "encargado@agsch.cl": {"id": 2, "nombre": "Encargado", "apellido": "Prueba", "password": "encargado1234", "rol": "Encargado"},
                    "dirigente@agsch.cl": {"id": 3, "nombre": "Dirigente", "apellido": "Prueba", "password": "dirigente1234", "rol": "Dirigente"}
                }
                
                if accion == "login":
                    email = peticion.get("email")
                    password = peticion.get("password")
                    
                    if email in USUARIOS and USUARIOS[email]["password"] == password:
                        user = USUARIOS[email].copy()
                        del user["password"] # No enviar la contraseña al frontend
                        user["email"] = email
                        user["token"] = f"fake-jwt-token-{user['id']}"
                        respuesta = user
                    else:
                        respuesta = {"status": "error", "message": "Correo o contraseña incorrectos"}
                        
                elif accion == "me":
                    # Simular la validación del token y retornar un usuario.
                    # En un entorno real se extraería el JWT desde las cabeceras.
                    # Por ahora devolvemos un admin simulado para que no se cierre la sesión en F5.
                    respuesta = {
                        "id": 1, "nombre": "Admin", "apellido": "Sistema", 
                        "email": "admin@agsch.cl", "rol": "Administrador"
                    }
                else:
                    respuesta = {"status": "error", "message": f"Acción '{accion}' no implementada en auth"}
                    
            except json.JSONDecodeError:
                respuesta = {"status": "error", "message": "Formato inválido"}
            
            # Responder al cliente a través del bus
            send_message(sock, "authe", json.dumps(respuesta))

    except Exception as e:
        print(f"[AUTH] Error en el servicio: {e}")
    finally:
        sock.close()

if __name__ == "__main__":
    start_service()
