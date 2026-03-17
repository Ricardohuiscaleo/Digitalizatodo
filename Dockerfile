# Imagen única Debian — más confiable que Alpine para extensiones PHP complejas
FROM php:8.4-fpm AS production

WORKDIR /var/www/html

# Traefik Labels para Reverb (WebSockets)
LABEL traefik.http.routers.reverb.rule="Host(`admin.digitalizatodo.cl`) && PathPrefix(`/app`)"
LABEL traefik.http.routers.reverb.entryPoints="https"
LABEL traefik.http.routers.reverb.service="reverb"
LABEL traefik.http.routers.reverb.tls="true"
LABEL traefik.http.services.reverb.loadbalancer.server.port="8080"

# Herramientas del sistema + extensiones PHP
COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/

RUN apt-get update && apt-get install -y \
    nginx supervisor curl zip unzip git \
    && install-php-extensions \
    pdo_mysql \
    pdo_sqlite \
    bcmath \
    exif \
    gd \
    intl \
    zip \
    pcntl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Dependencias PHP (cache layer)
COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-scripts \
    --no-interaction \
    --optimize-autoloader \
    --prefer-dist

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
