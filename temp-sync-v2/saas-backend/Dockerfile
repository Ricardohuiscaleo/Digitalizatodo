# Imagen única Debian — más confiable que Alpine para extensiones PHP complejas
FROM php:8.4-fpm AS production

WORKDIR /var/www/html

# Herramientas del sistema + extensiones PHP
RUN apt-get update && apt-get install -y \
    nginx supervisor curl zip unzip git \
    libzip-dev libpng-dev libonig-dev libxml2-dev \
    libfreetype6-dev libjpeg62-turbo-dev libwebp-dev \
    libicu-dev libgd-dev libsqlite3-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install \
    pdo pdo_mysql pdo_sqlite \
    mbstring zip \
    exif pcntl bcmath \
    dom xml \
    gd intl \
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

# OPcache
COPY docker/opcache.ini /usr/local/etc/php/conf.d/opcache.ini

# Permisos
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 755 /var/www/html/storage

# Nginx + Supervisor
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisord.conf

EXPOSE 80

COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
