# Guía de contribución

Gracias por querer mejorar esta biblioteca de prompts. Estas reglas mantienen
los prompts consistentes, probables y fáciles de consumir por la extensión.

## Reglas generales

- **Un archivo por sitio o por tema genérico.** Nada de mega-archivos.
- **En inglés.** El texto de los prompts se escribe en inglés (el runtime de la
  extensión localiza el resto). Las descripciones/metadatos pueden ir también
  en inglés.
- **Conciso y accionable.** Los prompts están pensados para modelos modernos:
  estructura, no prosa vacía. Evita "Act as X" sueltos.
- **Sin datos sensibles.** Nunca incluyas claves, tokens ni datos personales.

## Estructura de un archivo de prompt

Cada prompt sigue el formato definido en `docs/FORMAT.es.md`:

```yaml
---
id: wikipedia-read-article
site: wikipedia.org
type: read
tags: [article, references]
lang: any
model: any
version: 1
---
```

Y un cuerpo con las secciones: `Role` / `Context` / `Input` / `Output` /
`Constraints` / `Example`.

## Proceso

1. Crea una rama desde `main`.
2. Añade o edita el prompt siguiendo el formato.
3. Valida que la extensión lo compile sin error: `npm run check` en `blind-ext`
   (el build usa `gray-matter` para parsear el frontmatter y falla si el
   archivo no es válido o el `id` está duplicado).
4. Abre un pull request describiendo qué sitio o caso cubre.

## Checklist de revisión

- [ ] El frontmatter está completo y el `id` es único.
- [ ] El cuerpo sigue el orden `Role / Context / Input / Output / Constraints / Example`.
- [ ] Es específico del sitio (no repite el prompt genérico).
- [ ] No contiene datos sensibles.
- [ ] Está en inglés.
