import { useState, useMemo } from 'react';
import { dayKey, fmt } from '../lib/utils.js';
import { ChevronLeft, ChevronRight } from './Icons.jsx';

export default function TrainingHeatmap({ history = [], t }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [hoveredDay, setHoveredDay] = useState(null);

  // Group workout history by YYYY-MM-DD
  const activityMap = useMemo(() => {
    const map = {};
    (history || []).forEach((h) => {
      const dateVal = h.dateKey || h.date || (h.at ? dayKey(new Date(h.at)) : null);
      if (!dateVal) return;
      if (!map[dateVal]) {
        map[dateVal] = {
          count: 0,
          sets: 0,
          volume: 0,
          workouts: [],
        };
      }
      map[dateVal].count += 1;
      map[dateVal].sets += Number(h.sets) || (h.exercises?.length ? h.exercises.length * 3 : 3);
      map[dateVal].volume += Number(h.volume) || 0;
      map[dateVal].workouts.push(h.name || 'Workout Session');
    });
    return map;
  }, [history]);

  // Build a 26-week (~6 months) calendar grid ending at current or shifted month
  const { weeks, monthLabels, totalSessionsInRange, dateRangeLabel, activeYear } = useMemo(() => {
    const now = new Date();
    // Shift target anchor date by monthOffset (e.g. 0 = current month, 1 = 1 month ago, etc.)
    const targetAnchor = new Date(now.getFullYear(), now.getMonth() - monthOffset, now.getDate());

    // End on Saturday of target week
    const anchor = new Date(targetAnchor);
    anchor.setDate(anchor.getDate() + (6 - anchor.getDay()));

    // 26 weeks (approx. 6 months)
    const start = new Date(anchor);
    start.setDate(start.getDate() - (26 * 7 - 1));

    const weeksArr = [];
    let cur = new Date(start);
    let sessionCount = 0;

    for (let w = 0; w < 26; w++) {
      const weekDays = [];
      for (let d = 0; d < 7; d++) {
        const dateObj = new Date(cur);
        const k = dayKey(dateObj);
        const data = activityMap[k] || { count: 0, sets: 0, volume: 0, workouts: [] };
        if (data.count > 0) {
          sessionCount += data.count;
        }

        let level = 0;
        if (data.sets > 0) {
          if (data.sets < 6) level = 1;
          else if (data.sets < 12) level = 2;
          else if (data.sets < 18) level = 3;
          else level = 4;
        }

        weekDays.push({
          date: dateObj,
          key: k,
          isFuture: dateObj > now,
          data,
          level,
        });

        cur.setDate(cur.getDate() + 1);
      }
      weeksArr.push(weekDays);
    }

    // Determine month labels placed above the corresponding week columns
    const months = [];
    let prevMonth = -1;
    weeksArr.forEach((wk, colIdx) => {
      const m = wk[0].date.getMonth();
      if (m !== prevMonth) {
        months.push({
          colIdx,
          name: wk[0].date.toLocaleString('en-US', { month: 'short' }),
          year: wk[0].date.getFullYear(),
        });
        prevMonth = m;
      }
    });

    const startStr = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const endStr = anchor.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const rangeLbl = startStr === endStr ? startStr : `${startStr} – ${endStr}`;

    return {
      weeks: weeksArr,
      monthLabels: months,
      totalSessionsInRange: sessionCount,
      dateRangeLabel: rangeLbl,
      activeYear: anchor.getFullYear(),
    };
  }, [monthOffset, activityMap]);

  const handlePrevMonth = () => {
    setMonthOffset((prev) => prev + 1);
  };

  const handleNextMonth = () => {
    setMonthOffset((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="detailed-heatmap-wrap">
      {/* Top Header: Tag, title & Active Year Badge */}
      <div className="heatmap-top-row">
        <div>
          <span className="tag">
            {t ? t('dash.consistency', 'Consistency') : 'Consistency'} · 6 MONTHS
          </span>
          <h3 style={{ margin: '2px 0 0', fontSize: '1.15rem', fontWeight: 800 }}>
            {t ? t('dash.heatmap', 'Training heatmap') : 'Training heatmap'}
          </h3>
        </div>

        {/* Year Pill / Range indicator */}
        <div className="heatmap-year-pills" role="tablist" aria-label="Heatmap Year">
          <span className="heatmap-year-btn active">
            {activeYear}
          </span>
        </div>
      </div>

      {/* Heatmap Graph Container - 100% width, no horizontal scroll */}
      <div className="heatmap-no-scroll-area">
        <div className="heatmap-graph">
          {/* Months Row with Left and Right Navigation Buttons */}
          <div className="heatmap-month-nav-row">
            {/* Left toggle button to see previous months */}
            <button
              type="button"
              className="heatmap-nav-arrow-btn"
              onClick={handlePrevMonth}
              aria-label="View previous months"
              title="View previous months"
            >
              <ChevronLeft width={13} height={13} />
            </button>

            {/* Month labels track */}
            <div className="heatmap-months-track">
              {monthLabels.map((m, idx) => (
                <span
                  key={`${m.name}-${m.year}-${idx}`}
                  className="heatmap-month-lbl"
                  style={{ left: `${(m.colIdx / 26) * 100}%` }}
                >
                  {m.name}
                </span>
              ))}
            </div>

            {/* Right toggle button to see next months */}
            <button
              type="button"
              className={`heatmap-nav-arrow-btn ${monthOffset <= 0 ? 'disabled' : ''}`}
              onClick={handleNextMonth}
              disabled={monthOffset <= 0}
              aria-label="View next months"
              title={monthOffset <= 0 ? 'Showing current months' : 'View next months'}
            >
              <ChevronRight width={13} height={13} />
            </button>
          </div>

          {/* Main Grid: Weekday labels on left + 26 week columns */}
          <div className="heatmap-body-row">
            {/* Weekday Labels (Mon, Wed, Fri) */}
            <div className="heatmap-weekdays-col" aria-hidden="true">
              <span className="heatmap-day-lbl" style={{ gridRow: 2 }}>Mon</span>
              <span className="heatmap-day-lbl" style={{ gridRow: 4 }}>Wed</span>
              <span className="heatmap-day-lbl" style={{ gridRow: 6 }}>Fri</span>
            </div>

            {/* 26 Week Columns (fits without horizontal scrolling) */}
            <div className="heatmap-columns" role="grid" aria-label={`Workout activity: ${dateRangeLabel}`}>
              {weeks.map((wk, colIdx) => (
                <div key={colIdx} className="heatmap-col" role="row">
                  {wk.map((day) => {
                    const hasWorkouts = day.data?.count > 0;
                    const dateFormatted = day.date.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    const tooltipText = hasWorkouts
                      ? `${day.data.count} workout${day.data.count > 1 ? 's' : ''} (${day.data.sets} sets, ${fmt(day.data.volume)} kg) on ${dateFormatted}`
                      : `No workouts logged on ${dateFormatted}`;

                    return (
                      <div
                        key={day.key}
                        role="gridcell"
                        aria-label={tooltipText}
                        className={`heatmap-cell level-${day.isFuture ? 0 : day.level} ${day.key === dayKey() ? 'is-today' : ''}`}
                        title={tooltipText}
                        onMouseEnter={() => setHoveredDay({ ...day, dateFormatted, tooltipText })}
                        onMouseLeave={() => setHoveredDay(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer bar: Stats summary + Interactive Hover Detail + Less/More Legend */}
      <div className="heatmap-footer-row">
        <div className="heatmap-summary-info">
          {hoveredDay ? (
            <span className="heatmap-hover-detail animate-fade">
              <strong>{hoveredDay.dateFormatted}:</strong> {hoveredDay.data?.count > 0 ? (
                <span>
                  <span className="accent">{hoveredDay.data.count} workout{hoveredDay.data.count > 1 ? 's' : ''}</span> · {hoveredDay.data.sets} sets · {fmt(hoveredDay.data.volume)} kg
                </span>
              ) : (
                <span className="muted-text">Rest day</span>
              )}
            </span>
          ) : (
            <span className="heatmap-stat-count">
              <span className="accent font-bold">{totalSessionsInRange}</span> session{totalSessionsInRange === 1 ? '' : 's'} logged in this period
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="heatmap-legend" aria-label="Activity intensity scale">
          <span className="legend-txt">Less</span>
          <span className="heatmap-cell level-0" title="0 sets" />
          <span className="heatmap-cell level-1" title="1-5 sets" />
          <span className="heatmap-cell level-2" title="6-11 sets" />
          <span className="heatmap-cell level-3" title="12-17 sets" />
          <span className="heatmap-cell level-4" title="18+ sets" />
          <span className="legend-txt">More</span>
        </div>
      </div>
    </div>
  );
}
