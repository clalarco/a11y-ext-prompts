#!/usr/bin/env node
/**
 * Convierte la biblioteca de prompts (SKILL.md) a un bundle JSON que se
 * publica como asset de GitHub Releases en este repositorio.
 *
 * Fuente: `prompts/generic/<accion>/SKILL.md` y `prompts/sites/<dominio>/<accion>/SKILL.md`.
 * Salida:
 *   - `dist/prompts.json`  -> índice { version, generatedAt, count, sites }
 *   - `dist/sites/<site>.json` -> array de prompts por sitio (incl. generic)
 *
 * Cada prompt es un skill estándar (frontmatter `name` + `description` + cuerpo
 * con secciones `##`). Los campos `site`, `type`, `id` y `version` se derivan
 * de la ruta y de valores por defecto; `tags`/`lang`/`model` son opcionales.
 * El `id` es la clave que consume la extensión blind-ext (`prompt-store.ts`).
 */

import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import matter from 'gray-matter';

/** Raíz de este repo. */
const ROOT = resolve(import.meta.dirname, '..');
/** Directorio fuente de los prompts. */
const PROMPTS_DIR = join(ROOT, 'prompts');
/** Directorio de salida del bundle. */
const DIST_DIR = join(ROOT, 'dist');

/**
 * Normaliza el nombre de la carpeta de acción a un `type` canónico.
 * Las carpetas de sitio ya usan el `type` como nombre; solo los genéricos
 * necesitan un mapa (algunos no coinciden con el vocabulario de `type`).
 */
const TYPE_BY_FOLDER = {
  assistant: 'any',
  'page-type': 'any',
  'read-page': 'read',
  'form-filling': 'form',
};

/** Versión por defecto cuando no está en el frontmatter. */
const DEFAULT_VERSION = 1;

/** TLDs que se omiten al derivar el prefijo del `id` (`github.com` -> `github`). */
const TLD_RE = /\.(?:com|org|net|io|co|gov|edu|info|dev)$/i;

/** Slugea el dominio para usarlo como prefijo del `id` (quita el TLD). */
function slugDomain(site) {
  return site.replace(TLD_RE, '');
}

/**
 * Forma tipada de un prompt tal y como lo consume la extensión.
 * Debe coincidir con `PromptFromMarkdown` (ver `docs/FORMAT.es.md`).
 */
class PromptRecord {
  constructor(record) {
    this.id = record.id;
    this.site = record.site ?? 'generic';
    this.type = record.type ?? 'any';
    this.tags = Array.isArray(record.tags) ? record.tags.map(String) : [];
    this.lang = record.lang ?? 'any';
    this.model = record.model ?? 'any';
    this.version = record.version ?? DEFAULT_VERSION;
    this.name = record.name ?? '';
    this.description = record.description ?? '';
    this.role = record.role ?? '';
    this.context = record.context ?? '';
    this.input = record.input ?? '';
    this.output = record.output ?? '';
    this.constraints = record.constraints ?? '';
    this.locators = record.locators ?? [];
    this.example = record.example ?? '';
  }
}

