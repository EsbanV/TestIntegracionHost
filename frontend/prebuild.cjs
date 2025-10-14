// frontend/prebuild.cjs
const fs = require('fs');
const { execSync } = require('child_process');

console.log('CWD:', process.cwd());
console.log('NODE v:', process.version);

const hasNM = fs.existsSync('./node_modules');
const hasReactDir = fs.existsSync('./node_modules/react');
console.log('Has node_modules?', hasNM);
console.log('Has node_modules/react?', hasReactDir);
if (hasNM) {
  try {
    const list = fs.readdirSync('./node_modules').slice(0, 30);
    console.log('node_modules entries (first 30):', list);
  } catch {}
}

try {
  const pkgPath = require.resolve('react/package.json');
  console.log('react package.json:', pkgPath);
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  console.log('react version:', pkg.version);
} catch (e) {
  console.error('RESOLVE FAIL react/package.json:', e?.message);
}

try {
  const jsxPath = require.resolve('react/jsx-runtime');
  console.log('react/jsx-runtime path:', jsxPath);
} catch (e) {
  console.error('RESOLVE FAIL react/jsx-runtime:', e?.message);
}

// Muestra configuración real de npm
try {
  const cfg = execSync('npm config list', { stdio: 'pipe' }).toString();
  console.log('npm config list:\n', cfg);
} catch {}
// Muestra variables de entorno relevantes
for (const key of Object.keys(process.env).filter(k => k.startsWith('NPM_CONFIG_')).sort()) {
  console.log(key, '=', process.env[key]);
}

// Si no está react, corta el build para que lo veamos aquí arriba
if (!hasReactDir) process.exit(1);
