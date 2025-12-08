# 📚 Documentación del Proyecto - Bot de Discord 9k



## 📁 Estructura del Proyecto

```
9k/
├── commands/           # Comandos organizados por categoría
│   ├── economy/       # Comandos de economía virtual
│   ├── fun/           # Juegos y entretenimiento
│   ├── moderation/    # Herramientas de moderación
│   ├── music/         # Reproducción de música
│   └── utility/       # Comandos de utilidad
├── utils/             # Funciones auxiliares reutilizables
├── docs/              # Documentación del proyecto
├── config.js          # Configuración del bot
├── config.example.js  # Plantilla de configuración
├── index.js           # Punto de entrada principal
├── deploy-commands.js # Despliega comandos slash a Discord
└── package.json       # Dependencias y metadatos
```

---

## 📄 Explicación de Cada Archivo

### **Archivos Principales**

#### `index.js`
**Propósito:** Punto de entrada principal del bot.

**Funcionalidades:**
- Inicializa el cliente de Discord con los intents necesarios
- Carga dinámicamente todos los comandos desde las carpetas de categorías
- Gestiona eventos del bot (mensajes, interacciones, nuevos miembros)
- Maneja tanto comandos de texto como comandos slash (/)
- Implementa sistema de cooldowns para prevenir spam
- Conecta con la base de datos MySQL para persistencia de datos
- Gestiona el sistema de usuarios y economía virtual

**Por qué es importante:** Es el cerebro del bot que coordina todas las funcionalidades.

---

#### `deploy-commands.js`
**Propósito:** Registra los comandos slash en la API de Discord.

**Funcionalidades:**
- Escanea todas las carpetas de comandos
- Extrae los comandos que tienen definición de slash command
- Los registra globalmente en Discord mediante la API REST
- Proporciona feedback detallado sobre el proceso de despliegue

**Por qué es importante:** Sin ejecutar este script, los comandos slash (/) no estarán disponibles en Discord.

**Cuándo ejecutarlo:** Cada vez que agregues, modifiques o elimines un comando slash.

---

#### `config.js`
**Propósito:** Almacena toda la configuración sensible y personalizable del bot.

**Contiene:**
- Token del bot de Discord
- Client ID de la aplicación
- Credenciales de base de datos MySQL
- Configuración de webhooks
- Configuración del sistema de economía (banco, items de tienda)
- Códigos canjeables
- Configuración del sistema de música
- URLs e iconos del bot

**⚠️ IMPORTANTE:** Este archivo contiene información sensible y NO debe compartirse públicamente.

---

#### `config.example.js`
**Propósito:** Plantilla de configuración para nuevos desarrolladores.

**Uso:**
1. Copiar este archivo como `config.js`
2. Rellenar con tus propias credenciales y configuraciones
3. Mantener este archivo en el repositorio como referencia

**Por qué es importante:** Permite que otros desarrolladores sepan qué configuraciones necesitan sin exponer datos sensibles.

---

### **Carpeta `commands/`**

Esta carpeta contiene todos los comandos del bot organizados por categoría. Cada comando es un módulo independiente.

#### `commands/economy/`
Comandos relacionados con el sistema de economía virtual.

- **`robux.js`** - Gestiona la compra/venta de Robux virtuales
- **`shop.js`** - Muestra la tienda de items y roles
- **`transfer.js`** - Permite transferir dinero entre usuarios

---

#### `commands/fun/`
Comandos de entretenimiento y juegos.

- **`blackjack.js`** - Juego de blackjack con apuestas
- **`coinflip.js`** - Lanzamiento de moneda con apuestas
- **`guess.js`** - Juego de adivinanza de números
- **`redeem.js`** - Canjea códigos por recompensas
- **`slots.js`** - Máquina tragamonedas
- **`work.js`** - Gana dinero virtual trabajando

---

#### `commands/moderation/`
Herramientas para moderadores del servidor.

- **`messages.js`** - Visualiza estadísticas de mensajes
- **`save.js`** - Guarda datos de usuarios manualmente
- **`updateRoles.js`** - Actualiza roles de usuarios

---

#### `commands/music/`
Sistema de reproducción de música.

- **`play.js`** - Reproduce música de YouTube en canales de voz

---

#### `commands/utility/`
Comandos de utilidad general.

- **`9ktube.js`** - Busca videos en YouTube
- **`colors.js`** - Gestiona roles de colores
- **`emote.js`** - Gestiona emotes personalizados
- **`help.js`** - Muestra ayuda sobre comandos
- **`invite.js`** - Genera enlaces de invitación
- **`roles.js`** - Gestiona roles del servidor
- **`servers.js`** - Muestra información de servidores
- **`userinfo.js`** - Muestra información de usuarios

---

### **Carpeta `utils/`**

