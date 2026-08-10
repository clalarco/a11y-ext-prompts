# blind-ext-prompts
Prompts para la revisión de sitios en blind-ext

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
- **Consumo desde la extensión**: los prompts pueden convertirse a JSON y leerse
  desde `src/core/prompts.ts` / `chrome.storage` (ver `docs/`).

## Estructura

```
prompts/
├── README.md
├── CONTRIBUTING.md        # Guía para añadir/editar prompts
├── sites/                 # Un archivo por sitio web (o dominio)
│   ├── wikipedia.org.md
│   ├── github.com.md
│   └── ...
├── generic/               # Prompts genéricos reutilizables
│   ├── read-page.md
│   ├── summarize.md
│   └── form-filling.md
└── docs/
    └── FORMAT.md          # Especificación del frontmatter y estructura
```

## Formatos de archivo

Cada prompt es un archivo Markdown con **frontmatter YAML** (metadatos) y un
cuerpo estructurado. Ver `docs/FORMAT.md` para la especificación completa.

## Añadir un prompt

1. Crea el archivo en `sites/<dominio>.md` (o `generic/<nombre>.md`).
2. Rellena el frontmatter y el cuerpo según `docs/FORMAT.md`.
3. Ejecuta cualquier validación (si la hay) y abre un PR.

Ver `CONTRIBUTING.md`.
