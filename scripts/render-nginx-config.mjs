import { readFileSync } from 'node:fs';

const rawApiUrl = process.argv[2]?.trim();
if (!rawApiUrl) {
  throw new Error('Informe VITE_API_URL para configurar o connect-src da CSP.');
}

let apiUrl;
try {
  apiUrl = new URL(rawApiUrl);
} catch {
  throw new Error('VITE_API_URL deve ser uma URL HTTP(S) absoluta.');
}

if (
  !['http:', 'https:'].includes(apiUrl.protocol) ||
  apiUrl.username || apiUrl.password || apiUrl.search || apiUrl.hash ||
  (apiUrl.pathname !== '/' && apiUrl.pathname !== '')
) {
  throw new Error('VITE_API_URL deve usar HTTP(S) e não pode incluir credenciais, query ou fragmento.');
}

const template = readFileSync(new URL('../nginx.conf', import.meta.url), 'utf8');
const rendered = template.replaceAll('__API_ORIGIN__', apiUrl.origin);
if (rendered.includes('__API_ORIGIN__')) {
  throw new Error('Não foi possível substituir a origem da API na CSP.');
}

process.stdout.write(rendered);
