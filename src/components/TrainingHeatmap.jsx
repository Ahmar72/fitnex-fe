import { useState, useMemo } from 'react';
import { dayKey, fmt } from '../lib/utils.js';

export default function TrainingHeatmap({ history = [], t }) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
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

  // Build a 52-week calendar grid (Sunday = 0 to Saturday = 6)
  const { weeks, monthLabels, totalSessionsInYear } = useMemo(() => {
    const isCurrent = selectedYear === currentYear;
    const now = new Date();
    
    // Target anchor day
    let anchor;
    if (isCurrent) {
      anchor = new Date(now);
      // End on the upcoming Saturday of current week
      anchor.setDate(anchor.getDate() + (6 - anchor.getDay()));
    } else {
      anchor = new Date(selectedYear, 11, 31);
      anchor.setDate(anchor.getDate() + (6 - anchor.getDay()));
    }

    const start = new Date(anchor);
    start.setDate(start.getDate() - (52 * 7 - 1));

    const weeksArr = [];
    let cur = new Date(start);
    let sessionCount = 0;

    for (let w = 0; w < 52; w++) {
      const weekDays = [];
      for (let d = 0; d < 7; d++) {
        const dateObj = new Date(cur);
        const k = dayKey(dateObj);
        const data = activityMap[k] || { count: 0, sets: 0, volume: 0, workouts: [] };
        if (dateObj.getFullYear() === selectedYear && data.count > 0) {
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
          isFuture: isCurrent && dateObj > now,
          data,
          level,
        });

        cur.setDate(cur.getDate() + 1);
      }
      weeksArr.push(weekDays);
    }

    // Determine month label positions across the 52 week columns
    const months = [];
    let prevMonth = -1;
    weeksArr.forEach((wk, colIdx) => {
      // Month of first day of week
      const m = wk[0].date.getMonth();
      if (m !== prevMonth) {
        months.push({
          colIdx,
          name: wk[0].date.toLocaleString('en-US', { month: 'short' }),
        });
        prevMonth = m;
      }
    });

    return {
      weeks: weeksArr,
      monthLabels: months,
      totalSessionsInYear: sessionCount,
    };
  }, [selectedYear, currentYear, activityMap]);

  return (
    <div className="detailed-heatmap-wrap">
      {/* Top Header with title and year selection pill */}
      <div className="heatmap-top-row">
        <div>
          <span className="tag">{t ? t('dash.consistency', 'Consistency') : 'Consistency'} · {selectedYear}</span>
          <h3 style={{ margin: '2px 0 0', fontSize: '1.15rem', fontWeight: 800 }}>
            {t ? t('dash.heatmap', 'Training heatmap') : 'Training heatmap'}
          </h3>
        </div>

        {/* Year Pills (matching img3) */}
        <div className="heatmap-year-pills" role="tablist" aria-label="Heatmap Year">
          <button
            type="button"
            className={`heatmap-year-btn ${selectedYear === currentYear ? 'active' : ''}`}
            onClick={() => setSelectedYear(currentYear)}
          >
            {currentYear}
          </button>
          <button
            type="button"
            className={`heatmap-year-btn ${selectedYear === currentYear - 1 ? 'active' : ''}`}
            onClick={() => setSelectedYear(currentYear - 1)}
          >
            {currentYear - 1}
          </button>
        </div>
      </div>

      {/* Heatmap Graph Container with Horizontal Scroll support */}
      <div className="heatmap-scroll-area" data-lenis-prevent="true">
        <div className="heatmap-graph">
          {/* Top Month Row */}
          <div className="heatmap-month-row">
            <div className="heatmap-gutter-placeholder" />
            <div className="heatmap-months-track">
              {monthLabels.map((m, idx) => (
                <span
                  key={`${m.name}-${idx}`}
                  className="heatmap-month-lbl"
                  style={{ left: `${(m.colIdx / 52) * 100}%` }}
                >
                  {m.name}
                </span>
              ))}
            </div>
          </div>

          {/* Main Grid: Weekday labels on left + 52-week columns */}
          <div className="heatmap-body-row">
            {/* Weekday Labels (Sun, Mon, Tue, Wed, Thu, Fri, Sat) */}
            <div className="heatmap-weekdays-col" aria-hidden="true">
              <span className="heatmap-day-lbl" style={{ gridRow: 2 }}>Mon</span>
              <span className="heatmap-day-lbl" style={{ gridRow: 4 }}>Wed</span>
              <span className="heatmap-day-lbl" style={{ gridRow: 6 }}>Fri</span>
            </div>

            {/* 52 Week Columns */}
            <div className="heatmap-columns" role="grid" aria-label={`Workout activity in ${selectedYear}`}>
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
              <span className="accent font-bold">{totalSessionsInYear}</span> session{totalSessionsInYear === 1 ? '' : 's'} logged in {selectedYear}
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
