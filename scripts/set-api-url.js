/**
 * Remplace l'URL de l'API dans environment.prod.ts avant le build Netlify.
 * Utilise la variable d'environnement API_URL (ex: https://xxx.railway.app/api/v1)
 */
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../src/environments/environment.prod.ts');
const apiUrl = process.env.API_URL || 'https://api.neracosmetique.ci';
// S'assurer que l'URL ne se termine pas par /
const apiUrlClean = apiUrl.replace(/\/+$/, '');
const fullApiUrl = apiUrlClean.includes('/api/v1') ? apiUrlClean : `${apiUrlClean}/api/v1`;

let content = fs.readFileSync(envPath, 'utf8');
content = content.replace(
  /apiUrl:\s*['"][^'"]*['"]/,
  `apiUrl: '${fullApiUrl}'`
);
fs.writeFileSync(envPath, content);
console.log('API URL set to:', fullApiUrl);