/** Devuelve los subdirectorios (ordenados) de una ruta relativa a PROMPTS_DIR. */
function listDirs(rel) {
  const base = join(PROMPTS_DIR, rel);
  let entries;
  try {
    entries = readdirSync(base, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

/** Si `groupRel/<action>/SKILL.md` existe, devuelve [{ filePath, site, action }]. */
function probe(groupRel, action, site) {
  const filePath = join(PROMPTS_DIR, groupRel, action, 'SKILL.md');
  try {
    readFileSync(filePath, 'utf8');
  } catch {
    return [];
  }
  return [{ filePath, site, action }];
}

/**
 * Enumeran los SKILL.md de la biblioteca. Dos profundidades:
 *   - generic/<accion>/SKILL.md              -> site 'generic'
 *   - sites/<dominio>/<accion>/SKILL.md      -> site <dominio>
 * Devuelve [{ filePath, site, action }].
 */
function collectSkills() {
  const skills = [];
  for (const action of listDirs('generic')) {
    skills.push(...probe('generic', action, 'generic'));
  }
  for (const domain of listDirs('sites')) {
    for (const action of listDirs(join('sites', domain))) {
      skills.push(...probe(join('sites', domain), action, domain));
    }
  }
  return skills.sort((a, b) => a.filePath.localeCompare(b.filePath));
}

/** Extrae las secciones del cuerpo (`## Role`, `## Context`, ...). */
function parseSections(body) {
  const sections = {};
  let current = null;
  const buffer = [];
  for (const line of body.split('\n')) {
    const heading = line.match(/^##\s+(.+)\s*$/);
    if (heading) {
      if (current) sections[current] = buffer.join('\n').trim();
      current = heading[1].toLowerCase().replace(/[^a-z]/g, '');
      buffer.length = 0;
    } else if (current) {
      buffer.push(line);
    }
  }
  if (current) sections[current] = buffer.join('\n').trim();
  return sections;
}

/**
 * Parsea la sección `## Locators` (`- \`label\`: desc`) a
 * [{ name, description }]. Devuelve [] si no hay locators.
 */
function parseLocators(text) {
  if (!text) return [];
  const locators = [];
  for (const line of text.split('\n')) {
    const match = line.match(/^-\s*`([^`]+)`\s*:\s*(.+)$/);
    if (match) {
      locators.push({ name: match[1].trim(), description: match[2].trim() });
    }
  }
  return locators;
}

/** Parsea un SKILL.md a un PromptRecord. */
function toPrompt({ filePath, site, action }) {
  const source = readFileSync(filePath, 'utf8');
  const { data, content } = matter(source);
  const sections = parseSections(content);
  const id = `${slugDomain(site)}-${action}`;
  return new PromptRecord({
    id,
    site,
    // El `type` canónico: mapa de normalización o el nombre de la carpeta.
    type: TYPE_BY_FOLDER[action] ?? action,
    tags: data.tags,
    lang: data.lang,
    model: data.model,
    version: data.version,
    name: data.name,
    description: data.description,
    role: sections.role,
    context: sections.context,
    input: sections.input,
    output: sections.output,
    constraints: sections.constraints,
    locators: parseLocators(sections.locators),
    example: sections.example,
  });
}

/** Validación + agrupación. Falla el build con errores claros. */
function buildPrompts() {
  const skills = collectSkills();
  if (skills.length === 0) {
    throw new Error('[to-json] No se encontraron SKILL.md en prompts/generic|sites');
  }

  const prompts = skills.map(toPrompt);
  const byId = new Map();
  for (const p of prompts) {
    if (!p.name) {
      throw new Error(`[to-json] Falta el campo \`name\` (frontmatter) en ${p.id}.`);
    }
    if (!p.description) {
      throw new Error(`[to-json] Falta el campo \`description\` (frontmatter) en ${p.id}.`);
    }
    if (byId.has(p.id)) {
      throw new Error(`[to-json] id duplicado: ${p.id}`);
    }
    byId.set(p.id, p);
  }
  return prompts;
}

/** Escribe el índice y un JSON por sitio en dist/. */
function writeDist(prompts) {
  const bySite = new Map();
  for (const p of prompts) {
    if (!bySite.has(p.site)) bySite.set(p.site, []);
    bySite.get(p.site).push(p);
  }

  const sites = [...bySite.keys()].sort();
  const generatedAt = new Date().toISOString();

  mkdirSync(join(DIST_DIR, 'sites'), { recursive: true });

  // Índice
  writeFileSync(
    join(DIST_DIR, 'prompts.json'),
    JSON.stringify(
      {
        version: generatedAt,
        generatedAt,
        count: prompts.length,
        sites,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );

  // Un archivo por sitio (incluye generic).
  for (const site of sites) {
    writeFileSync(
      join(DIST_DIR, 'sites', `${site}.json`),
      JSON.stringify(bySite.get(site), null, 2) + '\n',
      'utf8',
    );
  }

  console.log(
    `[to-json] OK: ${prompts.length} prompts en ${sites.length} sitios -> dist/ (${generatedAt})`,
  );
}

try {
  writeDist(buildPrompts());
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
