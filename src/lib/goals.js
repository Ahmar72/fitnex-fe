import { getProgramForUser } from './progressionEngine.js';

export const GOALS = [
  {
    key: 'muscle',
    label: 'Build muscle',
    desc: 'Hypertrophy-focused training to add size.',
    exercise: 'dumbbell biceps curl',
    routine: 'Hypertrophy Muscle Builder',
    image: 'images/goals/goal-muscle.jpg',
  },
  {
    key: 'fat',
    label: 'Lose fat',
    desc: 'High-energy sessions that keep your heart rate up.',
    exercise: 'jump squat',
    routine: 'Six-Pack Abs & Core Chisel',
    image: 'images/goals/goal-fat.jpg',
  },
  {
    key: 'strength',
    label: 'Get stronger',
    desc: 'Heavy compound lifts and progressive overload.',
    exercise: 'barbell deadlift',
    routine: 'Strength Split & Power Progression',
    image: 'images/goals/goal-strength.jpg',
  },
  {
    key: 'fit',
    label: 'Stay fit',
    desc: 'Balanced full-body work for everyday health.',
    exercise: 'mountain climber',
    routine: 'Full Body Mobility & Fitness Starter',
    image: 'images/goals/goal-fit.jpg',
  },
];

export const LEVELS = [
  {
    key: 'beginner',
    label: 'Beginner',
    desc: 'New or returning to training',
  },
  {
    key: 'intermediate',
    label: 'Intermediate',
    desc: '6+ months of consistent training',
  },
  {
    key: 'advanced',
    label: 'Advanced',
    desc: 'Years under the bar',
  },
];

export const goalOf = (key) => GOALS.find((g) => g.key === key) || GOALS[3];

/** Picks the programme that best fits a user's goal, experience, and days. */
export function routineFor(profile = {}) {
  const prog = getProgramForUser(profile.goal || 'muscle', profile.level || 'beginner', profile.days || 3);
  return prog.name;
}
