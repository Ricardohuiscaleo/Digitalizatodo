# Imagen estable Debian Bookworm
FROM php:8.4-fpm-bookworm AS production

WORKDIR /var/www/html

# Cargamos el instalador de extensiones (mucho más rápido y ligero que compilar a mano)
COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/

# Traefik Labels para Reverb (WebSockets)
LABEL traefik.http.routers.reverb.rule="Host(`admin.digitalizatodo.cl`) && PathPrefix(`/app`)"
LABEL traefik.http.routers.reverb.entryPoints="https"
LABEL traefik.http.routers.reverb.service="reverb"
LABEL traefik.http.routers.reverb.tls="true"
LABEL traefik.http.services.reverb.loadbalancer.server.port="8080"

# Herramientas del sistema e instalación de extensiones eficiente
RUN apt-get update && apt-get install -y \
    nginx supervisor curl zip unzip git \
    && install-php-extensions pdo pdo_mysql pdo_sqlite mbstring zip exif pcntl bcmath dom xml gd intl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
ENV COMPOSER_MEMORY_LIMIT=2G
ENV COMPOSER_ALLOW_SUPERUSER=1

# Dependencias PHP (cache layer)
COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-scripts \
    --no-interaction \
    --optimize-autoloader \
    --prefer-dist \
    --no-progress \
    --no-ansi

# Código de la app
COPY . .
RUN composer dump-autoload --optimize --no-scripts

# OPcache y límites PHP
COPY docker/opcache.ini /usr/local/etc/php/conf.d/opcache.ini
COPY docker/php.ini /usr/local/etc/php/conf.d/php-limits.ini

# Permisos
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 755 /var/www/html/storage

# Nginx + Supervisor
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisord.conf

EXPOSE 80 8080

COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
