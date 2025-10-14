// frontend/prebuild.cjs
const fs = require('fs');
const path = require('path');

console.log('CWD:', process.cwd());
console.log('NODE v:', process.version);
console.log('Has node_modules?', fs.existsSync('./node_modules'));
console.log('Has node_modules/react?', fs.existsSync('./node_modules/react'));
if (fs.existsSync('./node_modules')) {
  console.log('node_modules entries (first 20):', fs.readdirSync('./node_modules').slice(0, 20));
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
  process.exit(1);
}

const { execSync } = require('child_process');
console.log('npm config list:\n', execSync('npm config list', { stdio: 'pipe' }).toString());
