export const GOALS = [
  { key: 'muscle', label: 'Build muscle', desc: 'Hypertrophy-focused training to add size.', exercise: 'dumbbell biceps curl', routine: 'Strength Split' },
  { key: 'fat', label: 'Lose fat', desc: 'High-energy sessions that keep your heart rate up.', exercise: 'jump squat', routine: 'Home Burner' },
  { key: 'strength', label: 'Get stronger', desc: 'Heavy compound lifts and progressive overload.', exercise: 'barbell deadlift', routine: 'Strength Split' },
  { key: 'fit', label: 'Stay fit', desc: 'Balanced full-body work for everyday health.', exercise: 'mountain climber', routine: 'Full Body Starter' },
];

export const LEVELS = [
  { key: 'beginner', label: 'Beginner', desc: 'New or returning to training' },
  { key: 'intermediate', label: 'Intermediate', desc: '6+ months of consistent training' },
  { key: 'advanced', label: 'Advanced', desc: 'Years under the bar' },
];

export const goalOf = (key) => GOALS.find((g) => g.key === key) || GOALS[3];

/** Picks the programme that best fits a user's goal and experience. */
export function routineFor(profile = {}) {
  if (profile.level === 'beginner' && profile.goal !== 'fat') return 'Full Body Starter';
  return goalOf(profile.goal).routine;
}
