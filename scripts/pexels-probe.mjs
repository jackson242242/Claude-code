// Ad-hoc FOOTAGE-FIRST gate probe: search Pexels video for each query and print
// id/duration/user + title-slug from the video URL so we can judge whether clips
// identify THE SITE (gate PASS = >=3 usable clips whose slug identifies the site).
// Usage: NODE_USE_ENV_PROXY=1 node scripts/pexels-probe.mjs "query one" "query two" ...
const API_KEY = process.env.PEXELS_API_KEY;
if (!API_KEY) { console.error('no PEXELS_API_KEY'); process.exit(1); }
const queries = process.argv.slice(2);
for (const q of queries) {
  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&per_page=8&orientation=portrait`;
  try {
    const r = await fetch(url, { headers: { Authorization: API_KEY } });
    const j = await r.json();
    console.log(`\n=== "${q}" (${(j.videos||[]).length} results) ===`);
    for (const v of j.videos || []) {
      const slug = (v.url || '').replace(/\/$/, '').split('/').pop();
      console.log(`  #${v.id} ${v.duration}s  slug="${slug}"  by ${v.user?.name}`);
    }
  } catch (e) { console.log(`  ERROR ${q}: ${e.message}`); }
}
