# ⚡ ElectroTrack

Aplicación de seguimiento y gestión eléctrica. El proyecto está organizado como un **monorepo** con dos módulos principales:

| Módulo | Tecnología | Ubicación |
|--------|-----------|-----------|
| **Backend / API** | Node.js · Fastify · MySQL 8.0 | `backend/` |
| **Mobile** | React Native · Expo SDK 54 · Expo Router | `mobile/` |

---

## 📋 Requisitos Previos

Asegúrate de tener instaladas las siguientes herramientas antes de comenzar:

| Herramientas|
|------------|
| **NodeAphine.js** |
| **npm** |
| **Docker Desktop** |
| **Git** |
| **Expo Go** |
> [!IMPORTANT]
> Docker Desktop debe estar **corriendo** antes de levantar el backend.

---

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/Jared-TG/ElectroTrack-Proyect.git
cd ElectroTrack-Proyect
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la **raíz** del proyecto:

```env
LAN_IP=<TU_IP_LOCAL>
```

> [!TIP]
> Para obtener tu IP local en **Windows** ejecuta `ipconfig` y busca la dirección IPv4 de tu adaptador de red activo (ej. `192.168.100.X`).  

---

## 🐳 Backend (Docker)

El backend se levanta con **Docker Compose**, que arranca dos contenedores:

- **`electrotrack-db`** — Base de datos MySQL 8.0
- **`electrotrack-api`** — API REST con Fastify + Nodemon (hot-reload)

### Levantar el backend

```bash
docker compose up -d
```

Esto construirá las imágenes (la primera vez) e iniciará ambos servicios. La API queda disponible en:

```
http://localhost:3000
```

### Verificar que todo funciona

```bash
# Ver los contenedores corriendo
docker compose ps

# Probar la API
curl http://localhost:3000
# Respuesta esperada: { "message": "ElectroTrack API", "status": "running", "version": "1.0.0" }

# Endpoint de salud
curl http://localhost:3000/health
```

### Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `docker compose up -d` | Levantar servicios en segundo plano |
| `docker compose down` | Detener y remover contenedores |
| `docker compose logs -f api` | Ver logs de la API en tiempo real |
| `docker compose logs -f db` | Ver logs de la base de datos |
| `docker compose down -v` | Detener y **borrar volúmenes** (resetea la BD) |
| `docker compose build --no-cache` | Reconstruir la imagen sin caché |

### Variables de entorno del backend

El `docker-compose.yml` ya configura las siguientes variables automáticamente:

| Variable | Valor |
|----------|-------|
| `DB_HOST` | `db` |
| `DB_USER` | `equipo` |
| `DB_PASS` | `equipo_password` |
| `DB_NAME` | `electrotrack_db` |
| `DB_PORT` | `3306` |
| `NODE_ENV` | `development` |

---

## 📱 Mobile (React Native + Expo) — Ejecución local

La app móvil se ejecuta **localmente** (NO con Docker). Utiliza **Expo** con `expo-router` para la navegación.

### Instalar dependencias

```bash
cd mobile
npm install
```

### Iniciar el servidor de desarrollo

```bash
npx expo start
```

Esto abrirá la terminal de Expo con un **código QR**.

### Abrir la app en tu celular

1. Asegúrate de que tu **celular y tu computadora** estén conectados a la **misma red Wi-Fi**.
2. Abre la app **Expo Go** en tu celular.
3. Escanea el **código QR** que aparece en la terminal.

> [!NOTE]
> Si tienes problemas de conexión, intenta iniciar Expo con tunnel:  
> ```bash
> npx expo start --tunnel
> ```

### Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npx expo start` | Iniciar servidor de desarrollo |


---

## 📁 Estructura del Proyecto

```
ElectroTrack/
├── .env                    # Variables de entorno (IP local, etc.)
├── .gitignore              # Reglas globales de Git
├── docker-compose.yml      # Orquestación de contenedores
├── package.json            # Dependencias raíz
│
├── backend/                # 🔧 API REST
│   ├── Dockerfile          # Imagen Docker del backend
│   ├── package.json        # Dependencias del backend
│   └── src/
│       ├── index.js        # Punto de entrada del servidor
│       ├── controllers/    # Controladores de rutas
│       ├── models/         # Modelos de datos
│       ├── routes/         # Definición de rutas
│       └── services/       # Lógica de negocio
│
└── mobile/                 # 📱 App React Native
    ├── app.json            # Configuración de Expo
    ├── package.json        # Dependencias de la app
    ├── tsconfig.json       # Configuración TypeScript
    ├── app/                # Pantallas (file-based routing)
    ├── components/         # Componentes reutilizables
    ├── constants/          # Constantes y configuración
    └── assets/             # Imágenes y recursos estáticos
```

---

## 🔄 Flujo de Trabajo Recomendado

```
1. Levantar Docker Desktop
2. docker compose up -d        ← Backend + BD
3. cd mobile && npx expo start ← App móvil
4. Escanear QR con Expo Go     ← Probar en celular
```

---

## 🛠️ Tecnologías Principales

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| **Runtime** | Node.js | 24 (Docker) / 18+ (local) |
| **API Framework** | Fastify | 4.26 |
| **Base de Datos** | MySQL | 8.0 |
| **Contenedores** | Docker + Docker Compose | — |
| **Mobile Framework** | React Native | 0.81.5 |
| **Mobile Platform** | Expo SDK | 54 |
| **Navegación** | Expo Router | 6.x |
| **Lenguaje** | TypeScript (mobile) / JavaScript (backend) | — |

---

## ❓ Solución de Problemas Comunes

<details>
<summary><strong>El backend no conecta con la base de datos</strong></summary>

1. Verifica que Docker Desktop esté corriendo.
2. Ejecuta `docker compose ps` y asegúrate de que `electrotrack-db` muestre estado `healthy`.
3. Si la BD no arranca, revisa los logs: `docker compose logs db`.
4. Espera unos segundos — MySQL tarda en inicializar la primera vez.
</details>

<details>
<summary><strong>Expo Go no puede conectar con el servidor</strong></summary>

1. Asegúrate de que el celular y la PC estén en la **misma red Wi-Fi**.
2. Verifica que el firewall no esté bloqueando el puerto de Expo.
3. Intenta con `npx expo start --tunnel`.
4. Revisa que la variable `LAN_IP` en `.env` corresponda a tu IP actual.
</details>

<details>
<summary><strong>Error "port already in use" al levantar Docker</strong></summary>

Es probable que el puerto `3000` o `3306` ya esté en uso. Detén los servicios conflictivos o cambia los puertos en `docker-compose.yml`.
</details>

