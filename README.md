# JMSuite — Sistema de Gestión CDL

Sistema interno de administración para escuelas de manejo CDL.
Desarrollado por Brandon Mokay.

---

## 🚀 Publicar en Railway (paso a paso)

### PASO 1 — Instalar Node.js
Ve a https://nodejs.org y descarga la versión LTS (la verde).
Instálala normalmente. Cuando termine, abre la terminal (Command Prompt en Windows).

### PASO 2 — Crear cuenta en GitHub
Ve a https://github.com y crea una cuenta gratis si no tienes.

### PASO 3 — Subir este proyecto a GitHub

Abre la terminal y escribe estos comandos uno por uno:

```bash
cd ruta/donde/guardaste/jmsuite
git init
git add .
git commit -m "JMSuite v1.0"
```

Luego en GitHub:
1. Click en "+" → "New repository"
2. Nombre: `jmsuite`
3. Click "Create repository"
4. Copia los comandos que te da GitHub y pégalos en la terminal

### PASO 4 — Obtener tu API Key de Anthropic
1. Ve a https://console.anthropic.com
2. Click en "API Keys" → "Create Key"
3. Copia la key (empieza con `sk-ant-...`)
4. GUÁRDALA en un lugar seguro, solo se muestra una vez

### PASO 5 — Publicar en Railway
1. Ve a https://railway.app
2. Click "Start a New Project"
3. Click "Deploy from GitHub repo"
4. Conecta tu cuenta de GitHub
5. Selecciona el repositorio `jmsuite`
6. Railway detecta automáticamente que es React

### PASO 6 — Agregar la API Key en Railway
1. En tu proyecto de Railway, click en el servicio
2. Click en "Variables"
3. Click "New Variable"
4. Name: `REACT_APP_ANTHROPIC_API_KEY`
5. Value: pega tu key de Anthropic
6. Click "Add"
7. Railway redeploya automáticamente

### PASO 7 — Obtener tu URL
1. Click en "Settings" → "Domains"
2. Click "Generate Domain"
3. Tu URL será algo como: `jmsuite-production.up.railway.app`
4. ¡Comparte esa URL con tu equipo!

---

## 🌐 Dominio personalizado (opcional)
Si compras `jmsuite.com` en Namecheap:
1. En Railway → Settings → Domains → Custom Domain
2. Escribe `jmsuite.com`
3. Railway te da los DNS records
4. Los pegas en Namecheap → DNS settings
5. En ~1 hora funciona con tu dominio

---

## 📱 Acceso desde celular
Una vez publicado, la URL funciona en cualquier dispositivo:
- iPhone / Android: abre el navegador y ve a tu URL
- iPad / tablet: funciona igual
- Para agregar al home screen: en Safari → Share → "Add to Home Screen"

---

## 🔧 Hacer cambios al sistema
1. Edita el archivo `src/App.jsx`
2. En la terminal: `git add . && git commit -m "descripción del cambio" && git push`
3. Railway redeploya automáticamente en ~2 minutos

---

## 💰 Costo estimado
- Railway: $0-5/mes (gratis para empezar)
- Anthropic API: ~$0.01-0.05 por consulta de IA (muy barato)
- Dominio: $12/año
- **Total primer año: menos de $75**

---

Soporte: brandon@jmsuite.com
