/**
 * Copie Font Awesome (CSS + webfonts) depuis node_modules vers src/assets/fontawesome
 * pour un chargement 100 % local (évite le blocage "Tracking Prevention" du navigateur).
 * Exécuté après npm install (postinstall).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const source = path.join(root, 'node_modules', '@fortawesome', 'fontawesome-free');
const dest = path.join(root, 'src', 'assets', 'fontawesome');

if (!fs.existsSync(source)) {
  console.log('Font Awesome non installé (node_modules). Ignorer la copie.');
  process.exit(0);
}

function copyRecursive(src, dst) {
  if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) copyRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}

try {
  if (fs.existsSync(path.join(source, 'css'))) {
    copyRecursive(path.join(source, 'css'), path.join(dest, 'css'));
    console.log('Font Awesome: css copié vers src/assets/fontawesome/css');
  }
  if (fs.existsSync(path.join(source, 'webfonts'))) {
    copyRecursive(path.join(source, 'webfonts'), path.join(dest, 'webfonts'));
    console.log('Font Awesome: webfonts copié vers src/assets/fontawesome/webfonts');
  }
} catch (err) {
  console.warn('Erreur copie Font Awesome:', err.message);
  process.exit(0);
}
