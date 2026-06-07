# Las Recetas de Alice

Recetario web gratuito. Cualquiera con el enlace ve las recetas; solo Alice puede
crearlas y editarlas. Alice puede grabar la receta hablando y la IA la estructura.

## Stack
- GitHub Pages (hosting) · Supabase (BD + login + fotos) · Web Speech API (dictado)
  · Gemini API (estructurar receta) · YouTube (videos). Sin build step.

## Puesta en marcha (una sola vez)

### 1. Supabase
1. Crea una cuenta en https://supabase.com y un proyecto nuevo (region Europa).
2. En **SQL Editor**, pega el contenido de `supabase-setup.sql` y ejecútalo.
3. En **Authentication > Users**, crea el usuario de Alice (email + contraseña).
4. En **Authentication > Providers > Email**, desactiva "Confirm email" para que
   pueda entrar sin verificar (es un solo usuario de confianza).
5. En **Project Settings > API**, copia `Project URL` y `anon public key`.

### 2. Gemini
1. Entra en https://aistudio.google.com/app/apikey y crea una API key gratuita.
2. (Recomendado) En Google Cloud Console restringe la key a la
   "Generative Language API" y al dominio de tu GitHub Pages.

### 3. Configura las claves
Edita `js/config.js` y rellena `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `GEMINI_API_KEY`.

### 4. Publica en GitHub Pages
1. Crea un repositorio en GitHub y sube esta carpeta.
2. En **Settings > Pages**, elige la rama `main` y carpeta `/root`.
3. Tu web estará en `https://TU-USUARIO.github.io/TU-REPO/`.

## Cómo usa Alice la herramienta (móvil, en Chrome)
1. Abre `.../admin.html` y entra con su email y contraseña (se queda recordado).
2. Pulsa **🎙 Grabar receta** y habla la receta con naturalidad.
3. Pulsa **Parar y procesar**: la IA rellena el formulario.
4. Revisa, corrige, añade el link de YouTube y la foto, y pulsa **Guardar**.
5. Para editar, pulsa ✏️ en la lista; para borrar, 🗑️.

## Foto de portada (hero)
La página de inicio muestra una foto grande de bienvenida. Para poner la tuya,
crea una carpeta `assets/` y guarda dentro una imagen llamada **`hero.jpg`**
(apaisada, mínimo ~1600px de ancho). Si no hay foto, se muestra un degradado
cálido de respaldo automáticamente.

## Funciones de cada receta
- **🖨 Imprimir / PDF:** vista limpia para papel o "Guardar como PDF".
- **💬 Compartir:** envía el enlace de la receta por WhatsApp.
- **👩‍🍳 Modo cocina:** pasos a pantalla completa, navegables con flechas, y
  mantiene la pantalla encendida (Wake Lock) mientras cocinas.
- **🔍 Buscar:** el buscador encuentra recetas por nombre **y por ingrediente**.

## Hacer la web pública (más adelante)
Quita la línea `<meta name="robots" content="noindex" />` de `index.html`,
`receta.html` y `admin.html` para permitir que Google la indexe.

## Desarrollo
- Las funciones puras (`js/utils.js`) tienen tests en `tests/utils.test.mjs`.
- **Sin Node.js:** abre `tests/test.html` servido por un servidor estático
  (no por `file://`, los módulos ES necesitan http). En Windows puedes usar el
  servidor incluido: `powershell -NoProfile -ExecutionPolicy Bypass -File dev-server.ps1`
  y luego abrir `http://localhost:8766/tests/test.html`.
- **Con Node.js:** `npm test` ejecuta los mismos tests en la terminal.
- Para probar la app en local necesitas un servidor estático igual que arriba
  (abrir por `file://` no carga los módulos).
