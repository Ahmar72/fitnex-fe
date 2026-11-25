/**
 * Unit & Integration Test for UI Card Spacing, Sidepanel Scrolling, and Real Calendar Drawer Fixes
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('========================================================');
console.log('   VERIFYING UI FIXES: CARD SPACING, SCROLL, CALENDAR   ');
console.log('========================================================\n');

let passed = 0;
let total = 0;

function check(desc, fn) {
  total++;
  try {
    fn();
    console.log(`✅ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: ${desc}`);
    console.error(`   ${err.message}`);
  }
}

// 1. Verify index.css
const indexCss = fs.readFileSync(path.join(__dirname, 'src', 'index.css'), 'utf8');

check('index.css: .ex-body h3 min-height removed to eliminate single-line card gap', () => {
  const match = indexCss.match(/\.ex-body\s+h3\s*\{([^}]+)\}/);
  assert(match, '.ex-body h3 block must exist');
  assert(!match[1].includes('min-height: 36px'), 'min-height: 36px must be removed');
  assert(match[1].includes('margin: 0 0 6px 0'), 'margin must be 0 0 6px 0');
});

check('index.css: .ex-tags margin-top: auto removed so chips sit directly under title', () => {
  const match = indexCss.match(/\.ex-tags\s*\{([^}]+)\}/);
  assert(match, '.ex-tags block must exist');
  assert(!match[1].includes('margin-top: auto'), 'margin-top: auto must not be present');
  assert(match[1].includes('margin-top: 0'), 'margin-top must be 0');
  assert(match[1].includes('padding-top: 0'), 'padding-top must be 0');
});

// 2. Verify app.css
const appCss = fs.readFileSync(path.join(__dirname, 'src', 'app.css'), 'utf8');

check('app.css: .ex-side-panel overflow: hidden prevents unconditional outer scrollbar', () => {
  const match = appCss.match(/\.ex-side-panel\s*\{([^}]+)\}/);
  assert(match, '.ex-side-panel block must exist');
  assert(match[1].includes('overflow: hidden'), '.ex-side-panel must have overflow: hidden');
  assert(!match[1].includes('overflow-y: auto !important'), '.ex-side-panel must not have overflow-y: auto');
});

check('app.css: .ex-panel-body handles internal scroll and custom sleek scrollbar', () => {
  const match = appCss.match(/\.ex-panel-body\s*\{([^}]+)\}/);
  assert(match, '.ex-panel-body block must exist');
  assert(match[1].includes('overflow-y: auto'), '.ex-panel-body must have overflow-y: auto');
  assert(match[1].includes('min-height: 0'), '.ex-panel-body must have min-height: 0');
  assert(appCss.includes('.ex-panel-body::-webkit-scrollbar'), 'Custom scrollbar for panel body must exist');
});

// 3. Verify Library.jsx
const libraryJsx = fs.readFileSync(path.join(__dirname, 'src', 'pages', 'Library.jsx'), 'utf8');

check('Library.jsx: Body scroll lock active when sidepanel is open', () => {
  assert(libraryJsx.includes("document.body.style.overflow = 'hidden'"), 'Must lock document body overflow');
  assert(libraryJsx.includes('document.body.style.overflow = origOverflow'), 'Must restore document body overflow on close');
});

// 4. Verify Plans.jsx
const plansJsx = fs.readFileSync(path.join(__dirname, 'src', 'pages', 'Plans.jsx'), 'utf8');

check('Plans.jsx: Real calendar schedule generator weekCalendarDays implemented', () => {
  assert(plansJsx.includes('weekCalendarDays = useMemo'), 'weekCalendarDays must be defined');
  assert(plansJsx.includes('d.toLocaleDateString(undefined, { weekday: \'short\' })'), 'Must compute short day abbreviation');
  assert(plansJsx.includes('dateNumber: d.getDate()'), 'Must compute actual dateNumber from Date');
  assert(plansJsx.includes('isToday = d.getTime() === todayMid.getTime()'), 'Must authenticate today against real midnight');
});

check('Plans.jsx: Interactive calendar strip renders authentic day abbreviation, date and Today badge', () => {
  assert(plansJsx.includes('{calDay.dayAbbr}'), 'Must render {calDay.dayAbbr}');
  assert(plansJsx.includes('{calDay.dateNumber}'), 'Must render real date {calDay.dateNumber}');
  assert(plansJsx.includes('isToday ? ('), 'Must check isToday for status badge');
  assert(plansJsx.includes('cal-status-badge badge-today'), 'Must render Today status badge for real ongoing today');
});

check('Plans.jsx: Exercise cards open in sidepanel drawer instead of navigating away', () => {
  assert(plansJsx.includes('onClick={() => setSelectedEx(ex)}'), 'Card click must call setSelectedEx(ex)');
  assert(!plansJsx.includes('navigate(`/exercises/${ex.id}`'), 'Must NOT navigate to /exercises/:id from plan list');
});

check('Plans.jsx: Sidepanel drawer rendered with specs, add to workout, and close button', () => {
  assert(plansJsx.includes('className="ex-side-panel"'), 'ex-side-panel drawer must be rendered in Plans.jsx');
  assert(plansJsx.includes('className="ex-drawer-backdrop"'), 'ex-drawer-backdrop must be rendered in Plans.jsx');
  assert(plansJsx.includes('onClick={() => setSelectedEx(null)}'), 'Backdrop and close button must dismiss drawer');
  assert(plansJsx.includes("document.body.style.overflow = 'hidden'"), 'Plans.jsx must lock body scroll when drawer is open');
});

console.log('\n========================================================');
console.log(`   TEST RESULTS: ${passed}/${total} CHECKS PASSED`);
console.log('========================================================');

if (passed !== total) {
  process.exit(1);
}
