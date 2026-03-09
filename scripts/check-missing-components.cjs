#!/usr/bin/env node
// Check for JSX components used but not defined/imported
const fs = require('fs');
const path = require('path');

function globSync(dir, suffix) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(suffix)) results.push(full);
    }
  }
  walk(dir);
  return results;
}

const dirs = [
  'src/pages',
  'src/components',
  'src/v8/pages',
  'src/v8/components',
  'src/v8/flows',
];

// Known globals / HTML elements / React built-ins to ignore
const IGNORE = new Set([
  'React', 'Fragment', 'Suspense', 'StrictMode', 'ErrorBoundary',
  'Provider', 'Router', 'Route', 'Switch', 'Redirect',
  'BrowserRouter', 'Link', 'NavLink', 'Navigate', 'Routes',
  'ThemeProvider', 'GlobalStyles',
  'MDIIcon', // defined inline in some files
]);

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // JSX components used: <Foo or <Foo.Bar — only top-level names
  const usedMatches = [...content.matchAll(/<([A-Z][a-zA-Z0-9]*)/g)];
  const used = new Set(usedMatches.map(m => m[1]).filter(n => !IGNORE.has(n)));

  const defined = new Set();

  // Named imports: import { Foo, Bar as Baz } from ...
  for (const m of content.matchAll(/^import\s+\{([^}]+)\}/gm)) {
    m[1].split(',').forEach(part => {
      const name = part.trim().split(/\s+as\s+/).pop().trim();
      defined.add(name);
    });
  }

  // Default imports: import Foo from ...
  for (const m of content.matchAll(/^import\s+([A-Z][a-zA-Z0-9_]*)\s+from/gm)) {
    defined.add(m[1]);
  }

  // Local definitions: const Foo = / function Foo / class Foo
  for (const m of content.matchAll(/^(?:export\s+)?(?:const|function|class)\s+([A-Z][a-zA-Z0-9_]*)/gm)) {
    defined.add(m[1]);
  }

  // Inline arrow components deeper (not at line start but assigned)
  for (const m of content.matchAll(/(?:const|let|var)\s+([A-Z][a-zA-Z0-9_]*)\s*(?::|=)/g)) {
    defined.add(m[1]);
  }

  const missing = [...used].filter(n => !defined.has(n));
  if (missing.length > 0) {
    console.log(path.relative(process.cwd(), filePath) + ': MISSING -> ' + missing.join(', '));
  }
}

let files = [];
for (const dir of dirs) {
  files = files.concat(globSync(dir, '.tsx'));
}

files.forEach(checkFile);
