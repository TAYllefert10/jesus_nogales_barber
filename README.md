# Barbería Jesús Nogales – Frontend (GitHub Pages)
Frontend estático listo para subir a GitHub Pages. El backend (admin, horarios y reservas) es un Web App de Google Apps Script.

## Configuración rápida
1) Sube todo este paquete al repositorio (raíz).
2) En `assets/main.js`, sustituye `YOUR_APPS_SCRIPT_URL` por la URL de tu Web App (termina en `/exec`).
3) Activa GitHub Pages desde Settings → Pages → Source: main / root.
4) Reemplaza en `assets/` tus archivos reales: `hero.jpg`, `logo.webp`, `intro.mp4`.
5) (Opcional) Si aún no configuras Apps Script, edita `assets/slots.json` para mostrar horas de ejemplo.

## Administración
- En tu Apps Script, abre `.../exec?admin=1` para añadir o quitar horas (requiere tu clave en el panel).
