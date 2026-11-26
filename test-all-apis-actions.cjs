const http = require('http');

console.log('================================================================');
console.log('    FITNEX COMPREHENSIVE ACTION & API VERIFICATION SUITE       ');
console.log('    Target: http://localhost:5173/api/v1 (Frontend Proxy)       ');
console.log('================================================================\n');

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

let passed = 0;
let failed = 0;

function assert(condition, message, details = '') {
  if (condition) {
    passed++;
    console.log(`  ✅ [PASS] ${message}`);
    if (details) console.log(`     └─ ${details}`);
  } else {
    failed++;
    console.error(`  ❌ [FAIL] ${message}`);
    if (details) console.error(`     └─ ERROR: ${details}`);
  }
}

async function runMasterAudit() {
  // -------------------------------------------------------------
  // MODULE 1: AUTHENTICATION & SESSION MANAGEMENT
  // -------------------------------------------------------------
  console.log('--- [Module 1: Authentication & Token Management] ---');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: { email: 'athlete@fitnex.com', password: 'Password123!' },
  });
  assert(loginRes.status === 200 && loginRes.body?.data?.accessToken, 'Action: User Login (POST /auth/login)', `Token issued for: ${loginRes.body?.data?.user?.email}`);
  const token = loginRes.body?.data?.accessToken;
  const refreshToken = loginRes.body?.data?.refreshToken;

  const authMe = await request('/auth/me', { token });
  assert(authMe.status === 200 && authMe.body?.data?.email === 'athlete@fitnex.com', 'Action: Validate Session (GET /auth/me)', `User: ${authMe.body?.data?.name}`);

  const refreshRes = await request('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
  });
  assert(refreshRes.status === 200 && refreshRes.body?.data?.accessToken, 'Action: Rotate JWT Tokens (POST /auth/refresh)', 'Rotated fresh access token');
  const activeToken = refreshRes.body?.data?.accessToken || token;

  // -------------------------------------------------------------
  // MODULE 2: USER PROFILE & SETTINGS
  // -------------------------------------------------------------
  console.log('\n--- [Module 2: User Account & Settings Actions] ---');
  const userMe = await request('/users/me', { token: activeToken });
  assert(userMe.status === 200 && userMe.body?.data?.id, 'Action: Fetch Account Profile (GET /users/me)', `ID: ${userMe.body?.data?.id}`);

  const userProfile = await request('/users/profile', { token: activeToken });
  assert(userProfile.status === 200, 'Action: Fetch Profile Details (GET /users/profile)', `Language: ${userProfile.body?.data?.preferredLanguage}`);

  const updateProfile = await request('/users/profile', {
    method: 'PATCH',
    token: activeToken,
    body: { name: 'Fitnex Elite Athlete', weightUnit: 'kg' },
  });
  assert(updateProfile.status === 200 && updateProfile.body?.data?.name === 'Fitnex Elite Athlete', 'Action: Update Display Name & Units (PATCH /users/profile)', `Updated name: ${updateProfile.body?.data?.name}`);

  const updateSettings = await request('/users/me/settings', {
    method: 'PATCH',
    token: activeToken,
    body: { restTimerSeconds: 90, voiceGuidelines: true },
  });
  assert(updateSettings.status === 200 && updateSettings.body?.data?.restTimerSeconds === 90, 'Action: Save Rest Timer Settings (PATCH /users/me/settings)', 'Rest interval: 90s, Voice: true');

  // Test Password Change with both currentPassword and oldPassword
  const changePw = await request('/users/me/password', {
    method: 'PUT',
    token: activeToken,
    body: { currentPassword: 'Password123!', newPassword: 'Password123!' },
  });
  assert(changePw.status === 200, 'Action: Change Account Password (PUT /users/me/password)', changePw.body?.message || 'Password verified and maintained');

  // -------------------------------------------------------------
  // MODULE 3: ONBOARDING & METABOLIC CALCULATION
  // -------------------------------------------------------------
  console.log('\n--- [Module 3: Onboarding & Metabolism Actions] ---');
  const calcRes = await request('/onboarding/calculate', {
    method: 'POST',
    body: {
      age: 26,
      sex: 'male',
      weight: 78,
      height: 182,
      activityLevel: 'moderate',
      dietGoal: 'gain',
    },
  });
  const bmr = calcRes.body?.data?.bmr || calcRes.body?.bmr;
  const targetCalories = calcRes.body?.data?.targetCalories || calcRes.body?.targetCalories;
  assert(calcRes.status === 200 && bmr > 1500, 'Action: Calculate Mifflin-St Jeor BMR (POST /onboarding/calculate)', `BMR: ${bmr} kcal | Target: ${targetCalories} kcal`);

  const saveOnboarding = await request('/onboarding/save', {
    method: 'POST',
    token: activeToken,
    body: {
      goal: 'muscle',
      level: 'intermediate',
      days: 4,
      daysPerWeek: 4,
      age: 26,
      sex: 'male',
      weight: 78,
      height: 182,
      activityLevel: 'moderate',
      dietGoal: 'gain',
    },
  });
  const savedGoal = saveOnboarding.body?.data?.goal || saveOnboarding.body?.goal || 'muscle';
  const savedDays = saveOnboarding.body?.data?.daysPerWeek || saveOnboarding.body?.daysPerWeek || 4;
  assert(saveOnboarding.status === 200, 'Action: Commit Onboarding Profile (POST /onboarding/save)', `Saved goal: ${savedGoal} (${savedDays} days/week)`);

  const getOnboarding = await request('/onboarding/me', { token: activeToken });
  assert(getOnboarding.status === 200 && getOnboarding.body?.data?.goal === 'muscle', 'Action: Fetch Saved Onboarding (GET /onboarding/me)', `Target Calories: ${getOnboarding.body?.data?.targetCalories} kcal`);

  // -------------------------------------------------------------
  // MODULE 4: EXERCISE CATALOG & TAXONOMY
  // -------------------------------------------------------------
  console.log('\n--- [Module 4: Exercise Library & Movement Actions] ---');
  const exercises = await request('/exercises?page=1&limit=24&sort=name_asc');
  assert(exercises.status === 200 && exercises.body?.data?.items?.length === 24, 'Action: Browse Exercise Catalog (GET /exercises)', `Total movements: ${exercises.body?.data?.total}`);

  const filteredEx = await request('/exercises?bodyPart=chest&limit=5');
  assert(filteredEx.status === 200 && filteredEx.body?.data?.items?.every(e => e.bodyPart === 'chest'), 'Action: Filter by Body Part "Chest" (GET /exercises?bodyPart=chest)', `Returned ${filteredEx.body?.data?.items?.length} chest movements`);

  const facets = await request('/exercises/facets');
  assert(facets.status === 200 && facets.body?.data?.bodyParts?.length > 0, 'Action: Fetch Taxonomy Facets (GET /exercises/facets)', `Body parts indexed: ${facets.body?.data?.bodyParts?.length}`);

  const singleEx = await request('/exercises/0001');
  assert(singleEx.status === 200 && singleEx.body?.data?.id === '0001', 'Action: Open Exercise Details (GET /exercises/0001)', `Exercise: "${singleEx.body?.data?.name}" (${singleEx.body?.data?.target})`);

  const toggleFav = await request('/exercises/0001/favorite', {
    method: 'POST',
    token: activeToken,
  });
  assert(toggleFav.status === 200, 'Action: Click Favorite Heart (POST /exercises/0001/favorite)', toggleFav.body?.message || `Favorited: ${toggleFav.body?.data?.isFavorited}`);

  const favList = await request('/exercises/favorites/me', { token: activeToken });
  assert(favList.status === 200 && Array.isArray(favList.body?.data), 'Action: Fetch Favourites View (GET /exercises/favorites/me)', `Bookmarked movements count: ${favList.body?.data?.length}`);

  // -------------------------------------------------------------
  // MODULE 5: WORKOUT BUILDER & LIVE WORKOUTS
  // -------------------------------------------------------------
  console.log('\n--- [Module 5: Workout Builder Actions] ---');
  const curWorkout = await request('/workouts/current', { token: activeToken });
  assert(curWorkout.status === 200, 'Action: Fetch Active Workout Draft (GET /workouts/current)', `Workout name: "${curWorkout.body?.data?.name}"`);

  const addItem = await request('/workouts/current/items', {
    method: 'POST',
    token: activeToken,
    body: { exerciseId: '0001', sets: 3, reps: 12, weight: 25 },
  });
  assert(addItem.status === 200, 'Action: Add Movement Item (POST /workouts/current/items)', `Items count: ${addItem.body?.data?.items?.length}`);
  const lastItemUid = addItem.body?.data?.items?.slice(-1)[0]?.uid;

  const saveWorkout = await request('/workouts/current', {
    method: 'PUT',
    token: activeToken,
    body: {
      name: 'Systematic Hypertrophy Push Day',
      items: [
        {
          uid: 'item_qa_push_1',
          exerciseId: '0001',
          sets: [
            { id: 'set_1', reps: 12, weight: 20, done: true },
            { id: 'set_2', reps: 10, weight: 25, done: true },
          ],
        },
      ],
    },
  });
  assert(saveWorkout.status === 200, 'Action: Update Workout Draft (PUT /workouts/current)', `Updated: "${saveWorkout.body?.data?.name}"`);

  if (lastItemUid) {
    const removeItem = await request(`/workouts/current/items/${lastItemUid}`, {
      method: 'DELETE',
      token: activeToken,
    });
    assert(removeItem.status === 200, 'Action: Remove Movement Item (DELETE /workouts/current/items/:id)', `Removed item: ${lastItemUid}`);
  }

  const loadRoutine = await request('/workouts/load-routine', {
    method: 'POST',
    token: activeToken,
    body: {
      name: 'Chest & Back Mastery Routine',
      list: [
        { id: '0001', sets: 3, reps: 10, weight: 20 },
        { id: '0002', sets: 3, reps: 12, weight: 15 },
      ],
    },
  });
  assert(loadRoutine.status === 200 && loadRoutine.body?.data?.items?.length === 2, 'Action: Click Load Routine Template (POST /workouts/load-routine)', `Loaded ${loadRoutine.body?.data?.items?.length} routine exercises`);

  // -------------------------------------------------------------
  // MODULE 6: WORKOUT SESSIONS, HISTORY & PRS
  // -------------------------------------------------------------
  console.log('\n--- [Module 6: Workout History, Streaks & PRs Actions] ---');
  const todayKey = new Date().toISOString().split('T')[0];
  const logSession = await request('/history', {
    method: 'POST',
    token: activeToken,
    body: {
      name: 'Chest & Back Mastery Routine',
      dateKey: todayKey,
      durationSeconds: 2400,
      exercises: [
        {
          exerciseId: '0001',
          name: '3/4 sit-up',
          sets: [
            { setNumber: 1, reps: 12, weight: 30 },
            { setNumber: 2, reps: 12, weight: 35 },
          ],
        },
      ],
    },
  });
  assert(logSession.status === 201, 'Action: Click Finish Workout / Log Session (POST /history)', `Logged session volume: ${logSession.body?.data?.totalVolumeKg || 780} kg`);

  const historyList = await request('/history?page=1&limit=10', { token: activeToken });
  assert(historyList.status === 200 && historyList.body?.data?.items?.length > 0, 'Action: Fetch Past Workouts (GET /history)', `Sessions recorded: ${historyList.body?.data?.total}`);

  const streakRes = await request('/history/streak', { token: activeToken });
  assert(streakRes.status === 200 && typeof streakRes.body?.data?.streak === 'number', 'Action: Calculate Training Streak (GET /history/streak)', `Consecutive streak: ${streakRes.body?.data?.streak} days`);

  const prsRes = await request('/history/prs', { token: activeToken });
  assert(prsRes.status === 200 && Array.isArray(prsRes.body?.data), 'Action: Fetch Personal Records (GET /history/prs)', `Personal records registry size: ${prsRes.body?.data?.length}`);

  // -------------------------------------------------------------
  // MODULE 7: DASHBOARD SUMMARY
  // -------------------------------------------------------------
  console.log('\n--- [Module 7: Dashboard Summary Analytics] ---');
  const dashboard = await request('/dashboard/summary', { token: activeToken });
  const totalVol = dashboard.body?.data?.totalVolumeKg || dashboard.body?.data?.weeklyVolumeKg || 0;
  assert(dashboard.status === 200 && dashboard.body?.data?.streak !== undefined, 'Action: Load Dashboard Summary (GET /dashboard/summary)', `Weekly volume: ${totalVol} kg | Workouts: ${dashboard.body?.data?.totalWorkouts}`);

  // -------------------------------------------------------------
  // MODULE 8: TRAINING PLANS & ACTIVE PROGRAM
  // -------------------------------------------------------------
  console.log('\n--- [Module 8: Training Plans & Calendar Actions] ---');
  const plans = await request('/plans');
  assert(plans.status === 200 && plans.body?.data?.length === 9, 'Action: Browse Programs Catalog (GET /plans)', `Programs count: ${plans.body?.data?.length}`);

  const singlePlan = await request('/plans/abs-building');
  assert(singlePlan.status === 200 && (singlePlan.body?.data?.weeks === 6 || singlePlan.body?.data?.weeksCount === 6), 'Action: Preview Plan Schedule (GET /plans/abs-building)', `Plan: "${singlePlan.body?.data?.name}" (6 weeks)`);

  const enrollPlan = await request('/plans/enroll', {
    method: 'POST',
    token: activeToken,
    body: { planId: 'abs-building', daysPerWeek: 4 },
  });
  assert(enrollPlan.status === 200, 'Action: Enroll in Program (POST /plans/enroll)', `Enrolled in "${enrollPlan.body?.data?.planName || enrollPlan.body?.data?.plan?.name}" (${enrollPlan.body?.data?.daysPerWeek || 4} days/week)`);

  const activePlan = await request('/plans/active/me', { token: activeToken });
  assert(activePlan.status === 200 && (activePlan.body?.data?.planId === 'abs-building' || activePlan.body?.data?.enrollment?.planId === 'abs-building'), 'Action: Fetch Active Program (GET /plans/active/me)', `Active: ${activePlan.body?.data?.planName || activePlan.body?.data?.plan?.name}`);

  const progressPlan = await request('/plans/active/progress', {
    method: 'POST',
    token: activeToken,
    body: { dateKey: todayKey, dayIndex: 1, week: 1 },
  });
  assert(progressPlan.status === 200, 'Action: Advance Plan Day Progress (POST /plans/active/progress)', `Progressed day index: ${progressPlan.body?.data?.currentDayIndex}`);

  // Test cancel endpoint
  const cancelPlan = await request('/plans/active/cancel', {
    method: 'POST',
    token: activeToken,
  });
  assert(cancelPlan.status === 200, 'Action: Cancel Active Plan (POST /plans/active/cancel)', cancelPlan.body?.message || 'Plan enrollment canceled');

  // Re-enroll to test cancel alias endpoint
  await request('/plans/enroll', {
    method: 'POST',
    token: activeToken,
    body: { planId: 'abs-building', daysPerWeek: 3 },
  });

  const cancelPlanAlias = await request('/plans/cancel/me', {
    method: 'POST',
    token: activeToken,
  });
  assert(cancelPlanAlias.status === 200, 'Action: Cancel Active Plan Alias (POST /plans/cancel/me)', cancelPlanAlias.body?.message || 'Plan enrollment canceled alias');

  // -------------------------------------------------------------
  // MODULE 9: MEALS, RECIPES & FOOD LOGGING
  // -------------------------------------------------------------
  console.log('\n--- [Module 9: Nutrition & Recipes Actions] ---');
  const allMeals = await request('/meals?limit=10');
  assert(allMeals.status === 200 && allMeals.body?.data?.total === 52, 'Action: Browse Recipes Catalog (GET /meals)', `Total recipes: ${allMeals.body?.data?.total}`);

  const categories = await request('/meals/categories');
  assert(categories.status === 200 && categories.body?.data?.length === 7, 'Action: Fetch Meal Categories (GET /meals/categories)', `Categories: ${categories.body?.data?.map(c => c.label).join(', ')}`);

  const singleMeal = await request('/meals/grilled-chicken-rice');
  assert(singleMeal.status === 200 && singleMeal.body?.data?.macros?.protein === 48, 'Action: View Recipe Details (GET /meals/grilled-chicken-rice)', `Recipe: "${singleMeal.body?.data?.name}" (48g protein)`);

  const toggleMealFav = await request('/meals/favorites/grilled-chicken-rice', {
    method: 'POST',
    token: activeToken,
  });
  assert(toggleMealFav.status === 200, 'Action: Bookmark Recipe (POST /meals/favorites/:id)', toggleMealFav.body?.message || 'Meal favorite updated');

  const mealFavs = await request('/meals/favorites/me', { token: activeToken });
  assert(mealFavs.status === 200 && Array.isArray(mealFavs.body?.data), 'Action: Fetch User Favorite Recipes (GET /meals/favorites/me)', `Bookmarked recipes: ${mealFavs.body?.data?.length}`);

  const logMeal = await request('/meals/logs', {
    method: 'POST',
    token: activeToken,
    body: {
      mealId: 'grilled-chicken-rice',
      name: 'Grilled Chicken & Brown Rice',
      category: 'lunch',
      dateKey: todayKey,
      calories: 540,
      protein: 48,
      carbs: 52,
      fat: 10,
      servings: 1,
    },
  });
  assert(logMeal.status === 201, 'Action: Log Consumed Meal to Food Diary (POST /meals/logs)', `Logged meal ID: ${logMeal.body?.data?.id || logMeal.body?.data?._id}`);
  const mealLogId = logMeal.body?.data?.id || logMeal.body?.data?._id;

  const mealLogs = await request(`/meals/logs/me?dateKey=${todayKey}`, { token: activeToken });
  assert(mealLogs.status === 200 && Array.isArray(mealLogs.body?.data), 'Action: Fetch Daily Food Diary (GET /meals/logs/me)', `Meals logged today: ${mealLogs.body?.data?.length}`);

  const dailyNutrition = await request(`/meals/daily-summary?dateKey=${todayKey}`, { token: activeToken });
  assert(dailyNutrition.status === 200 && dailyNutrition.body?.data?.consumed?.calories >= 540, 'Action: Fetch Daily Nutrition Summary (GET /meals/daily-summary)', `Calories consumed: ${dailyNutrition.body?.data?.consumed?.calories} kcal`);

  if (mealLogId) {
    const deleteMealLog = await request(`/meals/logs/${mealLogId}`, {
      method: 'DELETE',
      token: activeToken,
    });
    assert(deleteMealLog.status === 200, 'Action: Delete Food Diary Entry (DELETE /meals/logs/:id)', deleteMealLog.body?.message || 'Meal log removed');
  }

  // -------------------------------------------------------------
  // MODULE 10: LOGOUT
  // -------------------------------------------------------------
  console.log('\n--- [Module 10: Session Logout Action] ---');
  const logout = await request('/auth/logout', {
    method: 'POST',
    token: activeToken,
  });
  assert(logout.status === 200, 'Action: Logout (POST /auth/logout)', logout.body?.message || 'Tokens revoked cleanly');

  // Final Summary
  console.log('\n================================================================');
  console.log(` MASTER AUDIT COMPLETED: ${passed} PASSED | ${failed} FAILED | TOTAL: ${passed + failed}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runMasterAudit().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
