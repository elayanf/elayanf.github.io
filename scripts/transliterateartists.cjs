// ...existing code...
const fs = require('fs');
const path = require('path');

(async function run() {
  const mod = await import('@vitalets/google-translate-api');
  const translate =
    (typeof mod.default === 'function' && mod.default) ||
    (typeof mod.default?.default === 'function' && mod.default.default) ||
    (typeof mod.translate === 'function' && mod.translate);

  if (typeof translate !== 'function') {
    console.error('Loaded module shape:', Object.keys(mod), 'default keys:', mod.default && Object.keys(mod.default));
    throw new TypeError('translate function not found from @vitalets/google-translate-api');
  }

  const jsonPath = path.join(__dirname, '../resources/artists.json');
  const artistsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  for (const artist of artistsData.artists) {
    const fullName = [artist.firstName, artist.lastName].filter(Boolean).join(' ');
    if (!artist.name_ar && fullName) {
      const { text: ar } = await translate(fullName, { to: 'ar' });
      artist.name_ar = ar;
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(artistsData, null, 2));
  console.log('artists.json updated with name_ar fields.');
})().catch(err => {
  console.error('Transliteration failed:', err);
  process.exit(1);
});
// ...existing code...