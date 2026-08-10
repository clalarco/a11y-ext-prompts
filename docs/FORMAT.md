# Formato de un prompt

Cada prompt es un archivo Markdown con frontmatter YAML y un cuerpo
estructurado. El objetivo es que un script pueda convertir estos archivos a
JSON para que la extensión (`src/core/prompts.ts`) los consuma.

## Frontmatter (YAML)

| Campo      | Requerido | Descripción                                                            |
| ---------- | --------- | ---------------------------------------------------------------------- |
| `id`       | sí        | Identificador único (kebab-case): `site-action`, p.ej. `github-search`. |
| `site`     | sí        | Dominio o ámbito: `wikipedia.org`, `github.com`, o `generic`.           |
| `type`     | sí        | Acción: `read`, `summarize`, `navigate`, `form`, `search`, `any`.       |
| `tags`     | no        | Lista de etiquetas (`[article, references]`).                           |
| `lang`     | no        | Idioma del usuario objetivo: `any`, `es`, `en`, `pt`.                   |
| `model`    | no        | Modelo sugerido: `any`, `gemini-2.5-flash-lite`.                        |
| `version`  | sí        | Entero de versión. Incrementa al cambiar el cuerpo.                     |

## Cuerpo

Orden fijo de secciones. Cada sección es un encabezado `##`.

### `## Role`
Qué papel asume la IA en este prompt (una frase).

### `## Context`
Contexto del sitio: estructura típica, contenido dinámico, particularidades
relevantes para leer/resumir/interactuar. Incluye lo que la IA debe saber
*antes* de actuar.

### `## Input`
Qué recibe la IA: texto del usuario, contenido de página, etc. Usa plantillas
`{{variable}}`.

### `## Output`
Qué debe devolver la IA y en qué formato (p.ej. resumen en 3-5 frases).

### `## Constraints`
Restricciones: longitud, tono, no mencionar HTML/tags, no inventar, idioma.

### `## Example` (opcional)
Un ejemplo de entrada → salida esperada.

## Ejemplo mínimo

```markdown
---
id: wikipedia-read-article
site: wikipedia.org
type: read
tags: [article, references]
lang: any
model: any
version: 1
---

## Role
Assistant that reads and summarizes Wikipedia articles for a blind user.

## Context
Wikipedia articles follow a consistent structure:
lead paragraph, infobox, sections, references. The lead summarizes the article.

## Input
The page content: {{page_text}}

## Output
A concise summary of the lead, plus the list of main sections with their titles.

## Constraints
- Do not mention HTML tags or navigation.
- Answer in the user's language, max 5 sentences.
- Do not invent facts not present in the content.

## Example
Input: "Albert Einstein" article content...
Output: Summary of Einstein's life, work and main sections.
```

## Conversión a JSON

Esperamos un script (p.ej. `scripts/to-json.mjs`) que lea todos los `*.md`,
parsee el frontmatter con `gray-matter` y emita `prompts.json` +
`prompts/<site>.json`. El `id` es la clave usada por la extensión.
