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

// 5. Verify Sidebar Collapse Expansion
const layoutCss = fs.readFileSync(path.join(__dirname, 'src', 'layout.css'), 'utf8');

check('layout.css: .sidebar-collapsed expands cards edge-to-edge covering left and right space', () => {
  assert(layoutCss.includes('.sidebar-collapsed .container'), 'Must have .sidebar-collapsed .container rule');
  assert(layoutCss.includes('max-width: 100% !important'), 'Must expand to max-width: 100%');
  assert(layoutCss.includes('.sidebar-collapsed .nutrition-page'), 'Must expand nutrition-page');
  assert(layoutCss.includes('.sidebar-collapsed .settings-container'), 'Must expand settings-container');
});

// 6. Verify Detailed Training Heatmap
const dashboardJsx = fs.readFileSync(path.join(__dirname, 'src', 'pages', 'Dashboard.jsx'), 'utf8');
const heatmapJsx = fs.readFileSync(path.join(__dirname, 'src', 'components', 'TrainingHeatmap.jsx'), 'utf8');

check('TrainingHeatmap.jsx: Renders detailed 6-month activity grid with month labels, weekdays, and left/right toggle buttons', () => {
  assert(dashboardJsx.includes('<TrainingHeatmap history={history}'), 'Dashboard must render TrainingHeatmap');
  assert(heatmapJsx.includes('monthLabels'), 'Heatmap must compute and render monthLabels');
  assert(heatmapJsx.includes('Mon') && heatmapJsx.includes('Wed') && heatmapJsx.includes('Fri'), 'Heatmap must render Mon, Wed, Fri weekday labels');
  assert(heatmapJsx.includes('heatmap-nav-arrow-btn'), 'Heatmap must render left and right toggle buttons');
  assert(heatmapJsx.includes('handlePrevMonth') && heatmapJsx.includes('handleNextMonth'), 'Heatmap must handle month toggling');
  assert(appCss.includes('.heatmap-no-scroll-area') && appCss.includes('overflow: hidden'), 'Heatmap must have overflow: hidden to eliminate scroll');
  assert(heatmapJsx.includes('heatmap-legend'), 'Heatmap must render activity intensity legend');
});

check('TrainingHeatmap.jsx & app.css: Year selector is a stylized dropdown instead of a button', () => {
  assert(heatmapJsx.includes('heatmap-year-select'), 'Heatmap must render select element with class heatmap-year-select');
  assert(heatmapJsx.includes('heatmap-year-select-wrap'), 'Heatmap must wrap select in heatmap-year-select-wrap');
  assert(heatmapJsx.includes('heatmap-select-arrow'), 'Heatmap must render arrow indicator');
  assert(appCss.includes('.heatmap-year-select'), 'app.css must style .heatmap-year-select');
  assert(appCss.includes('.heatmap-select-arrow'), 'app.css must style .heatmap-select-arrow');
});

check('TrainingHeatmap.jsx: Less and More text removed from footer legend', () => {
  assert(!heatmapJsx.includes('<span className="legend-txt">Less</span>'), 'Less text must be removed');
  assert(!heatmapJsx.includes('<span className="legend-txt">More</span>'), 'More text must be removed');
  assert(heatmapJsx.includes('level-0') && heatmapJsx.includes('level-4'), 'Legend must still render the 5 intensity levels');
});

check('TrainingHeatmap.jsx: Month labels spaced cleanly without collisions or congestion', () => {
  assert(heatmapJsx.includes('colIdx - lastCol >= 3'), 'Must enforce minimum 3-column spacing to prevent month overlap');
  assert(heatmapJsx.includes('wk[3].date.getMonth()'), 'Must use midweek day to represent dominant month');
});

check('app.css: Prevents card edge clipping and ensures proper fit inside container', () => {
  assert(appCss.includes('.heatmap-no-scroll-area') && appCss.includes('padding: 4px 6px'), 'Must provide internal padding to prevent edge clipping');
  assert(appCss.includes('.heatmap-cell.is-today') && appCss.includes('outline-offset: 0'), 'Today outline offset must be 0 to stay within bounds');
  assert(appCss.includes('.heatmap-columns') && appCss.includes('padding-right: 2px'), 'Columns must have right padding to protect last column');
});

// 7. Verify Exercise Drawer Compact Sizing (Eliminating unconditional scrollbar)
check('Library.jsx & app.css: Compact media and margins eliminate unconditional scrollbar', () => {
  assert(appCss.includes('max-height: 195px'), '.ex-panel-media img must have compact max-height (195px)');
  assert(libraryJsx.includes("margin: '10px 0 12px'"), 'Library spec must use compact margin 10px 0 12px');
  assert(libraryJsx.includes("margin: '0 0 12px'"), 'Library action buttons must use compact margin 0 0 12px');
  assert(libraryJsx.includes("margin: '8px 0 0'"), 'Library steps ul must use compact margin 8px 0 0');
});

// 8. Verify Screen-Aware Shimmers & Corner Alignment (Exact Component Mimicry)
const appSpinnerJsx = fs.readFileSync(path.join(__dirname, 'src', 'components', 'AppSpinner.jsx'), 'utf8');
const appLayoutJsx = fs.readFileSync(path.join(__dirname, 'src', 'components', 'AppLayout.jsx'), 'utf8');

check('AppSpinner.jsx: Features tailored, screen-aware component skeletons matching each route', () => {
  assert(appSpinnerJsx.includes('shimmer-dash-layout'), 'Dashboard shimmer layout must exist');
  assert(appSpinnerJsx.includes('shimmer-library-layout'), 'Library shimmer layout must exist');
  assert(appSpinnerJsx.includes('shimmer-plans-layout'), 'Plans shimmer layout must exist');
  assert(appSpinnerJsx.includes('shimmer-builder-layout'), 'Builder shimmer layout must exist');
  assert(appSpinnerJsx.includes('shimmer-nutrition-layout'), 'Nutrition shimmer layout must exist');
  assert(appSpinnerJsx.includes('shimmer-profile-layout'), 'Profile shimmer layout must exist');
});

check('AppLayout.jsx: Passes active location.pathname to PageShimmer for automatic route-based view', () => {
  assert(appLayoutJsx.includes('route={location.pathname}'), 'AppLayout must pass route={location.pathname} to PageShimmer');
});

check('layout.css: .page-shimmer-wrapper enforces padding and max-width so shimmers never touch screen corners', () => {
  assert(layoutCss.includes('.page-shimmer-wrapper'), '.page-shimmer-wrapper must exist');
  assert(layoutCss.includes('padding: 16px 20px 48px'), 'Wrapper must have generous 20px side padding preventing edge collision');
  assert(layoutCss.includes('.shimmer-dash-stats'), 'Dashboard stat shimmer grid must be styled');
});

console.log('\n========================================================');
console.log(`   TEST RESULTS: ${passed}/${total} CHECKS PASSED`);
console.log('========================================================');

if (passed !== total) {
  process.exit(1);
}
