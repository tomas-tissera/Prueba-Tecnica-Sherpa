# Automatización de Desbloqueo de Manuscritos Antiguos

Este proyecto es un script de automatización diseñado para interactuar con una plataforma web de manuscritos antiguos. Su objetivo principal es simular el proceso de un "monje" que debe desbloquear y acceder a varios manuscritos, cada uno con un desafío diferente, utilizando Playwright para la navegación web y Axios para la interacción con APIs de cifrado.

---

## ⚔️ El Gran Desafío del Scraping Arcano

> "Las manos de simples mortales no deben tocar los manuscritos sagrados...  
> Solo aquellos versados en el arte del scraping podrán conquistar la cripta y obtener sus tesoros."

¡Prepárate para la aventura de automatización más épica jamás creada!

Los antiguos manuscritos han sido maldecidos por hechizos anti-humanos. Solo los bots y scripts podrán tocarlos sin ser convertidos en piedra. Tu misión es crear un web scraper que conquiste la cripta completa de forma automatizada. Puedes entrar a la página para inspeccionarla, no hay problema.



---

## 🚀 Características

- **Login Automatizado:**  
  Inicia sesión en la plataforma utilizando credenciales predefinidas.

- **Procesamiento Secuencial de Manuscritos (Orden Temporal):**  
  - **Codex Aureus de Echternach (Siglo XIV):** Descarga el PDF y extrae un código de acceso.  
  - **Libro de Kells (Siglo XV):** Requiere el código del Siglo XIV para desbloquearlo, descarga su PDF y extrae un nuevo código.  
  - **Codex Seraphinianus (Siglo XVI):** Requiere el código del Siglo XV para desbloquearlo, descarga su PDF y extrae otro código.  
  - **Necronomicon (Siglo XVII):** Requiere el código del Siglo XVI. Accede a su documentación, resuelve un desafío de cifrado a través de una API (utilizando búsqueda binaria) para obtener una contraseña final. Luego, usa esta contraseña para desbloquear el manuscrito, descarga su PDF y extrae un código (que se usará en el siguiente desafío).  
  - **Malleus Maleficarum (Siglo XVIII):** Requiere el código del Siglo XVII. Accede a su documentación, resuelve un desafío de cifrado a través de una API (utilizando la contraseña obtenida del Necronomicon) para obtener una contraseña final. Finalmente, usa esta contraseña para desbloquear el manuscrito, descarga su PDF y muestra el contenido completo de este último PDF en la consola.

- **Extracción de Códigos:**  
  Parsea el contenido de los PDFs descargados para encontrar códigos de acceso.

- **Interacción con API de Cifrado:**  
  Resuelve desafíos complejos de cifrado comunicándose con un endpoint de API externo.

- **Manejo de Errores y Reintentos:**  
  Incluye lógica para reintentar acciones fallidas y manejar errores de descarga o códigos incorrectos.

---

## 🛠️ Tecnologías Utilizadas

- **Node.js:** Entorno de ejecución de JavaScript.  
- **Playwright:** Biblioteca para la automatización de navegadores (utilizando Firefox).  
- **TypeScript:** Superset de JavaScript que añade tipado estático.  
- **Axios:** Cliente HTTP basado en promesas para el navegador y Node.js, utilizado para interactuar con la API de desafíos.  
- **pdf-parse:** Módulo para extraer texto de archivos PDF.  
- **npm (Node Package Manager):** Para la gestión de dependencias.

---

## ⚔️ Armas Recomendadas (Herramientas de Scraping)

- **Playwright:** El arma legendaria para scraping (utilizada en este proyecto).  
- **Puppeteer:** Alternativa válida.  
- **Selenium:** Para guerreros veteranos.

---

## ⚙️ Instalación

Sigue estos pasos para configurar y ejecutar el proyecto localmente:

```console
git clone https://github.com/tomas-tissera/Prueba-Tecnica-Sherpa.git
cd Prueba-Tecnica-Sherpa
npm install
```

## 🔐 Configuración (Credenciales Místicas)

> "Cuando el monje @sherpa.local despierte, y la cripta con su clave secreta se abra, 'cript@123' será el hechizo que liberará los pergaminos de su eterno letargo."

- Usuario: `monje@sherpa.local`
- Contraseña: `cript@123`

Estas credenciales y el endpoint de la API (`https://backend-production-9d875.up.railway.app/api/cipher/challenge`) están hardcodeados en el script `login.spec.ts`. No se requiere configuración adicional a menos que estos cambien.

---

## 🏃 Uso

Para ejecutar el script de automatización, abre tu terminal en la raíz del proyecto y ejecuta:
```bash
npm run test
```

Este comando iniciará el navegador Firefox (en modo no headless para que puedas ver la automatización), realizará el proceso de login, navegará por los manuscritos en el orden temporal correcto (Siglo XIV, Siglo XV, Siglo XVI, Siglo XVII, Siglo XVIII), descargará y procesará los PDFs, resolverá los desafíos de la API y finalmente mostrará el contenido del último PDF (Malleus Maleficarum) en la consola.
Al finalizar, el navegador se cerrará automáticamente.

## 📂 Estructura del Proyecto

- `node_modules/` — Dependencias del proyecto  
- `login.spec.ts` — Script principal de automatización  
- `package.json` — Metadatos del proyecto y scripts  
- `package-lock.json` — Bloqueo de dependencias  
- `tsconfig.json` — Configuración de TypeScript  
- `README.md` — Este archivo  
- `.gitignore` — Archivos y directorios a ignorar por Git

## 🧪 Pruebas

El comando `npm run test` ejecuta el script principal de automatización (`login.spec.ts`).  
Este script está diseñado para probar el flujo completo de desbloqueo de manuscritos.



---

## 🤝 Contribución

Las contribuciones son bienvenidas. Si deseas contribuir, por favor sigue estos pasos:

1. Haz un "fork" del repositorio.  
2. Crea una nueva rama (`git checkout -b feature/nombre-de-la-caracteristica`).  
3. Realiza tus cambios y haz "commit" (`git commit -m 'feat: añade nueva característica'`).  
4. Sube tus cambios (`git push origin feature/nombre-de-la-caracteristica`).  
5. Abre un "Pull Request".
---

## 📄 Licencia

Este proyecto está bajo la licencia MIT.
---

## ✉️ Contacto

Tomas Tissera - tomas.tissera.trabajo@gmail.com

Enlace al proyecto: [https://github.com/tomas-tissera/Prueba-Tecnica-Sherpa.git](https://github.com/tomas-tissera/Prueba-Tecnica-Sherpa.git)