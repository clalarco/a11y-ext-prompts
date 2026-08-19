# Guía de contribución

Gracias por querer mejorar esta biblioteca de prompts. Estas reglas mantienen
los prompts consistentes, probables y fáciles de consumir por la extensión.

## Reglas generales

- **Un SKILL.md por acción, agrupado por dominio.** Nada de mega-archivos.
- **Formato de skill.** Cada prompt es un `SKILL.md` con frontmatter
  `name` + `description` y cuerpo de secciones `##` (ver `docs/FORMAT.es.md`).
  Así las herramientas de IA pueden generarlos y usarlos sin modificaciones.
- **En inglés.** El texto de los prompts se escribe en inglés (el runtime de la
  extensión localiza el resto). Las descripciones/metadatos pueden ir también
  en inglés.
- **Conciso y accionable.** Los prompts están pensados para modelos modernos:
  estructura, no prosa vacía. Evita "Act as X" sueltos.
- **Sin datos sensibles.** Nunca incluyas claves, tokens ni datos personales.

## Estructura de un archivo de prompt

Cada prompt es un skill estándar en
`prompts/sites/<dominio>/<accion>/SKILL.md` (o `prompts/generic/<accion>/SKILL.md`).
Sigue el formato definido en `docs/FORMAT.es.md`:

```yaml
---
name: wikipedia-search
description: Help a blind user search Wikipedia by voice and confirm the best matching article.
---
```

Y un cuerpo con las secciones `Role` / `Context` / `Locators` (opcional) /
`Input` / `Output` / `Constraints` / `Example`. El `site`, `type`, `id` y
`version` se derivan de la ruta; no los escribas en el frontmatter.

## Proceso

1. Crea una rama desde `main`.
2. Añade o edita el `SKILL.md` en la carpeta del dominio/acción correspondiente.
3. Valida que el bundle compile sin error: `npm install && npm run bundle`
   (falla si falta `name`/`description` o hay un `id` duplicado). Puedes
   revisar el resultado en `dist/`.
4. Abre un pull request describiendo qué sitio o caso cubre.

> Al mergear a `main`, la GH Action `.github/workflows/release.yml` genera el
> bundle y publica un release nuevo (tag de timestamp UTC) con un único asset:
> `prompts.zip`, que agrupa los JSON por sitio.

## Checklist de revisión

- [ ] El frontmatter tiene `name` y `description` y es único.
- [ ] El cuerpo incluye las secciones relevantes (`Role` / `Context` / `Locators` / `Input` / `Output` / `Constraints` / `Example`).
- [ ] Es específico del sitio (no repite el prompt genérico).
- [ ] Los `Locators` usan nombres semánticos, no atributos HTML.
- [ ] No contiene datos sensibles.
- [ ] Está en inglés.
