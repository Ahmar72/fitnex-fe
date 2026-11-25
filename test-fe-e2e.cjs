const http = require('http');

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
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
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

function assert(condition, message) {
  if (!condition) {
    console.error('❌ FAIL:', message);
    throw new Error(message);
  }
  console.log('✅ PASS:', message);
}

async function runE2E() {
  console.log('========================================================');
  console.log('   FITNEX FRONTEND E2E API PROXY & INTEGRATION SUITE    ');
  console.log('========================================================');

  // 1. Health check via Vite Proxy
  const health = await request('/health');
  assert(health.status === 200 && health.body.data.status === 'healthy', 'Vite Proxy -> Health check 200');

  // 2. Auth login via Vite Proxy
  const login = await request('/auth/login', {
    method: 'POST',
    body: { email: 'athlete@fitnex.com', password: 'Password123!' },
  });
  assert(login.status === 200 && login.body.data.accessToken, 'Vite Proxy -> Athlete login token issued');
  const token = login.body.data.accessToken;

  // 3. User profile & settings via Vite Proxy
  const me = await request('/users/me', { token });
  assert(me.status === 200 && me.body.data.email === 'athlete@fitnex.com', 'Vite Proxy -> /users/me authenticated');

  // 4. Exercises catalog & facets via Vite Proxy
  const exercises = await request('/exercises?limit=10');
  assert(exercises.status === 200 && exercises.body.data.meals === undefined && exercises.body.data.total === 1324, 'Vite Proxy -> Live exercises catalog (1,324 movements)');

  const facets = await request('/exercises/facets');
  assert(facets.status === 200 && facets.body.data.bodyParts.length > 5, 'Vite Proxy -> Exercises taxonomy facets');

  // 5. Workout Builder draft via Vite Proxy
  const workoutDraft = await request('/workouts/current', { token });
  assert(workoutDraft.status === 200, 'Vite Proxy -> /workouts/current draft loaded');

  // 6. Training Plans catalog & active enrollment via Vite Proxy
  const plans = await request('/plans');
  assert(plans.status === 200 && plans.body.data.length === 9, 'Vite Proxy -> 9 training plans returned');

  const activePlan = await request('/plans/active/me', { token });
  assert(activePlan.status === 200, 'Vite Proxy -> /plans/active/me responded 200');

  // 7. Workout History, Streaks & PRs via Vite Proxy
  const streak = await request('/history/streak', { token });
  assert(streak.status === 200 && streak.body.data.streak !== undefined, 'Vite Proxy -> History streak calculation');

  const prs = await request('/history/prs', { token });
  assert(prs.status === 200 && Array.isArray(prs.body.data), 'Vite Proxy -> Personal records collection');

  // 8. Dashboard summary via Vite Proxy
  const dashboard = await request('/dashboard/summary', { token });
  assert(dashboard.status === 200 && dashboard.body.data.streak !== undefined, 'Vite Proxy -> Dashboard aggregate summary');

  // 9. Nutrition meals catalog, categories & daily summary via Vite Proxy
  const meals = await request('/meals?limit=10');
  assert(meals.status === 200 && meals.body.data.total === 52, 'Vite Proxy -> Nutrition catalog (52 recipes)');

  const categories = await request('/meals/categories');
  assert(categories.status === 200 && categories.body.data.length === 7, 'Vite Proxy -> Nutrition categories (7 categories)');

  const dailySummary = await request('/meals/daily-summary', { token });
  assert(dailySummary.status === 200 && dailySummary.body.data.targets.calories > 0, 'Vite Proxy -> Daily nutrition summary');

  console.log('========================================================');
  console.log('   🎉 ALL 13/13 FRONTEND PROXY & E2E CHECKS PASSED!     ');
  console.log('========================================================');
}

runE2E().catch(err => {
  console.error('E2E Suite Failed:', err);
  process.exit(1);
});
