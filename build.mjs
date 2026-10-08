import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';

await mkdir('_site', { recursive: true });
for (const name of ['landing', 'prototype', 'CNAME', '.nojekyll']) {
  await cp(name, `_site/${name}`, { recursive: true });
}
let html = await readFile('landing/index.html', 'utf8');
html = html.replace(/(href|src|srcset|imagesrcset)="assets\//g, '$1="landing/assets/')
  .replace(/, assets\//g, ', landing/assets/')
  .replace('href="favicon.svg"', 'href="landing/favicon.svg"')
  .replace('href="styles.css"', 'href="landing/styles.css"')
  .replace('src="script.js"', 'src="landing/script.js"')
  .replaceAll('../prototype/', 'prototype/')
  .replace('<meta property="og:type" content="website">', '<meta property="og:type" content="website">\n  <meta property="og:url" content="https://razdelit.ru/">\n  <link rel="canonical" href="https://razdelit.ru/">');
await writeFile('_site/index.html', html);