#### `functions.js`
**Propósito:** Biblioteca de funciones auxiliares reutilizables.

**Funciones principales:**
- **Gestión de cooldowns:** `SetCoolDown()`, `CheckCoolDown()`, `AlertCoolDown()`
- **Gestión de usuarios:** `GetUser()`, `AddUser()`, `SaveUser()`
- **Base de datos:** `ConnectDB()`, `ReturnDB()`, `AddServerMessageSQL()`
- **Utilidades:** `CreateEmbed()`, `SearchString()`, `CompareDates()`
- **Permisos:** `CheckAdmin()`

**Por qué es importante:** Evita duplicación de código y centraliza la lógica común.

---

### **Carpeta `docs/`**

- **`README_ES.md`** - Documentación completa en español (este archivo)
- **`README_EN.md`** - Documentación completa en inglés

**Propósito:** Proporcionar documentación clara y accesible en múltiples idiomas.

---

## ✅ Ventajas de Esta Organización

### **1. Modularidad**
Cada comando es un archivo independiente. Esto permite:
- Agregar nuevos comandos sin modificar código existente
- Eliminar comandos simplemente borrando el archivo
- Probar comandos de forma aislada

### **2. Escalabilidad**
La estructura por categorías facilita:
- Encontrar comandos rápidamente
- Agregar nuevas categorías según sea necesario
- Mantener el proyecto organizado a medida que crece

### **3. Mantenibilidad**
- **Separación de responsabilidades:** Cada archivo tiene un propósito claro
- **Código reutilizable:** Las funciones comunes están en `utils/`
- **Configuración centralizada:** Toda la configuración está en un solo lugar

### **4. Colaboración**
- **Fácil onboarding:** Los nuevos desarrolladores pueden entender la estructura rápidamente
- **Trabajo en paralelo:** Múltiples desarrolladores pueden trabajar en diferentes comandos sin conflictos
- **Code reviews más simples:** Los cambios están aislados en archivos específicos

### **5. Seguridad**
- **Separación de credenciales:** `config.example.js` permite compartir la estructura sin exponer datos sensibles
- **Control de acceso:** Fácil implementar permisos por categoría de comandos

---

##  Desventajas de Tener Todo en Un Solo Archivo

Si todo el código estuviera en un solo archivo (ej. `bot.js`):

### **Problemas de Mantenimiento**
-  Archivo de miles de líneas difícil de navegar
-  Difícil encontrar y corregir bugs
-  Alto riesgo de conflictos en Git con múltiples desarrolladores

### **Problemas de Escalabilidad**
-  Agregar funcionalidades requiere modificar un archivo gigante
-  Mayor probabilidad de romper código existente
-  Difícil deshabilitar funcionalidades específicas

### **Problemas de Rendimiento**
-  Carga todo el código aunque solo uses una función
-  Difícil implementar lazy loading
-  Mayor consumo de memoria

### **Problemas de Colaboración**
-  Múltiples personas no pueden trabajar simultáneamente
-  Conflictos constantes en control de versiones
-  Code reviews extremadamente complejos

---

## 🚀 Cómo Empezar

### **Instalación**
```bash
# Instalar dependencias
npm install

# Configurar el bot
cp config.example.js config.js
# Editar config.js con tus credenciales

# Desplegar comandos slash
node deploy-commands.js

# Iniciar el bot
node index.js
```

### **Agregar un Nuevo Comando**
1. Crear archivo en la carpeta de categoría apropiada: `commands/[categoría]/micomando.js`
2. Usar esta plantilla:

```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'micomando',
    aliases: ['!micomando', '!mc'],
    data: new SlashCommandBuilder()
        .setName('micomando')
        .setDescription('Descripción del comando'),
    async execute(interaction, User, Bot) {
        // Tu código aquí
        await interaction.reply('¡Hola!');
    },
};
```

3. Ejecutar `node deploy-commands.js` si es un comando slash
4. Reiniciar el bot

---

## 📦 Dependencias Principales

- **discord.js** - Librería principal para interactuar con Discord
- **mysql2** - Conexión a base de datos MySQL
- **canvas** - Generación de imágenes dinámicas
- **ytdl-core / discord-ytdl-core** - Reproducción de música de YouTube
- **chartjs-node-canvas** - Generación de gráficos
- **date-fns** - Manipulación de fechas

---

## 🔧 Mantenimiento

### **Actualizar Dependencias**
```bash
npm update
```

### **Backup de Base de Datos**
Asegúrate de hacer backups regulares de la base de datos MySQL que contiene:
- Datos de usuarios (`BotUsers`)
- Historial de mensajes (`Messages`)

### **Logs y Debugging**
El bot registra errores en la consola. Considera implementar un sistema de logs más robusto para producción.

---

