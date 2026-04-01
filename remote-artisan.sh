#!/bin/bash

# IP del servidor ROOT
SERVER_IP="76.13.126.63"
# Prefijo del contenedor de Digitalizatodo en Coolify
CONTAINER_PREFIX="bo888gk4kg8w0wossc00ccs8"

if [ -z "$1" ]; then
    echo "Uso: ./remote-artisan.sh [comando]"
    echo "Ejemplo: ./remote-artisan.sh migrate:status"
    exit 1
fi

echo "--- Conectando al contenedor activo de Digitalizatodo ---"
ssh root@$SERVER_IP "docker exec \$(docker ps -qf name=$CONTAINER_PREFIX) php artisan $@"
