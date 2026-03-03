# Digitaliza Todo - Plataforma Digital Integral

**Digitaliza Todo** es una empresa chilena especializada en transformar ideas en soluciones digitales innovadoras. Ofrecemos desarrollo de software a medida, automatizaciones con IA, páginas web, aplicaciones y marketing digital para revolucionar negocios.

## 🏢 ¿Qué es Digitaliza Todo?

Somos una empresa de tecnología que se dedica a digitalizar completamente los procesos empresariales mediante:

- **Desarrollo de Software**: Aplicaciones web escalables con React/Vue/Angular
- **Páginas Web Profesionales**: Sitios orientados al negocio con SEO optimizado
- **Marketing Digital**: Estrategias integrales con Google Ads, Social Media y Analytics
- **Contenido Audiovisual**: Producción gráfica y videos promocionales
- **Soluciones Digitales**: Automatización empresarial y sistemas de gestión
- **Plataformas Personalizadas**: Desarrollo a medida con arquitectura escalable

### 📊 Nuestros Números
- **+3,000,000** líneas de código desarrolladas
- **+5,000** APIs creadas
- **+90** proyectos completados

### 💰 Precios Desde
- **Apps Web**: $449.890
- **Páginas Web**: $249.890  
- **Marketing Digital**: $30.000 (reunión 1 hora)
- **Contenido RSS**: $19.890
- **Soluciones Digitales**: $124.890 mensual
- **Software a Medida**: $124.890 mensual

Esta landing page es una **aplicación web de una sola vista** construida con Astro que presenta todos nuestros servicios de manera interactiva y moderna.

## 🚀 Características de la Landing Page

- **Sin Scroll**: Todo el contenido en una vista (SPA)
- **Responsive**: Adaptado para móvil, tablet y desktop
- **Navegación Web App**: Menú inferior estilo aplicación móvil
- **Colores Vibrantes**: Paleta magenta, verde flúor, rosa, morado, naranja
- **Iconos Lucide**: Iconografía moderna y vectorial
- **Animaciones Suaves**: Transiciones y efectos hover
- **Sistema Analytics**: Tracking completo de visitantes y conversiones
- **APIs REST**: Backend completo con PHP y MySQL
- **Panel Administrativo**: Gestión de contactos, proyectos y métricas

## 📱 Secciones

1. **Inicio**: Hero con propuesta de valor y CTAs
2. **Servicios**: Grid de 6 servicios en tarjetas cuadradas
3. **Contacto**: Información de contacto y formulario

## 🛠️ Servicios Destacados

### 📱 Apps Web ($449.890)
- E-commerce y ventas online
- React/Vue/Angular
- Responsive Design
- API Integration

### 🌐 Páginas Web ($249.890)
- Orientadas al negocio
- SEO Optimizado
- Carga Rápida
- CMS Incluido

### 📈 Marketing Digital ($30.000/reunión)
- Asesoría estratégica
- Social Media
- Google Ads
- Analytics y consultoría SEO

### 🎥 Contenido RSS ($19.890)
- Contenido gráfico y audiovisual
- Videos promocionales
- Diseño gráfico
- Fotografía profesional

### ⚙️ Soluciones Digitales ($124.890/mes)
- Automatización empresarial
- Sistemas de gestión y monitoreo
- Integraciones
- Bases de datos

### 📊 Software a Medida ($124.890/mes)
- Desarrollo personalizado
- Arquitectura escalable
- Base de datos
- Panel administrativo

## 📁 Estructura del Proyecto

```
digital/
├── src/
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
├── public/
│   └── favicon.svg
├── api/
│   ├── index.php
│   ├── contacts.php
│   ├── projects.php
│   ├── services.php
│   └── search.php
├── config.php
├── database.sql
├── package.json
├── astro.config.mjs
└── README.md
```

## 🎨 Tecnologías

- **Astro**: Framework moderno para sitios estáticos
- **HTML5**: Estructura semántica
- **CSS3**: Flexbox, Grid, Gradientes, Animaciones
- **JavaScript**: Navegación SPA, Interactividad
- **Lucide Icons**: Iconografía vectorial
- **Google Fonts**: Tipografía Poppins

## 🚀 Desarrollo

### Instalación
```bash
npm install
```

### Desarrollo Local
```bash
npm run dev
```

### Build para Producción
```bash
npm run build
```

### Preview
```bash
npm run preview
```

## 📱 Responsive Breakpoints

- **Desktop**: > 1024px (3 columnas)
- **Tablet**: 769px - 1024px (2-3 columnas)
- **Móvil**: < 768px (2 columnas)
- **Móvil Pequeño**: < 480px (optimizado)

## 🌐 Despliegue

### Hostinger
1. Ejecutar `npm run build`
2. Subir contenido de `dist/` al directorio `public_html`

### Netlify/Vercel
1. Conectar repositorio
2. Build command: `npm run build`
3. Publish directory: `dist`

