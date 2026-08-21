# 🐾 Plantilla Web para Refugios de Animales

¡Bienvenido/a! Esta es una plantilla web moderna, premium y lista para usar diseñada especialmente para **refugios de animales y protectoras**. 

El objetivo es que cualquier refugio pueda tener su propia web profesional en cuestión de minutos, con el mínimo esfuerzo de mantenimiento.

---

## ✨ Características Principales

*   **Diseño Premium y Responsivo:** Interfaz fluida y optimizada para móviles con animaciones modernas al hacer scroll.
*   **Mantenimiento Ultra-Simple (Consolidado):**
    *   **`index.html` (Página Principal):** Muestra el Inicio, Quiénes Somos (Misión, Valores, Equipo), Cómo Colaborar (Donaciones, Voluntarios, Acogida) y el panel de Contacto en una sola página fluida con navegación por secciones.
    *   **`adopcion.html` (Catálogo):** Filtros avanzados en tiempo real (especie, género, tamaño, acogida) y visualización detallada en ventanas modales.
*   **Cabecera y Pie Dinámicos:** La barra de navegación y el pie de página se inyectan automáticamente desde JavaScript. Si cambias tu email, teléfono o redes sociales en tu configuración, **se actualizan en todo el sitio al instante**.
*   **Panel de Personalización (`guia.html`):** Una herramienta interactiva integrada en la propia web que te permite probar colores en vivo, rellenar tus datos y generar automáticamente el archivo de configuración.

---

## 🚀 Guía Rápida de Inicio (En 3 Pasos)

### Paso 1: Rellenar tus datos de forma interactiva
1.  Abre la web en tu navegador.
2.  Navega a la página de **Guía de Personalización** (puedes encontrar un link destacado en el pie de página o ir directamente a `guia.html`).
3.  Usa el panel izquierdo para cambiar el nombre del refugio, tu email, teléfono, dirección y elegir tus colores de marca en tiempo real.
4.  Copia el código JSON generado en el panel derecho.
5.  Pégalo dentro de tu archivo local **`data/config.json`** y guárdalo.

### Paso 2: Añadir tus animales en adopción
Abre el archivo **`data/animales.json`** y añade tus animales siguiendo este formato:
```json
[
  {
    "id": "toby-1",
    "name": "Toby",
    "species": "Perro",
    "breed": "Mestizo",
    "age": 1.5,
    "gender": "Macho",
    "size": "Mediano",
    "description": "Toby es un perro muy cariñoso y enérgico, ideal para familias activas.",
    "image": "img/animales/toby.jpg",
    "vaccinated": true,
    "neutered": true,
    "microchip": true,
    "featured": true,
    "personality": ["Activo", "Juguetón", "Sociable"],
    "type": "adoption",
    "isAdopted": false
  }
]
```
> 💡 **Tip:** Guarda las fotos de tus animales en la carpeta `img/animales/`. En el campo `"image"`, pon la ruta a esa imagen (por ejemplo: `img/animales/toby.jpg`). También puedes usar URLs directas de internet.

### Paso 3: ¡Publicar tu web gratis!
La forma más sencilla de publicar la web es usar **GitHub Pages**:
1.  Sube todos los archivos de tu carpeta local a un repositorio en tu cuenta de GitHub.
2.  En GitHub, entra en tu repositorio y ve a **Settings** (Configuración) > **Pages**.
3.  Bajo **Build and deployment**, selecciona la rama `main` (o `master`) y la carpeta `/ (root)`.
4.  Haz clic en **Save**. ¡Listo! En unos segundos tu web estará en el aire.

---

## 📊 (Opcional) Gestionar animales desde Google Sheets

Si quieres que los voluntarios gestionen las altas y bajas de animales desde una hoja de cálculo de Google (Google Sheets) sin editar archivos de código:

1.  Crea un Google Sheet y renombra la pestaña principal a **`Animales`**.
2.  Configura las columnas de la primera fila exactamente así:
    `id` | `name` | `species` | `breed` | `age` | `gender` | `size` | `description` | `image` | `vaccinated` | `neutered` | `microchip` | `featured` | `personality` | `type` | `isAdopted`
3.  Ve a **Extensiones > Apps Script**, pega el script provisto en la guía interactiva (`guia.html`) y haz clic en **Desplegar > Nueva implementación** como "Aplicación web" accesible por "Cualquier persona".
4.  Copia la URL provista (`/exec`) y pégala en el campo `"appsScriptAnimalsUrl"` de tu archivo `data/config.json`.

---

¡Gracias por ayudar a los animales a encontrar un hogar! 🐾
