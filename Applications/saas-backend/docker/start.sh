#!/bin/sh
# Sin set -e: el contenedor nunca crashea aunque falle algo

echo "==> Escribiendo .env desde variables de entorno..."
cat > /var/www/html/.env << EOF
APP_NAME="${APP_NAME:-SaaS}"
APP_ENV="${APP_ENV:-production}"
APP_KEY="${APP_KEY:-}"
APP_DEBUG="${APP_DEBUG:-false}"
APP_URL="${APP_URL:-http://localhost}"
LOG_CHANNEL=stderr
LOG_LEVEL=error
DB_CONNECTION="${DB_CONNECTION:-mysql}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_DATABASE="${DB_DATABASE:-saas_backend}"
DB_USERNAME="${DB_USERNAME:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
CACHE_DRIVER="${CACHE_DRIVER:-database}"
SESSION_DRIVER="${SESSION_DRIVER:-database}"
QUEUE_CONNECTION="${QUEUE_CONNECTION:-database}"
EOF

# Asegurar que si es SQLite, el archivo exista
if [ "$DB_CONNECTION" = "sqlite" ]; then
    mkdir -p $(dirname "/var/www/html/$DB_DATABASE")
    touch "/var/www/html/$DB_DATABASE"
    chown www-data:www-data "/var/www/html/$DB_DATABASE"
fi

echo "==> Generando APP_KEY..."
php artisan key:generate --force 2>/dev/null || true

echo "==> Cacheando config..."
php artisan config:cache || true
php artisan view:cache  || true

echo "==> Publicando assets de Filament..."
php artisan vendor:publish --tag=filament-assets --force 2>/dev/null || true

echo "==> Corriendo migraciones..."
php artisan migrate --force --no-interaction || echo "⚠️  Migraciones fallaron"

echo "==> Creando usuario admin si no existe..."
if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
    php artisan tinker --execute="
        use App\Models\User;
        use Illuminate\Support\Facades\Hash;
        if (!User::where('email', '${ADMIN_EMAIL}')->exists()) {
            User::create([
                'name'     => '${ADMIN_NAME:-Admin}',
                'email'    => '${ADMIN_EMAIL}',
                'password' => Hash::make('${ADMIN_PASSWORD}'),
            ]);
            echo 'Usuario admin creado: ${ADMIN_EMAIL}';
        } else {
            echo 'Usuario admin ya existe';
        }
    " 2>/dev/null || true
fi

echo "==> Storage link..."
php artisan storage:link 2>/dev/null || true

mkdir -p /var/log/supervisor /var/log/nginx /tmp/client_body /tmp/proxy_temp /tmp/fastcgi_temp

echo "==> Iniciando Nginx + PHP-FPM..."
exec /usr/bin/supervisord -c /etc/supervisord.conf