## ⚡ Características Técnicas

- **Sin Scroll**: `overflow: hidden` en body
- **Navegación SPA**: Cambio de secciones sin recarga
- **Centrado Perfecto**: Flexbox y Grid para alineación
- **Optimizado**: Carga rápida con CDN
- **Accesible**: Navegación por teclado y screen readers
- **SEO Optimizado**: Meta tags, Open Graph, Schema markup
- **Semántico**: Estructura HTML5 correcta

## 🔍 SEO y Accesibilidad

### Optimizaciones SEO Implementadas
- **Meta Description**: Descripción optimizada y específica
- **Meta Keywords**: Palabras clave relevantes para Chile
- **Open Graph**: Tags para redes sociales (Facebook, LinkedIn)
- **Twitter Cards**: Optimización para Twitter
- **Schema Markup**: JSON-LD con datos estructurados
- **Canonical URL**: Evita contenido duplicado
- **Sitemap.xml**: Mapa del sitio para buscadores
- **Robots.txt**: Directivas para crawlers
- **Estructura H1-H4**: Jerarquía semántica correcta
- **Alt Text**: Etiquetas aria-label para iconos
- **Form Labels**: Etiquetas accesibles para formularios

### Archivos SEO
```
public/
├── robots.txt
├── sitemap.xml
└── og-image.jpg (placeholder)
```

## 🎯 Personalización

### Cambiar Colores
Editar variables CSS en `Layout.astro`:
```css
:root {
    --magenta: #ff0080;
    --green-fluor: #00ff41;
    --pink: #ff1493;
    --purple: #8a2be2;
    --orange: #ff4500;
}
```

### Modificar Contenido
- **Empresa**: Cambiar "Digitaliza Todo" en `index.astro`
- **Servicios**: Editar tarjetas en sección services
- **Contacto**: Actualizar información de contacto

## 📞 Contacto

