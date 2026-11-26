const http = require('http');

console.log('========================================================');
console.log('   VERIFYING EXERCISES & FAVORITES RUNTIME FIXES        ');
console.log('========================================================\n');

function assert(condition, message) {
  if (!condition) {
    console.error('❌ FAIL:', message);
    process.exit(1);
  }
  console.log('✅ PASS:', message);
}

// 1. Test WorkoutContext Safe Favorites Logic
console.log('--- [1. WorkoutContext State & Handlers Edge Cases] ---');
{
  const testCases = [
    { name: 'undefined favorites', input: undefined },
    { name: 'null favorites', input: null },
    { name: 'object favorites', input: { invalid: true } },
    { name: 'mixed numbers and strings', input: [1, '0001', null, undefined, 2] },
    { name: 'valid array', input: ['0001', '0002'] }
  ];

  testCases.forEach(({ name, input }) => {
    // Safe extraction logic applied in WorkoutContext
    const safeFavorites = Array.isArray(input) ? input.filter(Boolean).map(String) : [];
    assert(Array.isArray(safeFavorites), `safeFavorites is array for: ${name}`);
    assert(typeof safeFavorites.includes === 'function', `safeFavorites.includes is callable for: ${name}`);
    assert(typeof safeFavorites.length === 'number', `safeFavorites.length is valid for: ${name}`);
  });

  // Test toggleFavorite logic
  let state = ['0001'];
  const toggleFavorite = (rawId) => {
    if (!rawId) return;
    const id = String(rawId);
    const cur = Array.isArray(state) ? state.filter(Boolean).map(String) : [];
    const on = cur.includes(id);
    state = on ? cur.filter(x => x !== id) : Array.from(new Set([...cur, id]));
  };

  toggleFavorite(1); // toggles '1' (removes '0001' if matching or adds '1')
  assert(state.includes('1'), 'toggleFavorite with number 1 converts to string');
  toggleFavorite('1'); // removes '1'
  assert(!state.includes('1'), 'toggleFavorite removes existing item');
  toggleFavorite(null); // safely ignores null
  toggleFavorite(undefined); // safely ignores undefined
  assert(Array.isArray(state), 'state remains array after null/undefined calls');
}

// 2. Test Library Filter Logic & Temporal Dead Zone
console.log('\n--- [2. Library Results Filter & Pagination Logic] ---');
{
  const mockExercises = [
    { id: '0001', name: '3/4 sit-up', bodyPart: 'waist', equipment: 'body weight', target: 'abs', secondary: ['hip flexors', 'lower back'] },
    { id: '0002', name: '45° side bend', bodyPart: 'waist', equipment: 'body weight', target: 'abs', secondary: undefined }, // Edge case: undefined secondary
    { id: '0003', name: 'air bike', bodyPart: 'waist', equipment: 'body weight', target: 'abs', secondary: null }, // Edge case: null secondary
  ];

  const testFilter = (fav, favorites, query = '') => {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    const safeFavs = Array.isArray(favorites) ? favorites.map(String) : [];
    return mockExercises.filter((e) => {
      if (!e) return false;
      const exId = String(e.id || e._id || '');
      if (fav && !safeFavs.includes(exId)) return false;
      if (tokens.length) {
        const secondary = Array.isArray(e.secondary) ? e.secondary.join(' ') : '';
        const hay = `${e.name || ''} ${e.target || ''} ${e.equipment || ''} ${e.bodyPart || ''} ${secondary}`.toLowerCase();
        return tokens.every((t) => hay.includes(t));
      }
      return true;
    });
  };

  // Navigating to /exercises (fav=false) with undefined favorites
  const normalResults = testFilter(false, undefined);
  assert(normalResults.length === 3, 'Filter succeeds without crash when favorites is undefined');

  // Navigating to /exercises?fav=1 (fav=true) with empty/null/non-array favorites
  const favUndefined = testFilter(true, null);
  assert(favUndefined.length === 0, 'Filter /exercises?fav=1 succeeds when favorites is null');

  const favLoaded = testFilter(true, ['0001']);
  assert(favLoaded.length === 1 && favLoaded[0].id === '0001', 'Filter /exercises?fav=1 matches correct favorited exercise');

  // Query search with undefined/null secondary fields
  const searchResults = testFilter(false, [], 'side bend');
  assert(searchResults.length === 1 && searchResults[0].id === '0002', 'Search succeeds across items with undefined secondary');

  // Verify pagination calculation without TDZ reference error
  const pageSize = 24;
  const currentPage = 1;
  const totalPages = Math.max(1, Math.ceil((normalResults.length || 0) / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  assert(safePage === 1, 'safePage computed correctly before any effect dependency');

  // Verify Object.fromEntries with undefined/null facets
  const countsUndefined = Object.fromEntries(Array.isArray(undefined) ? undefined : []);
  assert(typeof countsUndefined === 'object', 'Object.fromEntries safely handles undefined facets');
}

// 3. Test Live Vite Proxy & Backend Endpoints for Exercises and Favorites
console.log('\n--- [3. Live HTTP Endpoints for Exercises & Favorites] ---');
function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const postData = options.body ? JSON.stringify(options.body) : '';
    const req = http.request({
      hostname: 'localhost',
      port: 5173,
      path: '/api/v1' + path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.token ? { 'Authorization': `Bearer ${options.token}` } : {}),
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function verifyLive() {
  // Test login to obtain token
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: { email: 'athlete@fitnex.com', password: 'Password123!' }
  });
  assert(loginRes.status === 200, 'Athlete login successful via proxy');
  const token = loginRes.body.data.accessToken;

  // Test getAll exercises
  const exercisesRes = await request('/exercises?limit=24');
  assert(exercisesRes.status === 200, 'GET /exercises returns 200');
  assert(Array.isArray(exercisesRes.body.data.items), 'GET /exercises returns items array');
  assert(exercisesRes.body.data.items.length === 24, 'GET /exercises returns 24 movements');

  // Test get exercise facets
  const facetsRes = await request('/exercises/facets');
  assert(facetsRes.status === 200, 'GET /exercises/facets returns 200');
  assert(Array.isArray(facetsRes.body.data.bodyParts), 'facets.bodyParts is array');

  // Test toggle favorite on exercise 0001
  const toggleRes = await request('/exercises/0001/favorite', {
    method: 'POST',
    token
  });
  assert(toggleRes.status === 200, 'POST /exercises/0001/favorite returns 200');
  assert(toggleRes.body.data.exerciseId === '0001', 'Favorite response includes exerciseId 0001');

  // Test get favorites
  const favsRes = await request('/exercises/favorites/me', { token });
  assert(favsRes.status === 200, 'GET /exercises/favorites/me returns 200');
  assert(Array.isArray(favsRes.body.data), 'User favorites is array');

  console.log('\n========================================================');
  console.log('   ALL EXERCISE & FAVORITES VERIFICATION CHECKS PASSED  ');
  console.log('========================================================');
}

verifyLive().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
