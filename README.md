# a11y-ext-prompts
Prompts para la revisión de sitios en a11y-ext

Sub-repositorio independiente de `blind-ext` para almacenar y compartir
**prompts de asistencia de accesibilidad por sitio web**.

La extensión ayuda a personas ciegas o con baja visión a navegar la web con
TTS, STT, consultas a IA (Gemini) e interacción con la página. Cada sitio tiene
particularidades (estructura, contenido dinámico, formularios…), por lo que
cada prompt está adaptado para dar la mejor ayuda en ese contexto concreto.

## Propósito

- **Enfocar la ayuda según el sitio**: cada sitio tiene su propio prompt que
  explica a la IA cómo leer, resumir e interactuar con esa página.
- **Colaboración**: los cambios se proponen mediante pull requests.
- **Bundle publicado como release**: el bundle JSON se **genera en este mismo
  repositorio** (`scripts/to-json.mjs`) y se publica como **asset de GitHub
  Releases** en cada push a `main`. La extensión (`blind-ext`) lo descarga en
  runtime y lo cachea en `chrome.storage.local`, sin parsear Markdown.

El repositorio es la **fuente de verdad en Markdown** y también el **origen del
bundle**. La conversión a JSON usa `gray-matter` (parsing de frontmatter + las
secciones del cuerpo) y produce el índice `prompts.json` más un JSON por sitio
(`dist/sites/<site>.json`). Ver `scripts/to-json.mjs` y `docs/FORMAT.es.md`.

## Releases

Cada push a `main` dispara la GH Action `.github/workflows/release.yml`, que
genera el bundle y publica un release con `tag_name` de **timestamp UTC**
(por ejemplo `20260810-143000`). Como **único asset** se publica el zip, con
URL estable:

- Zip: `https://github.com/clalarco/a11y-ext-prompts/releases/latest/download/prompts.zip`

El **`prompts.zip`** agrupa los JSON del bundle por sitio:

```
prompts/
├── prompts.json              # índice del bundle
├── generic/
│   └── generic.json          # prompts genéricos
└── sites/
    ├── wikipedia.org.json
    ├── github.com.json
    └── ...
```

Para regenerar el bundle localmente: `npm run bundle`.

## Estructura

```
a11y-ext-prompts/
├── README.md
├── CONTRIBUTING.md        # Guía para añadir/editar prompts
├── LICENSE
├── package.json           # script `bundle` (gray-matter)
├── scripts/
│   └── to-json.mjs        # genera dist/prompts.json + dist/sites/<site>.json
├── .github/workflows/
│   └── release.yml        # release por push a main (timestamp)
├── docs/
│   └── FORMAT.es.md       # Especificación del frontmatter y estructura
└── prompts/
    ├── sites/             # Un dominio por carpeta, una acción por SKILL.md
    │   ├── github.com/
    │   │   ├── read/SKILL.md
    │   │   ├── search/SKILL.md
    │   │   ├── navigate/SKILL.md
    │   │   └── form/SKILL.md
    │   └── wikipedia.org/
    │       ├── read/SKILL.md
    │       ├── summarize/SKILL.md
    │       ├── search/SKILL.md
    │       ├── navigate/SKILL.md
    │       └── act/SKILL.md
    └── generic/           # Prompts genéricos reutilizables (un SKILL.md por acción)
        ├── assistant/SKILL.md
        ├── read-page/SKILL.md
        ├── summarize/SKILL.md
        └── form-filling/SKILL.md
```

> `dist/` es salida del script y no se commitea; viaja como asset del release.

## Formatos de archivo

Cada prompt es un **skill estándar de Claude Code**: un archivo `SKILL.md` con
**frontmatter YAML** (`name` + `description`) y un cuerpo de secciones `##`.
Ver `docs/FORMAT.es.md` para la especificación completa.

## Añadir un prompt

1. Crea el archivo en
   `prompts/sites/<dominio>/<accion>/SKILL.md` (o `prompts/generic/<accion>/SKILL.md`).
2. Rellena el frontmatter (`name`, `description`) y el cuerpo según
   `docs/FORMAT.es.md`. El `site`, `type`, `id` y `version` se derivan de la ruta.
3. Valida localmente que el bundle compile: `npm install && npm run bundle`
   (falla si falta `name`/`description` o hay un `id` duplicado).
4. Abre un PR. Al mergear a `main`, la GH Action generará el release.

Ver `CONTRIBUTING.md`.
