# Usar una imagen oficial de Node.js (versión 20 slim por ser ligera pero compatible)
FROM node:20-slim

# Instalar dependencias del sistema necesarias para ffmpeg, canvas y otros módulos nativos
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    ffmpeg \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiar los archivos package.json y package-lock.json (si existe)
COPY package*.json ./

# Instalar las dependencias de producción del proyecto
RUN npm install

# Copiar el resto del código de la aplicación
COPY . .

# Establecer la variable de entorno a producción
ENV NODE_ENV=production

# Comando para iniciar el bot
CMD ["npm", "start"]
