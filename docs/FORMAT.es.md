# Formato de un prompt

Cada prompt es un **skill estándar de Claude Code**: un archivo `SKILL.md` con
frontmatter YAML y un cuerpo de secciones `##`. El objetivo es que un script
(`scripts/to-json.mjs`) convierta estos archivos a JSON para que la extensión
(`src/core/prompts.ts`) los consuma.

## Ubicación

Los SKILL.md se agrupan por dominio; una carpeta por acción dentro del dominio.

```
prompts/
├── generic/<accion>/SKILL.md            # site: generic
└── sites/<dominio>/<accion>/SKILL.md    # site: <dominio>
```

El nombre de la carpeta `<accion>` es el nombre del skill (`github.com/search`
→ skill `github-search`). Los prompts genéricos usan la carpeta `<accion>`
directamente bajo `generic/`.

## Frontmatter (YAML)

| Campo         | Requerido | Descripción                                             |
| ------------- | --------- | ------------------------------------------------------- |
| `name`        | sí        | Nombre del skill (kebab-case), p.ej. `github-search`.    |
| `description` | sí        | Frase de una línea: cuándo usar este prompt.             |
| `tags`        | no        | Lista de etiquetas (`[article, references]`).            |
| `lang`        | no        | Idioma del usuario objetivo: `any`, `es`, `en`, `pt`.    |
| `model`       | no        | Modelo sugerido: `any`, `gemini-2.5-flash-lite`.         |
| `version`     | no        | Entero. Por defecto `1`. Incrementa al cambiar el cuerpo. |

Solo `name` y `description` se autoran obligatoriamente; el resto tiene
valores por defecto y no hace falta escribirlo.

## Campos derivados (los calcula el script, no se autoran)

| Campo    | Regla                                                                  |
| -------- | ---------------------------------------------------------------------- |
| `site`   | Carpeta del dominio (o `generic`).                                     |
| `type`   | Carpeta de acción, con normalización para genéricos: `assistant`→`any`, `page-type`→`any`, `read-page`→`read`, `form-filling`→`form`. Por defecto = nombre de la carpeta. |
| `id`     | `<slug del dominio>-<accion>`, p.ej. `github-search`, `generic-read-page`. El slug del dominio omite el TLD (`github.com` → `github`). |
| `version`| `1` por defecto (o el `version` del frontmatter).                       |

> El `id` es la clave que consume la extensión. No cambies el nombre de la
> carpeta de acción si ya hay un `id` publicado.

## Cuerpo

Orden flexible de secciones; cada sección es un encabezado `##`. Las que el
script reconoce y emite como campos JSON:

### `## Role`
Qué papel asume la IA en este prompt (una frase).

### `## Context`
Contexto del sitio: estructura típica, contenido dinámico, particularidades
relevantes. Incluye lo que la IA debe saber *antes* de actuar.

### `## Locators` (opcional)
Mapeo de los elementos relevantes de la página a **nombres semánticos
estables**. Formato: un `- \`label\`: descripción` por elemento. El script lo
emite como array `[{ name, description }]` en el campo `locators`. Los nombres
deben ser descriptivos (`search_box`, `result_list`, `submit_button`) y nunca
hacer referencia a atributos HTML crudos. Suele ir en los prompts de sitio y en
los que interactúan con formularios, no en los de solo resumen.

```markdown
## Locators
- `search_box`: the global search input at the top of the page.
- `scope_tabs`: the tabs to pick Repositories | Code | Issues | PRs.
- `result_list`: the list of search results.
```

### `## Input`
Qué recibe la IA: texto del usuario, contenido de página, etc. Usa plantillas
`{{variable}}`.

### `## Output`
Qué debe devolver la IA y en qué formato.

### `## Constraints`
Restricciones: longitud, tono, no mencionar HTML/tags, no inventar, idioma.

### `## Example` (opcional)
Un ejemplo de entrada → salida esperada.

## Ejemplo mínimo

```markdown
---
name: wikipedia-search
description: Help a blind user search Wikipedia by voice and confirm the best matching article.
---

## Role
Assistant that helps a blind or low-vision user search Wikipedia by voice.

## Context
Wikipedia has a search box in the top-right that suggests matching article
titles as you type. Searches usually take the user directly to an article.

## Locators
- `search_box`: the search input at the top-right ("Search Wikipedia").
- `suggestions`: the autocomplete list of matching article titles.

## Input
The user's search request: {{user_request}}. Optional current page content:
{{page_text}}.

## Output
A short confirmation of the search and, if a single article matches, a brief
summary of its lead.

## Constraints
- Use only PLAIN TEXT: the answer is read aloud by a screen reader (TTS).
- Do not invent titles not present in the search results.
- ALWAYS answer in the language selected by the user.
```

## Conversión a JSON

El script `scripts/to-json.mjs` recorre `generic/<accion>/SKILL.md` y
`sites/<dominio>/<accion>/SKILL.md`, parsea el frontmatter con `gray-matter`
y emite `prompts.json` + `dist/sites/<site>.json`. El `id` es la clave usada
por la extensión. El build falla si falta `name`/`description` o hay un `id`
duplicado.
