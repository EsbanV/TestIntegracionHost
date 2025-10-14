// frontend/prebuild.cjs
try {
  const path = require.resolve('react/jsx-runtime');
  console.log('RESOLVE OK:', path);
} catch (e) {
  console.error('RESOLVE FAIL react/jsx-runtime:', e?.message);
  process.exit(1);
}
