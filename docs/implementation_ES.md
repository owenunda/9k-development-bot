# 9kDev — Guía de implementación

Esta guía explica cómo **instalar, configurar y ejecutar** el bot (prefix `!9k` + slash `/`) en tu servidor.

## Requisitos

- Node.js (recomendado: **v18+**)
- Una app de Discord con un bot creado (token)
- Acceso a una base de datos **MySQL/MariaDB**

## 1) Instalación

1. Clona/descarga el proyecto.
2. Instala dependencias:

```bash
npm install
```

## 2) Configuración del bot

El proyecto usa `config.js` (no lo subas públicamente).

1. Copia el archivo de ejemplo:

```bash
# Windows (PowerShell)
copy config.example.js config.js

# Git Bash
cp config.example.js config.js
```

2. Edita `config.js` y completa, como mínimo:

- `token` (token del bot)
- `clientId` (Application ID)
- `guildId` (ID del servidor donde vas a registrar los slash)
- `Admin.SQL` (credenciales de MySQL)
- Opcionales según tu setup: música, webhooks, etc.

## 3) Permisos e Intents del bot

En el portal de Discord (Developer Portal → Bot → Privileged Gateway Intents), habilita si los necesitas:

- **Server Members Intent** (si manejas roles/miembros)
- **Message Content Intent** (necesario para comandos prefix `!9k ...`)

En el servidor, el bot debe tener permisos típicos como:

- Ver canales
- Enviar mensajes
- Embed Links
- Read Message History (para algunas features)
- Add Reactions (para `emote`)
- Manage Roles (para `roles`, `colors`, `updateroles`, etc.)

## 5) Registrar comandos slash (/)

El bot registra slash commands por servidor (guild) usando `deploy-commands.js`.

Ejecuta:

```bash
npm run deployC
```

Si no ves el comando en Discord, espera unos segundos y vuelve a abrir Discord.

## 6) Ejecutar el bot

### Desarrollo

```bash
npm run dev
```

### Producción

```bash
npm start
```

Al iniciar, deberías ver logs tipo `Loaded command: ...` y `Ready! Logged in as ...`.

## 7) Uso (Prefix + Slash)

El bot está migrado a **doble modo**:

- Prefix: `!9k ...`
- Slash: `/...`

Ejemplos:

- `!9k Servers` / `/servers`
- `!9k Invite` / `/invite`
- `!9k Emote` / `/emote` (manda un mensaje al canal para reaccionar)

### Comandos con subcomandos (slash)

Algunos comandos slash usan subcomandos:

- `/colors list`
- `/colors assign role:@RolColor`
- `/roles list`
- `/roles toggle role:@RolCanal`

## 8) Estructura del proyecto

- `index.js`: arranque del bot + handlers de mensajes e interacciones.
- `deploy-commands.js`: despliegue de slash commands al guild.
- `commands/`: comandos agrupados por categoría.
- `utils/functions.js`: helpers (embeds, cooldowns, DB, permisos).

## 9) Solución de problemas (rápido)

### “No command matching X was found.”

- Asegúrate de reiniciar el bot.
- Verifica que el comando exista en `commands/**` y que `export default { name: '...' }` coincida con el nombre del slash.

### Los slash dicen “The application did not respond”

- El comando tardó demasiado sin hacer `deferReply()`.
- En comandos pesados, usa `await interaction.deferReply()` y luego `editReply()`.

### Los comandos prefix no funcionan

- Habilita **Message Content Intent**.
- Revisa permisos del bot para leer mensajes.

## 10) Checklist de implementación

- [ ] `npm install`
- [ ] `config.js` con token/clientId/guildId
- [ ] Intents activados (Message Content, Members si aplica)
- [ ] `npm run deployC`
- [ ] `npm run dev` / `npm start`