- **Email**: hola@digitalizatodo.cl
- **WhatsApp**: +56 9 2250 4275
- **LinkedIn**: [Ricardo Huisca Leo](https://www.linkedin.com/in/rhuiscaleo/)
- **Sitio Web**: [digitalizatodo.cl](https://digitalizatodo.cl)
- **Ubicación**: Chile 

## 🗄️ Base de Datos MySQL

### Configuración de Producción
- **Host**: localhost
- **Base de Datos**: u958525313_digital
- **Usuario**: u958525313_digital
- **Contraseña**: rodsiC-goqqis-tafgy3
- **Sitio**: digitalizatodo.cl

### Tablas Principales
- **contacts**: Gestión de contactos del formulario
- **projects**: Proyectos y cotizaciones
- **services**: Catálogo de servicios
- **users**: Gestión de usuarios y autenticación
- **analytics**: Métricas y eventos de tracking

## 📊 Sistema de Analytics

### Cookies Implementadas
- **dt_session**: Sesión única por usuario (30 días)
- **Tracking automático**: Pageviews, tiempo en página, clicks en servicios
- **Eventos personalizados**: Formularios, navegación SPA

### Métricas Disponibles
- **Visitantes únicos**: Por sesión y período
- **Páginas vistas**: Total y por página
- **Tiempo promedio**: Permanencia en cada sección
- **Servicios populares**: Clicks e interacciones
- **Dispositivos**: Desktop, mobile, tablet
- **Conversiones**: Formularios enviados

### Panel de Administración
- **Dashboard**: Métricas generales en tiempo real
- **Analytics**: Gráficos detallados por período
- **Gestión de usuarios**: CRUD completo
- **Contactos y proyectos**: Administración centralizada
- **Filtros temporales**: 7, 30, 90 días

### Inicialización
```bash
# Ejecutar script SQL en phpMyAdmin o terminal MySQL
mysql -u u958525313_digital -p u958525313_digital < database.sql
```

## 🍪 Cookies y Privacidad

### Cookies Utilizadas
- **dt_session**: Cookie de sesión para analytics (30 días)
- **Propósito**: Tracking de visitantes únicos y métricas
- **No personal**: No almacena información personal identificable
- **Cumplimiento**: Compatible con GDPR y normativas chilenas

### Datos Recopilados
- Páginas visitadas y tiempo de permanencia
- Tipo de dispositivo (desktop/mobile/tablet)
- Interacciones con servicios y formularios
- User-Agent y dirección IP (anonimizada)

## 🔌 APIs REST

### Endpoints Disponibles

#### `/api/` - API Principal
- **GET**: Información de la API y endpoints disponibles

#### `/api/contacts` - Gestión de Contactos
- **POST**: Crear nuevo contacto
- **GET**: Listar contactos (con búsqueda multinivel opcional)

```json
// POST /api/contacts
{
  "name": "Juan Pérez",
  "email": "juan@email.com",
  "phone": "+56912345678",
  "message": "Necesito una página web"
}

// GET /api/contacts?search=juan&level=3
```

#### `/api/projects` - Gestión de Proyectos
- **POST**: Crear nuevo proyecto
- **GET**: Listar proyectos (con búsqueda multinivel opcional)

```json
// POST /api/projects
{
  "name": "Tienda Online",
  "type": "web",
  "description": "E-commerce con pasarela de pagos",
  "budget": 150000,
  "deadline": "2024-12-31"
}

// GET /api/projects?search=tienda&level=2
```

#### `/api/services` - Gestión de Servicios
- **GET**: Listar servicios activos (con búsqueda multinivel opcional)
- **POST**: Crear nuevo servicio

```bash
# GET /api/services?search=web&level=4
```

#### `/api/users` - Gestión de Usuarios
- **POST**: Login y registro de usuarios
- **GET**: Listar usuarios (requiere autenticación, con búsqueda multinivel opcional)

```json
// POST /api/users (Login)
{
  "action": "login",
  "email": "admin@digitalizatodo.cl",
  "password": "password"
}

// POST /api/users (Registro)
{
  "action": "register",
  "name": "Nuevo Usuario",
  "email": "usuario@email.com",
  "password": "password123",
  "role": "user"
}

// GET /api/users?token=abc123&search=admin&level=5
```

#### `/api/auth` - Autenticación
- **POST**: Verificación de tokens y logout

```json
// POST /api/auth (Verificar token)
{
  "action": "verify",
  "token": "token_de_sesion"
}

// POST /api/auth (Logout)
{
  "action": "logout",
  "token": "token_de_sesion"
}
```

#### `/api/analytics` - Métricas y Analytics
- **POST**: Registrar eventos de tracking
- **GET**: Obtener métricas y estadísticas (con búsqueda multinivel opcional)

```json
// POST /api/analytics (Registrar evento)
{
  "session_id": "dt_1234567890_abc123",
  "page": "/",
  "event_type": "pageview",
  "data": {
    "title": "Inicio",
    "referrer": "https://google.com"
  }
}

// GET /api/analytics?type=overview&days=30
// GET /api/analytics?type=services&days=7
// GET /api/analytics?search=pageview&level=3
```

#### `/api/search` - Búsqueda Multinivel
- **GET**: Búsqueda avanzada hasta 5 niveles de profundidad

```bash
# Ejemplos de uso
GET /api/search?q=web&table=all&level=3
GET /api/search?q=marketing&table=services&level=2
```

### Credenciales de Acceso
- **Email**: admin@digitalizatodo.cl
- **Contraseña**: password
- **Panel Admin**: /admin
- **Panel Usuario**: /user
- **Login**: /login

### Parámetros de Búsqueda Multinivel (Todas las APIs)
- **search**: Término de búsqueda (opcional en todas las APIs)
- **level**: Nivel de profundidad (1-5, default: 1, configurado en config.php)
- **q**: Término de búsqueda (solo para /api/search)
- **table**: Tabla específica (contacts, projects, services, users, analytics, all - solo para /api/search)

### Características de las APIs
- **CORS habilitado**: Acceso desde cualquier origen
- **JSON UTF-8**: Respuestas en formato JSON con codificación UTF-8
- **Búsqueda multinivel**: Hasta 5 niveles de profundidad en TODAS las APIs (configurado en config.php)
- **Manejo de errores**: Respuestas estructuradas con códigos HTTP apropiados
- **Autenticación**: Sistema de login con tokens de sesión
- **Roles de usuario**: Admin y usuario estándar
- **Validación de datos**: Validación de campos requeridos
- **Logging**: Registro de errores para debugging
- **Seguridad**: Contraseñas hasheadas con bcrypt
- **Analytics**: Sistema de tracking con cookies
- **Métricas**: Visitantes, tiempo en página, servicios populares
- **Dispositivos**: Tracking de desktop, mobile y tablet

### Ejemplos de Búsqueda Multinivel por API
```bash
# Contactos
GET /api/contacts?search=juan&level=3

# Proyectos  
GET /api/projects?search=web&level=2

# Servicios
GET /api/services?search=marketing&level=4

# Usuarios (requiere token)
GET /api/users?token=abc123&search=admin&level=5

# Analytics
GET /api/analytics?search=pageview&level=3

# Búsqueda general (API dedicada)
GET /api/search?q=digital&table=all&level=5
```

### Configuración en Producción
Todas las APIs están configuradas para funcionar en la raíz del dominio `digitalizatodo.cl` con el archivo `config.php` que maneja:
- Conexión a base de datos MySQL
- Headers CORS y JSON
- Funciones de búsqueda multinivel
- Manejo centralizado de errores

## 📄 Licencia

Proyecto de uso libre para fines comerciales y personales.

---

**Digitaliza Todo - Transformamos ideas en soluciones digitales innovadoras 🚀**

*Desarrollado con ❤️ en Chile para revolucionar negocios a través de la tecnología*