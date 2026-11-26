const http = require('http');

/**
 * Fitnex Comprehensive Frontend-to-Backend API Linkage Test Suite
 * 
 * Tests every single API endpoint by sending requests through the Frontend
 * Vite Dev Server reverse proxy on PORT 5173 (http://localhost:5173/api/v1).
 * Verifies that the Frontend and Backend are 100% linked, every module is
 * hitting, and all responses return valid JSON envelopes.
 */

const FRONTEND_HOST = 'localhost';
const FRONTEND_PORT = 5173;

function feRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const postData = options.body ? JSON.stringify(options.body) : '';
    const req = http.request({
      hostname: FRONTEND_HOST,
      port: FRONTEND_PORT,
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
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

async function runLinkageAudit() {
  console.log('================================================================');
  console.log('   FITNEX FRONTEND-TO-BACKEND API LINKAGE & ENDPOINT AUDIT     ');
  console.log('   Target: http://localhost:5173 (Frontend Proxy -> Port 5000)   ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health Diagnostic
    console.log('--- [1. Infrastructure & System Diagnostics] ---');
    const health = await feRequest('/health');
    assert(health.status === 200 && health.body.data?.status === 'healthy', 'Frontend proxy forwards GET /health (Status 200, healthy)');

    // 2. Authentication & Session
    console.log('\n--- [2. Authentication Module & JWT Issuance] ---');
    const login = await feRequest('/auth/login', {
      method: 'POST',
      body: { email: 'athlete@fitnex.com', password: 'Password123!' },
    });
    assert(login.status === 200 && !!login.body.data?.accessToken, 'POST /auth/login returns JWT access token through frontend');
    const token = login.body.data?.accessToken;
    const refreshToken = login.body.data?.refreshToken;

    const authMe = await feRequest('/auth/me', { token });
    assert(authMe.status === 200 && authMe.body.data?.email === 'athlete@fitnex.com', 'GET /auth/me returns authenticated user identity');

    // 3. Users & Profile
    console.log('\n--- [3. Users & Account Profile Module] ---');
    const userMe = await feRequest('/users/me', { token });
    assert(userMe.status === 200 && !!userMe.body.data?.id, 'GET /users/me retrieves user profile');

    const updateProf = await feRequest('/users/profile', {
      method: 'PATCH',
      token,
      body: { preferredLanguage: 'en', profile: { goal: 'muscle', level: 'intermediate' } },
    });
    assert(updateProf.status === 200, 'PATCH /users/profile updates user training profile');

    const updateSettings = await feRequest('/users/me/settings', {
      method: 'PATCH',
      token,
      body: { restTimerSeconds: 75 },
    });
    assert(updateSettings.status === 200 && updateSettings.body.data?.restTimerSeconds === 75, 'PATCH /users/me/settings saves rest timer configuration');

    // 4. Onboarding & Metabolic Engine
    console.log('\n--- [4. Onboarding & Metabolic Engine Module] ---');
    const calc = await feRequest('/onboarding/calculate', {
      method: 'POST',
      body: {
        age: 26,
        sex: 'male',
        weight: 78,
        weightUnit: 'kg',
        height: 178,
        heightUnit: 'cm',
        activityLevel: 'moderate',
        dietGoal: 'maintain',
      },
    });
    assert(calc.status === 200 && calc.body.data?.bmr > 0 && calc.body.data?.targetCalories > 0, 'POST /onboarding/calculate returns Mifflin-St Jeor BMR & calorie budget');

    const onbSave = await feRequest('/onboarding/save', {
      method: 'POST',
      token,
      body: {
        age: 26,
        sex: 'male',
        weight: 78,
        weightUnit: 'kg',
        height: 178,
        heightUnit: 'cm',
        activityLevel: 'moderate',
        goal: 'muscle',
        level: 'intermediate',
        daysPerWeek: 4,
      },
    });
    assert(onbSave.status === 200, 'POST /onboarding/save commits onboarding goals to database');

    const onbMe = await feRequest('/onboarding/me', { token });
    assert(onbMe.status === 200 && !!onbMe.body.data?.goal, 'GET /onboarding/me retrieves saved onboarding profile');

    // 5. Exercises Catalog
    console.log('\n--- [5. Exercises Catalog Module] ---');
    const exList = await feRequest('/exercises?limit=24');
    const exCount = exList.body.data?.items?.length || exList.body.data?.exercises?.length || 0;
    assert(exList.status === 200 && exCount === 24, 'GET /exercises returns paginated movements (24 items)');

    const facets = await feRequest('/exercises/facets');
    assert(facets.status === 200 && facets.body.data?.bodyParts?.length > 0, 'GET /exercises/facets returns aggregated taxonomy counts');

    const singleEx = await feRequest('/exercises/0001');
    assert(singleEx.status === 200 && singleEx.body.data?.exerciseId === '0001', 'GET /exercises/:id retrieves exercise by ID');

    const favToggle = await feRequest('/exercises/0001/favorite', { method: 'POST', token });
    assert(favToggle.status === 200, 'POST /exercises/:id/favorite toggles bookmark state');

    const myFavs = await feRequest('/exercises/favorites/me', { token });
    assert(myFavs.status === 200 && Array.isArray(myFavs.body.data), 'GET /exercises/favorites/me returns user favorite IDs');

    // 6. Workout Builder
    console.log('\n--- [6. Workout Builder Module] ---');
    const curDraft = await feRequest('/workouts/current', { token });
    assert(curDraft.status === 200, 'GET /workouts/current retrieves user draft');

    const saveDraft = await feRequest('/workouts/current', {
      method: 'PUT',
      token,
      body: { name: 'Morning Hypertrophy', items: [{ uid: 'item_1', exerciseId: '0001', sets: [{ id: 's1', reps: 10, weight: 0, done: true }] }] },
    });
    assert(saveDraft.status === 200, 'PUT /workouts/current updates live builder draft');

    const addItem = await feRequest('/workouts/current/items', {
      method: 'POST',
      token,
      body: { exerciseId: '0007', reps: 12, weight: 45 },
    });
    assert(addItem.status === 200, 'POST /workouts/current/items appends item to draft');

    const loadRoutine = await feRequest('/workouts/load-routine', {
      method: 'POST',
      token,
      body: {
        name: 'Chest Hypertrophy',
        list: [{ id: '0001', sets: 3, reps: 10, weight: 20 }],
      },
    });
    assert(loadRoutine.status === 200, 'POST /workouts/load-routine populates routine template');

    // 7. Training Plans & Programs
    console.log('\n--- [7. Training Plans & Calendar Module] ---');
    const allPlans = await feRequest('/plans');
    assert(allPlans.status === 200 && allPlans.body.data?.length === 9, 'GET /plans returns all 9 pre-built scientific training plans');

    const planDetail = await feRequest('/plans/abs-building');
    assert(planDetail.status === 200 && planDetail.body.data?.planId === 'abs-building', 'GET /plans/:id retrieves plan with weekly schedules');

    const enroll = await feRequest('/plans/enroll', {
      method: 'POST',
      token,
      body: { planId: 'abs-building', daysPerWeek: 4 },
    });
    assert(enroll.status === 200, 'POST /plans/enroll enrolls user in plan');

    const activePlan = await feRequest('/plans/active/me', { token });
    const enrolledPlanId = activePlan.body.data?.enrollment?.planId || activePlan.body.data?.plan?.planId || activePlan.body.data?.planId;
    assert(activePlan.status === 200 && enrolledPlanId === 'abs-building', 'GET /plans/active/me retrieves active program enrollment');

    // 8. Workout History, Streaks & PRs
    console.log('\n--- [8. History, Streaks & PRs Module] ---');
    const logSession = await feRequest('/history', {
      method: 'POST',
      token,
      body: {
        name: 'Lat Pull & Biceps',
        durationSeconds: 2400,
        dateKey: new Date().toISOString().slice(0, 10),
        exercises: [{
          exerciseId: '0007',
          name: 'Alternate Lateral Pulldown',
          sets: [{ setNumber: 1, reps: 10, weight: 55 }, { setNumber: 2, reps: 10, weight: 60 }],
        }],
      },
    });
    assert(logSession.status === 201 || logSession.status === 200, 'POST /history logs completed session and volume');

    const historyList = await feRequest('/history?limit=10', { token });
    const sessions = historyList.body.data?.items || historyList.body.data?.sessions || historyList.body.data;
    assert(historyList.status === 200 && Array.isArray(sessions), 'GET /history retrieves workout sessions list');

    const streak = await feRequest('/history/streak', { token });
    const streakVal = streak.body.data?.streak ?? streak.body.data?.currentStreak;
    assert(streak.status === 200 && typeof streakVal === 'number', 'GET /history/streak calculates consecutive training days');

    const prs = await feRequest('/history/prs', { token });
    assert(prs.status === 200 && Array.isArray(prs.body.data), 'GET /history/prs returns Personal Records registry');

    // 9. Dashboard Analytics
    console.log('\n--- [9. Dashboard Analytics Module] ---');
    const dashSummary = await feRequest('/dashboard/summary', { token });
    assert(dashSummary.status === 200 && typeof dashSummary.body.data?.streak === 'number', 'GET /dashboard/summary returns aggregated streak, volume, and active plan');

    // 10. Nutrition & Meal Planner
    console.log('\n--- [10. Nutrition & Meal Planning Module] ---');
    const allMeals = await feRequest('/meals?limit=100');
    const mealItems = allMeals.body.data?.meals || allMeals.body.data;
    assert(allMeals.status === 200 && (mealItems?.length === 52 || allMeals.body.data?.total === 52), 'GET /meals returns all 52 chef recipes');

    const mealCats = await feRequest('/meals/categories');
    assert(mealCats.status === 200 && mealCats.body.data?.length === 7, 'GET /meals/categories returns 7 recipe categories');

    const singleMeal = await feRequest('/meals/grilled-chicken-rice');
    assert(singleMeal.status === 200 && singleMeal.body.data?.mealId === 'grilled-chicken-rice', 'GET /meals/:id retrieves recipe details and ingredients');

    const mealFavToggle = await feRequest('/meals/favorites/grilled-chicken-rice', { method: 'POST', token });
    assert(mealFavToggle.status === 200, 'POST /meals/favorites/:id toggles meal bookmark');

    const mealFavs = await feRequest('/meals/favorites/me', { token });
    assert(mealFavs.status === 200 && Array.isArray(mealFavs.body.data), 'GET /meals/favorites/me returns bookmarked meal IDs');

    const mealLog = await feRequest('/meals/logs', {
      method: 'POST',
      token,
      body: {
        mealId: 'grilled-chicken-rice',
        name: 'Grilled Chicken & Brown Rice',
        category: 'lunch',
        servings: 1,
        calories: 540,
        protein: 48,
        carbs: 52,
        fat: 10,
      },
    });
    assert(mealLog.status === 201 || mealLog.status === 200, 'POST /meals/logs records consumed meal with macros');
    const logId = mealLog.body.data?.id || mealLog.body.data?._id;

    const myMealLogs = await feRequest('/meals/logs/me', { token });
    assert(myMealLogs.status === 200 && Array.isArray(myMealLogs.body.data), 'GET /meals/logs/me returns user daily food diary');

    const dailySummary = await feRequest('/meals/daily-summary', { token });
    assert(dailySummary.status === 200 && typeof dailySummary.body.data?.consumed?.calories === 'number', 'GET /meals/daily-summary tracks consumed vs target calories');

    if (logId) {
      const delLog = await feRequest(`/meals/logs/${logId}`, { method: 'DELETE', token });
      assert(delLog.status === 200, 'DELETE /meals/logs/:id deletes meal log');
    }

    // 11. Token Refresh & Logout
    console.log('\n--- [11. Token Rotation & Session Revocation] ---');
    if (refreshToken) {
      const refresh = await feRequest('/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
      });
      assert(refresh.status === 200 && !!refresh.body.data?.accessToken, 'POST /auth/refresh returns fresh tokens');
    }

    const logout = await feRequest('/auth/logout', { method: 'POST', token });
    assert(logout.status === 200, 'POST /auth/logout invalidates session tokens cleanly');

  } catch (err) {
    console.error('\n❌ Unhandled error during linkage audit:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(` LINKAGE RESULTS: ${passed} PASSED | ${failed} FAILED | TOTAL: ${passed + failed}`);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
}

runLinkageAudit();
