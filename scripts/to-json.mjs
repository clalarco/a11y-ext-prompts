#!/usr/bin/env node
/**
 * Convierte la biblioteca de prompts (Markdown) a un bundle JSON que se
 * publica como asset de GitHub Releases en este repositorio.
 *
 * Fuente: `prompts/generic/*.md` y `prompts/sites/<dominio>.md`.
 * Salida:
 *   - `dist/prompts.json`  -> índice { version, generatedAt, count, sites }
 *   - `dist/sites/<site>.json` -> array de prompts por sitio (incl. generic)
 *
 * El `id` es la clave que consume la extensión blind-ext (`prompt-store.ts`).
 * Misma semántica de parsing/validación que `prompts-plugin.ts` del parent.
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
    this.version = record.version ?? 1;
    this.role = record.role ?? '';
    this.context = record.context ?? '';
    this.input = record.input ?? '';
    this.output = record.output ?? '';
    this.constraints = record.constraints ?? '';
    this.example = record.example ?? '';
  }
}

/** Recolecta los `*.md` ordenados de un subdirectorio fuente. */
function collectMarkdown(dir) {
  const full = join(PROMPTS_DIR, dir);
  let entries;
  try {
    entries = readdirSync(full);
  } catch {
    return [];
  }
  return entries
    .filter((name) => name.endsWith('.md'))
    .map((name) => join(full, name))
    .sort();
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

/** Parsea un archivo Markdown a un PromptRecord. */
function toPrompt(filePath) {
  const source = readFileSync(filePath, 'utf8');
  const { data, content } = matter(source);
  const sections = parseSections(content);
  return new PromptRecord({
    id: data.id,
    site: data.site,
    type: data.type,
    tags: data.tags,
    lang: data.lang,
    model: data.model,
    version: data.version,
    role: sections.role,
    context: sections.context,
    input: sections.input,
    output: sections.output,
    constraints: sections.constraints,
    example: sections.example,
  });
}

/** Validate + agrupación. Falla el build con errores claros. */
function buildPrompts() {
  const files = [...collectMarkdown('generic'), ...collectMarkdown('sites')];
  if (files.length === 0) {
    throw new Error('[to-json] No se encontraron prompts en prompts/generic|sites');
  }

  const prompts = files.map(toPrompt);
  const byId = new Map();
  for (const p of prompts) {
    if (!p.id) {
      throw new Error('[to-json] Falta el campo `id` requerido en uno de los archivos.');
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
