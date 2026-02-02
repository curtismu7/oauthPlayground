import fs from 'fs';
import path from 'path';

const root = process.cwd();
const csvPath = path.join(root, 'docs', 'SERVICES_TOPLEVEL_TO_APPS.csv');
const outCsv = path.join(root, 'docs', 'SERVICES_TOPLEVEL_TO_APPS_MAPPED.csv');
const outXls = path.join(root, 'docs', 'SERVICES_TOPLEVEL_TO_APPS_MAPPED.xls');

function readCsv(p) {
  const txt = fs.readFileSync(p, 'utf8');
  const lines = txt.split(/\r?\n/).filter(Boolean);
  const header = lines.shift();
  return lines.map(l => {
    const parts = l.split(',');
    const service = parts[0];
    const svcPath = parts[1] || '';
    return { service: service.trim(), path: svcPath.trim() };
  });
}

function walk(dir, results=[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist' || e.name === 'build' || e.name === 'docs') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, results);
    else results.push(full);
  }
  return results;
}

function isTextFile(file) {
  const ext = path.extname(file).toLowerCase();
  return ['.js', '.ts', '.tsx', '.jsx', '.json', '.md', '.html', '.css'].includes(ext);
}

(async function main(){
  const services = readCsv(csvPath);
  const files = walk(path.join(root));
  const textFiles = files.filter(isTextFile);

  const mapping = [];

  for (const s of services) {
    const name = s.service;
    const matches = new Set();
    for (const f of textFiles) {
      try {
        const txt = fs.readFileSync(f, 'utf8');
        if (txt.indexOf(name) !== -1) {
          matches.add(path.relative(root, f));
        }
      } catch (err) {}
    }
    mapping.push({ service: name, path: s.path, uses: Array.from(matches) });
  }

  // write CSV
  const header = 'Service,Path,Apps/Components';
  const csvLines = [header];
  for (const m of mapping) {
    const comps = m.uses.join('; ');
    // Escape quotes
    const line = `${m.service},${m.path},"${comps}"`;
    csvLines.push(line);
  }
  fs.writeFileSync(outCsv, csvLines.join('\n'), 'utf8');

  // write simple HTML table for .xls
  const rows = mapping.map(m => {
    const comps = m.uses.join('; ');
    return `<tr><td>${escapeHtml(m.service)}</td><td>${escapeHtml(m.path)}</td><td>${escapeHtml(comps)}</td></tr>`;
  }).join('\n');
  const html = `<!doctype html><html><head><meta charset="utf-8" /></head><body><table border="1"><thead><tr><th>Service</th><th>Path</th><th>Apps/Components</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
  fs.writeFileSync(outXls, html, 'utf8');

  console.log('Wrote', outCsv, outXls);

  function escapeHtml(s) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
