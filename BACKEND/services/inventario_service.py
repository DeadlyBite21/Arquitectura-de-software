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
        
        # Base de datos persistente en archivo JSON
        data_file = os.path.join(os.path.dirname(__file__), '..', 'data', 'inventario.json')
        
        def save_data(equipos_list):
            with open(data_file, 'w') as f:
                json.dump(equipos_list, f, indent=4)
                
        def load_data():
            if os.path.exists(data_file):
                with open(data_file, 'r') as f:
                    return json.load(f)
            # Datos por defecto si el archivo no existe
            default_equipos = [
                {"id_equipo": 1, "codigo_inventario": "VHF-001", "modelo": "UV-5R", "marca": "Baofeng", "tipo": "VHF", "estado_operativo": "Operativo", "fecha_adquisicion": "2024-01-15"},
                {"id_equipo": 2, "codigo_inventario": "UHF-002", "modelo": "BF-888S", "marca": "Baofeng", "tipo": "UHF", "estado_operativo": "En reparacion", "fecha_adquisicion": "2023-11-20"},
                {"id_equipo": 3, "codigo_inventario": "BAS-001", "modelo": "FT-2980R", "marca": "Yaesu", "tipo": "Base", "estado_operativo": "Operativo", "fecha_adquisicion": "2022-05-10"}
            ]
            save_data(default_equipos)
            return default_equipos
            
        equipos = load_data()
        next_id = max([e["id_equipo"] for e in equipos], default=0) + 1
        
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
                    
                    resultado = equipos.copy()
                    # Filtrar si es necesario
                    if estado:
                        resultado = [e for e in resultado if e["estado_operativo"].lower() == estado.lower()]
                    if tipo:
                        resultado = [e for e in resultado if e["tipo"].lower() == tipo.lower()]
                        
                    respuesta = {"status": "success", "data": resultado}
                    
                elif accion == "equipos/estadisticas":
                    # Calcular estadísticas
                    stats = {
                        "total": len(equipos),
                        "operativos": sum(1 for e in equipos if e.get("estado_operativo") == "Operativo"),
                        "en_reparacion": sum(1 for e in equipos if e.get("estado_operativo") == "En reparacion"),
                        "de_baja": sum(1 for e in equipos if e.get("estado_operativo") == "De baja")
                    }
                    respuesta = {"status": "success", "data": stats}
                    
                elif accion == "equipos":
                    # Acción 'equipos' enviada por el catch-all para POST (Crear equipo)
                    nuevo_equipo = {
                        "id_equipo": next_id,
                        "codigo_inventario": peticion.get("codigo_inventario", f"EQ-{next_id}"),
                        "modelo": peticion.get("modelo", "Desconocido"),
                        "marca": peticion.get("marca", "Desconocida"),
                        "tipo": peticion.get("tipo", "VHF"),
                        "estado_operativo": peticion.get("estado_operativo", "Operativo"),
                        "fecha_adquisicion": peticion.get("fecha_adquisicion", "")
                    }
                    equipos.append(nuevo_equipo)
                    save_data(equipos)
                    next_id += 1
                    respuesta = {"status": "success", "message": "Equipo creado", "data": nuevo_equipo}
                    
                elif str(accion).startswith("equipos/"):
                    # Extraer el ID y la posible subacción (ej: equipos/1/baja o equipos/1)
                    partes = str(accion).split("/")
                    equipo_id = int(partes[1]) if len(partes) > 1 and partes[1].isdigit() else -1
                    
                    # Buscar el equipo
                    equipo = next((e for e in equipos if e["id_equipo"] == equipo_id), None)
                    
                    if not equipo:
                        respuesta = {"status": "error", "message": "Equipo no encontrado"}
                    elif len(partes) > 2 and partes[2] == "baja":
                        # Dar de baja (PATCH)
                        equipo["estado_operativo"] = "De baja"
                        save_data(equipos)
                        respuesta = {"status": "success", "message": "Equipo dado de baja", "data": equipo}
                    else:
                        # Actualizar (PUT)
                        equipo["codigo_inventario"] = peticion.get("codigo_inventario", equipo["codigo_inventario"])
                        equipo["modelo"] = peticion.get("modelo", equipo["modelo"])
                        equipo["marca"] = peticion.get("marca", equipo["marca"])
                        equipo["tipo"] = peticion.get("tipo", equipo["tipo"])
                        equipo["estado_operativo"] = peticion.get("estado_operativo", equipo["estado_operativo"])
                        equipo["fecha_adquisicion"] = peticion.get("fecha_adquisicion", equipo["fecha_adquisicion"])
                        save_data(equipos)
                        respuesta = {"status": "success", "message": "Equipo actualizado", "data": equipo}
                        
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
