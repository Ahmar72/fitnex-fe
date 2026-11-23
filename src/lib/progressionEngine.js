// Progression Engine: Calibrated Exercise Schedules by Goal, Difficulty Level, and Training Days
// Ensures Beginners get foundational movements first, progressing day-over-day,
// Intermediate gets compound overload, and Advanced gets maximal power complexes.

export const LEVEL_METRICS = {
  beginner: {
    label: 'Beginner',
    tagline: 'New or returning to training',
    repRange: '10–12 reps',
    restTime: '40s',
    intensityTag: 'Introductory / Foundational',
  },
  intermediate: {
    label: 'Intermediate',
    tagline: '6+ months of consistent training',
    repRange: '8–10 reps',
    restTime: '50s',
    intensityTag: 'Moderate / Progressive Overload',
  },
  advanced: {
    label: 'Advanced',
    tagline: 'Years under the bar',
    repRange: '5–8 reps',
    restTime: '75s (1m 15s)',
    intensityTag: 'High-Demand / Maximal Neuromuscular',
  },
};

export const DIFFICULTY_CALIBRATION = {
  beginner: {
    timerSeconds: 40,
    baseWeight: 5,
    sets: 3,
    reps: 10,
    label: 'Beginner',
    timerLabel: '40s / Set',
    weightLabel: '5 kg',
  },
  intermediate: {
    timerSeconds: 50,
    baseWeight: 12.5,
    sets: 3,
    reps: 10,
    label: 'Intermediate',
    timerLabel: '50s / Set',
    weightLabel: '12.5 kg',
  },
  advanced: {
    timerSeconds: 75,
    baseWeight: 20,
    sets: 4,
    reps: 10,
    label: 'Advanced',
    timerLabel: '1m 15s / Set',
    weightLabel: '20 kg',
  },
};

// Daily progression schedules (7 days) for every Goal + Level combination
const PROGRESSION_ROUTINES = {
  // --------------------------------------------------------------------------
  // GOAL 1: BUILD MUSCLE
  // --------------------------------------------------------------------------
  muscle: {
    beginner: {
      planId: 'muscle-building',
      name: 'Foundational Hypertrophy',
      tagline: 'Structured introductory hypertrophy with form-first machine and dumbbell work',
      days: [
        {
          day: 'Day 1',
          weekday: 'Monday',
          title: 'Upper Torso Foundation (Easy)',
          difficulty: 'Stage 1 · Form Calibration',
          focus: 'Dumbbell presses, lat pulldowns & light core control',
          exerciseIds: ['0289', '0198', '0294', '0274', '0334'],
          sets: 3,
          reps: 12,
        },
        {
          day: 'Day 2',
          weekday: 'Tuesday',
          title: 'Lower Body & Stability (Moderate)',
          difficulty: 'Stage 2 · Joint Alignment',
          focus: 'Goblet squats, bench squats & leg control',
          exerciseIds: ['1760', '0026', '0493', '0001'],
          sets: 3,
          reps: 12,
        },
        {
          day: 'Day 3',
          weekday: 'Wednesday',
          title: 'Active Mobility & Deload',
          difficulty: 'Rest & Recovery',
          focus: 'Spinal mobility, light core & muscle glycogen replenishment',
          isRest: true,
          exerciseIds: [],
        },
        {
          day: 'Day 4',
          weekday: 'Thursday',
          title: 'Push / Pull Progression (Harder)',
          difficulty: 'Stage 3 · Resistance Escalation',
          focus: 'Incline push-ups, dumbbell rows & tricep extensions',
          exerciseIds: ['0493', '0293', '0201', '0868', '0274'],
          sets: 3,
          reps: 10,
        },
        {
          day: 'Day 5',
          weekday: 'Friday',
          title: 'Full Body Muscle Density (Peak Beginner)',
          difficulty: 'Stage 4 · Volume Accumulation',
          focus: 'Assisted pull-ups, dumbbell bench press & goblet squats',
          exerciseIds: ['0017', '0289', '1760', '0294', '0001'],
          sets: 4,
          reps: 10,
        },
        {
          day: 'Day 6',
          weekday: 'Saturday',
          title: 'Weekend Rest / Form Review',
          difficulty: 'Rest & Recovery',
          focus: 'Full body deload and hydration',
          isRest: true,
          exerciseIds: [],
        },
        {
          day: 'Day 7',
          weekday: 'Sunday',
          title: 'Weekly Reset & Mental Prep',
          difficulty: 'Rest & Recovery',
          focus: 'Sleep, nutrition and preparation for upcoming training block',
          isRest: true,
          exerciseIds: [],
        },
      ],
    },
    intermediate: {
      planId: 'muscle-building',
      name: 'Hypertrophy Muscle Builder',
      tagline: 'Classic barbell compound progression paired with high-tension hypertrophy accessories',
      days: [
        {
          day: 'Day 1',
          weekday: 'Monday',
          title: 'Compound Chest & Biceps Overload',
          difficulty: 'Stage 1 · Baseline Load',
          focus: 'Heavy barbell bench press, barbell curls & hanging leg raises',
          exerciseIds: ['0025', '0047', '0031', '0472', '0334'],
          sets: 4,
          reps: 10,
        },
        {
          day: 'Day 2',
          weekday: 'Tuesday',
          title: 'Posterior Chain & Quad Depth (Harder)',
          difficulty: 'Stage 2 · Working Volume',
          focus: 'Barbell full squats, Romanian deadlifts & diamond push-ups',
          exerciseIds: ['0043', '0085', '0283', '0030', '0001'],
          sets: 4,
          reps: 8,
        },
        {
          day: 'Day 3',
          weekday: 'Wednesday',
          title: 'Active Rest / Nutrient Refeed',
          difficulty: 'Rest & Recovery',
          focus: 'Active recovery, muscle repair & hydration',
          isRest: true,
          exerciseIds: [],
        },
        {
          day: 'Day 4',
          weekday: 'Thursday',
          title: 'Back Width & Incline Power (Escalating)',
          difficulty: 'Stage 3 · High Tension',
          focus: 'Pull-ups, bent over rows, incline barbell presses & JM presses',
          exerciseIds: ['0652', '0027', '0047', '0052', '0472'],
          sets: 4,
          reps: 8,
        },
        {
          day: 'Day 5',
          weekday: 'Friday',
          title: 'Upper Body Finisher & Arm Pump (Peak Intensity)',
          difficulty: 'Stage 4 · Maximum Hypertrophy Pump',
          focus: 'Barbell bench, close-grip presses, barbell curls & drop sets',
          exerciseIds: ['0025', '0030', '0031', '0652', '0283'],
          sets: 4,
          reps: 8,
        },
        {
          day: 'Day 6',
          weekday: 'Saturday',
          title: 'Posterior Deload / Core Hold',
          difficulty: 'Rest & Recovery',
          focus: 'Hamstring stretches, spinal decompression & light walking',
          isRest: true,
          exerciseIds: [],
        },
        {
          day: 'Day 7',
          weekday: 'Sunday',
          title: 'Complete Rest Day',
          difficulty: 'Rest & Recovery',
          focus: 'Full rest day for muscular protein synthesis',
          isRest: true,
          exerciseIds: [],
        },
      ],
    },
    advanced: {
      planId: 'muscle-building',
      name: 'Elite Mass & Hypertrophy Overload',
      tagline: 'High-frequency heavy compound splits, clean variations & maximal neuromuscular recruiting',
      days: [
        {
          day: 'Day 1',
          weekday: 'Monday',
          title: 'Heavy Barbell Deadlift & Squat Drive',
          difficulty: 'Stage 1 · High CNS Recruitment',
          focus: 'Maximal deadlifts, deep back squats & weighted pull-ups',
          exerciseIds: ['0032', '0043', '0652', '0025', '0030'],
          sets: 5,
          reps: 6,
        },
        {
          day: 'Day 2',
          weekday: 'Tuesday',
          title: 'Front Squats & Incline Pec Destruction (Harder)',
          difficulty: 'Stage 2 · Quad & Upper Chest Power',
          focus: 'Barbell front squats, incline barbell presses & pendlay rows',
          exerciseIds: ['0024', '0047', '0027', '0283', '0472'],
          sets: 5,
          reps: 6,
        },
        {
          day: 'Day 3',
          weekday: 'Wednesday',
          title: 'Active Mobility & CNS Recovery',
          difficulty: 'Rest & Recovery',
          focus: 'CNS decompression, joint mobility & sauna/stretch',
          isRest: true,
          exerciseIds: [],
        },
        {
          day: 'Day 4',
          weekday: 'Thursday',
          title: 'Romanian Deadlifts & Back Density (More Challenging)',
          difficulty: 'Stage 3 · Posterior Chain Hypertrophy',
          focus: 'Heavy RDLs, full pull-ups, barbell rows & hanging leg raises',
          exerciseIds: ['0085', '0043', '0025', '0652', '0031'],
          sets: 5,
          reps: 6,
        },
        {
          day: 'Day 5',
          weekday: 'Friday',
          title: 'Peak Density Giant Sets (Max Advanced)',
          difficulty: 'Stage 4 · Total Muscular Overload',
          focus: 'Deadlifts, front squats, incline presses, JM bench & core',
          exerciseIds: ['0032', '0024', '0047', '0027', '0052', '0472'],
          sets: 5,
          reps: 5,
        },
        {
          day: 'Day 6',
          weekday: 'Saturday',
          title: 'Regeneration & Myofascial Release',
          difficulty: 'Rest & Recovery',
          focus: 'Foam rolling, contrast showers & high-protein intake',
          isRest: true,
          exerciseIds: [],
        },
        {
          day: 'Day 7',
          weekday: 'Sunday',
          title: 'Full Body Deload & Reset',
          difficulty: 'Rest & Recovery',
          focus: 'Full deload for joint and tendon recovery',
          isRest: true,
          exerciseIds: [],
        },
      ],
    },
  },

  // --------------------------------------------------------------------------
  // GOAL 2: LOSE FAT & SHREDDED ABS
  // --------------------------------------------------------------------------
  fat: {
    beginner: {
      planId: 'abs-building',
      name: 'Core Definition & Fat Burn Starter',
      tagline: 'Gentle abdominal etching and high-metabolic bodyweight intervals with no harsh joint impact',
      days: [
        {
          day: 'Day 1',
          weekday: 'Monday',
          title: 'Core Flexion & Caloric Ignition (Easy)',
          difficulty: 'Stage 1 · Foundational Core',
          focus: '3/4 sit-ups, crunch floor, incline push-ups & goblet squats',
          exerciseIds: ['0001', '0274', '0493', '1760', '0198'],
          sets: 3,
          reps: 15,
        },
        {
          day: 'Day 2',
          weekday: 'Tuesday',
          title: 'Metabolic Interval Circuits (Moderate)',
          difficulty: 'Stage 2 · Caloric Acceleration',
          focus: 'Push-ups, goblet squats, dumbbell rows & crunches',
          exerciseIds: ['0662', '1760', '0293', '0001', '0201'],
          sets: 3,
          reps: 15,
        },
        {
          day: 'Day 3',
          weekday: 'Wednesday',
          title: 'Cardio Walk & Active Recovery',
          difficulty: 'Rest & Recovery',
          focus: 'Low-intensity steady state (LISS) & core relaxation',
          isRest: true,
          exerciseIds: [],
        },
        {
          day: 'Day 4',
          weekday: 'Thursday',
          title: 'Oblique & Transverse Burn (Harder)',
          difficulty: 'Stage 3 · Core Tightening',
          focus: '3/4 sit-ups, crunches, push-ups & pulldowns',
          exerciseIds: ['0001', '0274', '0493', '0198', '0294'],
          sets: 3,
          reps: 15,
        },
        {
          day: 'Day 5',
          weekday: 'Friday',
          title: 'Full Body Calorie Torch (Peak Beginner)',
          difficulty: 'Stage 4 · Total Metabolic Circuit',
          focus: 'Assisted pull-ups, goblet squats, floor crunches & push-ups',
          exerciseIds: ['0017', '1760', '0274', '0662', '0001'],
          sets: 4,
          reps: 15,
        },
        {
          day: 'Day 6',
          weekday: 'Saturday',
          title: 'Outdoor Active Recovery',
          difficulty: 'Rest & Recovery',
          focus: 'Walking, light stretching and hydration',
          isRest: true,
          exerciseIds: [],
        },
        {
          day: 'Day 7',
          weekday: 'Sunday',
          title: 'Full Body Reset',
          difficulty: 'Rest & Recovery',
          focus: 'Electrolyte balance & sleep',
          isRest: true,
          exerciseIds: [],
        },
      ],
    },
    intermediate: {
      planId: 'abs-building',
      name: 'Six-Pack Abs & Core Chisel',
      tagline: 'Deep abdominal etching, serratus definition, and targeted oblique rotational control',
      days: [
        {
          day: 'Day 1',
          weekday: 'Monday',
          title: 'Upper Abs & Core Compression (Baseline)',
          difficulty: 'Stage 1 · Rectus Abdominis Focus',
          focus: '3/4 sit-ups, floor crunches, push-ups & hanging leg raises',
          exerciseIds: ['0001', '0274', '0662', '1760', '0472'],
          sets: 4,
          reps: 15,
        },
        {
          day: 'Day 2',
          weekday: 'Tuesday',
          title: 'Lower Abdominal Hanging Power (Harder)',
          difficulty: 'Stage 2 · Hip Flexor & Lower Core',
          focus: 'Hanging leg raises, Romanian deadlifts, diamond push-ups & sit-ups',
          exerciseIds: ['0472', '0085', '0283', '0198', '0001'],
          sets: 4,
          reps: 12,
        },
        {
          day: 'Day 3',
          weekday: 'Wednesday',
          title: 'Active Rest / Core Mobility',
          difficulty: 'Rest & Recovery',
          focus: 'Spinal decompression and oblique stretching',
          isRest: true,
          exerciseIds: [],
        },
        {
          day: 'Day 4',
          weekday: 'Thursday',
          title: 'Oblique Carving & Serratus Sculpt (Escalating)',
          difficulty: 'Stage 3 · Rotational Power',
          focus: 'Push-ups, squats, pull-ups, hanging leg raises & crunches',
          exerciseIds: ['0662', '0043', '0652', '0472', '0274'],
          sets: 4,
          reps: 12,
        },
        {
          day: 'Day 5',
          weekday: 'Friday',
          title: 'Metabolic Shred & Core Torch (Peak Intermediate)',
          difficulty: 'Stage 4 · Giant Core Sets',
          focus: 'Hanging leg raises, 3/4 sit-ups, pull-ups, bench press & diamond push-ups',
          exerciseIds: ['0472', '0001', '0652', '0025', '0283'],
          sets: 4,
          reps: 12,
        },
        {
          day: 'Day 6',
          weekday: 'Saturday',
          title: 'Cardio Flush & Core Recovery',
          difficulty: 'Rest & Recovery',
          focus: 'Light aerobic movement to clear metabolic byproduct',
          isRest: true,
          exerciseIds: [],
        },
        {
          day: 'Day 7',
          weekday: 'Sunday',
          title: 'Rest & Complete Reset',
          difficulty: 'Rest & Recovery',
          focus: 'Nutrient replenishment and muscle repair',
          isRest: true,
          exerciseIds: [],
        },
      ],
    },
    advanced: {
      planId: 'abs-building',
      name: 'Elite Metabolic Shred & Athletic Core',
      tagline: 'High-velocity heavy compound circuits paired with hanging levers and strict anti-extension',
      days: [
        {
          day: 'Day 1',
          weekday: 'Monday',
          title: 'Heavy Compound & Hanging Core Overload',
          difficulty: 'Stage 1 · Maximal Tension',
          focus: 'Hanging leg raises, barbell deadlifts, bench presses & pull-ups',
          exerciseIds: ['0472', '0032', '0025', '0652', '0283'],
          sets: 5,
          reps: 10,
        },
        {
          day: 'Day 2',
          weekday: 'Tuesday',
          title: 'Front Squats & Dynamic Core Drive (Harder)',
          difficulty: 'Stage 2 · Quad & Abdominal Anti-Extension',
          focus: 'Barbell front squats, diamond push-ups, hanging leg raises & rows',
          exerciseIds: ['0024', '0283', '0472', '0027', '0085'],
          sets: 5,
          reps: 10,
        },
        {
          day: 'Day 3',
          weekday: 'Wednesday',
          title: 'Active Mobility & Thermal Recovery',
          difficulty: 'Rest & Recovery',
          focus: 'Full body stretching, sauna & deep diaphragmatic breathing',
          isRest: true,
          exerciseIds: [],
        },
        {
          day: 'Day 4',
          weekday: 'Thursday',
          title: 'Full-Body Metabolic Complex (More Demanding)',
          difficulty: 'Stage 3 · Velocity & Power',
          focus: 'Deadlifts, pull-ups, close-grip bench, squats & leg raises',
          exerciseIds: ['0032', '0652', '0030', '0043', '0472'],
          sets: 5,
          reps: 8,
        },
        {
          day: 'Day 5',
          weekday: 'Friday',
          title: 'Extreme Shred Finisher & Core Burn (Peak Advanced)',
          difficulty: 'Stage 4 · Maximal Caloric Deficit Giant Sets',
          focus: 'Deadlifts, front squats, pull-ups, hanging leg raises & JM presses',
          exerciseIds: ['0032', '0024', '0652', '0472', '0052'],
          sets: 5,
          reps: 8,
        },
        {
          day: 'Day 6',
          weekday: 'Saturday',
          title: 'Myofascial Decompression',
          difficulty: 'Rest & Recovery',
          focus: 'Spinal traction, foam roll and hydration',
          isRest: true,
          exerciseIds: [],
        },
        {
          day: 'Day 7',
          weekday: 'Sunday',
          title: 'Full Deload & Nutritional Reset',
          difficulty: 'Rest & Recovery',
          focus: 'Rest for next week of progressive overload',
          isRest: true,
          exerciseIds: [],
        },
      ],
    },
  },

  // --------------------------------------------------------------------------
  // GOAL 3: GET STRONGER
  // --------------------------------------------------------------------------
  strength: {
    beginner: {
      planId: 'muscle-building',
      name: 'Introductory Strength Foundation',
      tagline: 'Linear progression on foundational barbell and dumbbell mechanics with form calibration',
      days: [
        {
          day: 'Day 1',
          weekday: 'Monday',
          title: 'Horizontal Press & Upper Pull (Easy)',
          difficulty: 'Stage 1 · Form Calibration',
          focus: 'Dumbbell bench press, cable pulldown & goblet squats',
          exerciseIds: ['0289', '0198', '1760', '0294', '0274'],
          sets: 3,
          reps: 8,
        },
        {
          day: 'Day 2',
          weekday: 'Tuesday',
          title: 'Squat Mechanics & Core Stability (Moderate)',
          difficulty: 'Stage 2 · Hip & Knee Drive',
          focus: 'Barbell bench squat, push-ups & dumbbell rows',
          exerciseIds: ['0026', '0662', '0293', '0001'],
          sets: 3,
          reps: 8,
        },
        {
          day: 'Day 3',
          weekday: 'Wednesday',
          title: 'Joint Recovery & Active Mobility',
          difficulty: 'Rest & Recovery',
          focus: 'Joint mobility and hip flexor stretch',
          isRest: true,
          exerciseIds: [],
        },
        {
          day: 'Day 4',
          weekday: 'Thursday',
          title: 'Progressive Overload Intro (Harder)',
          difficulty: 'Stage 3 · Load Advancement',
          focus: 'Barbell bench press, goblet squat & assisted pull-ups',
          exerciseIds: ['0025', '1760', '0017', '0201', '0274'],
          sets: 3,
          reps: 8,
        },
        {
          day: 'Day 5',
          weekday: 'Friday',
          title: 'Full Body Power Base (Peak Beginner)',
          difficulty: 'Stage 4 · Primary Compound Test',
          focus: 'Barbell bench press, goblet squats, pulldowns & curls',
          exerciseIds: ['0025', '1760', '0198', '0294', '0001'],
          sets: 4,
          reps: 8,
        },
        {
          day: 'Day 6',
          weekday: 'Saturday',
          title: 'Full Rest Day',
          difficulty: 'Rest & Recovery',
          focus: 'CNS recovery',
          isRest: true,
          exerciseIds: [],
        },
        {
          day: 'Day 7',
          weekday: 'Sunday',
          title: 'Weekly Deload',
          difficulty: 'Rest & Recovery',
          focus: 'Full rest',
          isRest: true,
          exerciseIds: [],
        },
      ],
    },
    intermediate: {
      planId: 'muscle-building',
      name: 'Strength Split & Power Progression',
      tagline: 'Classic 5x5 compound periodization targeting the squat, bench, deadlift, and strict row',
      days: [
        {
          day: 'Day 1',
          weekday: 'Monday',
          title: 'Heavy Bench Press & Squat Day (Baseline)',
          difficulty: 'Stage 1 · 5x5 Compound Foundation',
          focus: 'Barbell bench press, barbell full squat, barbell row & curls',
          exerciseIds: ['0025', '0043', '0027', '0031', '0472'],
          sets: 4,
          reps: 6,
        },
        {
          day: 'Day 2',
          weekday: 'Tuesday',
          title: 'Romanian Deadlift & Incline Drive (Harder)',
          difficulty: 'Stage 2 · Posterior Strength',
          focus: 'Romanian deadlifts, incline barbell bench & pull-ups',
          exerciseIds: ['0085', '0047', '0652', '0030', '0283'],
          sets: 4,
          reps: 6,
        },
        {
          day: 'Day 3',
          weekday: 'Wednesday',
          title: 'CNS Recovery / Deload',
          difficulty: 'Rest & Recovery',
          focus: 'Nervous system recovery and muscle rebuilding',
          isRest: true,
          exerciseIds: [],
        },
        {
          day: 'Day 4',
          weekday: 'Thursday',
          title: 'Heavy Deadlift & Pull-Up Overload (Escalating)',
          difficulty: 'Stage 3 · Max Back & Grip Force',
          focus: 'Barbell deadlift, pull-ups, bent rows & JM bench press',
          exerciseIds: ['0032', '0652', '0027', '0052', '0472'],
          sets: 4,
          reps: 5,
        },
        {
          day: 'Day 5',
          weekday: 'Friday',
          title: 'Max Power Output Circuit (Peak Intermediate)',
          difficulty: 'Stage 4 · Compound Density Overload',
          focus: 'Squats, bench press, deadlifts & hanging leg raises',
          exerciseIds: ['0043', '0025', '0032', '0652', '0030'],
          sets: 4,
          reps: 5,
        },
        {
          day: 'Day 6',
          weekday: 'Saturday',
          title: 'Weekend Recovery',
          difficulty: 'Rest & Recovery',
          focus: 'Tendon and ligament rest',
          isRest: true,
          exerciseIds: [],
        },
        {
          day: 'Day 7',
          weekday: 'Sunday',
          title: 'Complete Rest',
          difficulty: 'Rest & Recovery',
          focus: 'Sleep and nutrition',
          isRest: true,
          exerciseIds: [],
        },
      ],
    },
    advanced: {
      planId: 'muscle-building',
      name: 'Maximal Neuromuscular Compound Overload',
      tagline: 'Heavy singles, paused repetitions, deficit pulls, and front squat power development',
      days: [
        {
          day: 'Day 1',
          weekday: 'Monday',
          title: 'Max Effort Deadlift & Pause Squats',
          difficulty: 'Stage 1 · High Intensity Neuromuscular Load',
          focus: 'Heavy barbell deadlifts, full squats, bench presses & pull-ups',
          exerciseIds: ['0032', '0043', '0025', '0652', '0030'],
          sets: 5,
          reps: 4,
        },
        {
          day: 'Day 2',
          weekday: 'Tuesday',
          title: 'Front Squat Power & Incline Press (Harder)',
          difficulty: 'Stage 2 · Anterior Core & Upper Chest Drive',
          focus: 'Barbell front squats, incline bench, pendlay rows & leg raises',
          exerciseIds: ['0024', '0047', '0027', '0283', '0472'],
          sets: 5,
          reps: 4,
        },
        {
          day: 'Day 3',
          weekday: 'Wednesday',
          title: 'Therapeutic Recovery & Deload',
          difficulty: 'Rest & Recovery',
          focus: 'Spinal traction, foam rolling & mobility',
          isRest: true,
          exerciseIds: [],
        },
        {
          day: 'Day 4',
          weekday: 'Thursday',
          title: 'Deficit Deadlifts & Heavy Upper Pull (More Challenging)',
          difficulty: 'Stage 3 · Maximal Pulling Force',
          focus: 'Heavy deadlifts, weighted pull-ups, incline bench & JM presses',
          exerciseIds: ['0032', '0652', '0047', '0052', '0472'],
          sets: 5,
          reps: 4,
        },
        {
          day: 'Day 5',
          weekday: 'Friday',
          title: 'Peak Force Generation (Peak Advanced)',
          difficulty: 'Stage 4 · Total Neuromuscular Test',
          focus: 'Deadlifts, front squats, bench press, pull-ups & JM bench',
          exerciseIds: ['0032', '0024', '0025', '0652', '0052'],
          sets: 5,
          reps: 3,
        },
        {
          day: 'Day 6',
          weekday: 'Saturday',
          title: 'CNS Decompression',
          difficulty: 'Rest & Recovery',
          focus: 'Sauna, contrast bath & protein synthesis',
          isRest: true,
          exerciseIds: [],
        },
        {
          day: 'Day 7',
          weekday: 'Sunday',
          title: 'Weekly Neuromuscular Reset',
          difficulty: 'Rest & Recovery',
          focus: 'Full body rest',
          isRest: true,
          exerciseIds: [],
        },
      ],
    },
  },

  // --------------------------------------------------------------------------
  // GOAL 4: STAY FIT
  // --------------------------------------------------------------------------
  fit: {
    beginner: {
      planId: 'weight-loss',
      name: 'Full Body Mobility & Fitness Starter',
      tagline: 'Balanced functional conditioning, joint mobility, and everyday athletic vitality',
      days: [
        {
          day: 'Day 1',
          weekday: 'Monday',
          title: 'Full Body Activation (Easy)',
          difficulty: 'Stage 1 · Movement Mastery',
          focus: 'Goblet squats, incline push-ups, crunches & pulldowns',
          exerciseIds: ['1760', '0493', '0274', '0198', '0294'],
          sets: 3,
          reps: 12,
        },
        {
          day: 'Day 2',
          weekday: 'Tuesday',
          title: 'Mobility & Torso Alignment (Moderate)',
          difficulty: 'Stage 2 · Balance & Flexibility',
          focus: 'Push-ups, dumbbell rows, goblet squats & 3/4 sit-ups',
          exerciseIds: ['0662', '0293', '1760', '0001'],
          sets: 3,
          reps: 12,
        },
        {
          day: 'Day 3',
          weekday: 'Wednesday',
          title: 'Aerobic Walk & Joint Flush',
          difficulty: 'Rest & Recovery',
          focus: 'Light walking and full-body stretching',
          isRest: true,
          exerciseIds: [],
        },
        {
          day: 'Day 4',
          weekday: 'Thursday',
          title: 'Endurance Progression (Harder)',
          difficulty: 'Stage 3 · Cardiovascular Stamina',
          focus: 'Assisted pull-ups, push-ups, goblet squats & crunches',
          exerciseIds: ['0017', '0662', '1760', '0274', '0201'],
          sets: 3,
          reps: 12,
        },
        {
          day: 'Day 5',
          weekday: 'Friday',
          title: 'Total Body Health Circuit (Peak Beginner)',
          difficulty: 'Stage 4 · Integrated Movement Complex',
          focus: 'Goblet squats, pulldowns, dumbbell press & crunches',
          exerciseIds: ['1760', '0198', '0289', '0274', '0294'],
          sets: 4,
          reps: 12,
        },
        {
          day: 'Day 6',
          weekday: 'Saturday',
          title: 'Outdoor Active Recovery',
          difficulty: 'Rest & Recovery',
          focus: 'Recreational movement and hydration',
          isRest: true,
          exerciseIds: [],
        },
        {
          day: 'Day 7',
          weekday: 'Sunday',
          title: 'Full Reset',
          difficulty: 'Rest & Recovery',
          focus: 'Rest',
          isRest: true,
          exerciseIds: [],
        },
      ],
    },
    intermediate: {
      planId: 'weight-loss',
      name: 'Balanced Athletic Performance',
      tagline: 'Moderate resistance training, core endurance, and athletic functional circuits',
      days: [
        {
          day: 'Day 1',
          weekday: 'Monday',
          title: 'Athletic Compound Conditioning (Baseline)',
          difficulty: 'Stage 1 · Functional Power',
          focus: 'Barbell squats, push-ups, cable pulldowns & hanging leg raises',
          exerciseIds: ['0043', '0662', '0198', '0472', '0031'],
          sets: 4,
          reps: 10,
        },
        {
          day: 'Day 2',
          weekday: 'Tuesday',
          title: 'Upper Torso & Pull Power (Harder)',
          difficulty: 'Stage 2 · Upper Body Mobility',
          focus: 'Pull-ups, incline dumbbell presses, rows & diamond push-ups',
          exerciseIds: ['0652', '0289', '0293', '0283', '0001'],
          sets: 4,
          reps: 10,
        },
        {
          day: 'Day 3',
          weekday: 'Wednesday',
          title: 'Active Recovery & Stretching',
          difficulty: 'Rest & Recovery',
          focus: 'Full body mobility and posture decompression',
          isRest: true,
          exerciseIds: [],
        },
        {
          day: 'Day 4',
          weekday: 'Thursday',
          title: 'Leg Drive & Core Endurance (Escalating)',
          difficulty: 'Stage 3 · Lower Chain Stamina',
          focus: 'Romanian deadlifts, squats, hanging leg raises & push-ups',
          exerciseIds: ['0085', '0043', '0472', '0662', '0201'],
          sets: 4,
          reps: 10,
        },
        {
          day: 'Day 5',
          weekday: 'Friday',
          title: 'Peak Functional Conditioning (Peak Intermediate)',
          difficulty: 'Stage 4 · Total Athletic Circuit',
          focus: 'Squats, pull-ups, bench press, hanging leg raises & curls',
          exerciseIds: ['0043', '0652', '0025', '0472', '0031'],
          sets: 4,
          reps: 10,
        },
        {
          day: 'Day 6',
          weekday: 'Saturday',
          title: 'Weekend Active Deload',
          difficulty: 'Rest & Recovery',
          focus: 'Active recovery and outdoor recreation',
          isRest: true,
          exerciseIds: [],
        },
        {
          day: 'Day 7',
          weekday: 'Sunday',
          title: 'Full Body Reset',
          difficulty: 'Rest & Recovery',
          focus: 'Rest',
          isRest: true,
          exerciseIds: [],
        },
      ],
    },
    advanced: {
      planId: 'weight-loss',
      name: 'Functional Athlete High-Performance',
      tagline: 'High-octane compound intervals, Olympic power variations, and elite work capacity',
      days: [
        {
          day: 'Day 1',
          weekday: 'Monday',
          title: 'Heavy Compound & Explosive Pulls',
          difficulty: 'Stage 1 · High Work Capacity',
          focus: 'Barbell deadlifts, full squats, pull-ups & bench presses',
          exerciseIds: ['0032', '0043', '0652', '0025', '0472'],
          sets: 5,
          reps: 8,
        },
        {
          day: 'Day 2',
          weekday: 'Tuesday',
          title: 'Front Squats & Athletic Upper Drive (Harder)',
          difficulty: 'Stage 2 · Explosive Extension',
          focus: 'Barbell front squats, diamond push-ups, bent rows & leg raises',
          exerciseIds: ['0024', '0283', '0027', '0472', '0085'],
          sets: 5,
          reps: 8,
        },
        {
          day: 'Day 3',
          weekday: 'Wednesday',
          title: 'Thermal Recovery & Mobility',
          difficulty: 'Rest & Recovery',
          focus: 'Sauna, ice bath & spinal mobility',
          isRest: true,
          exerciseIds: [],
        },
        {
          day: 'Day 4',
          weekday: 'Thursday',
          title: 'Maximal Density Complexes (More Challenging)',
          difficulty: 'Stage 3 · Unbroken Giant Sets',
          focus: 'Deadlifts, pull-ups, incline presses, squats & JM presses',
          exerciseIds: ['0032', '0652', '0047', '0043', '0052'],
          sets: 5,
          reps: 8,
        },
        {
          day: 'Day 5',
          weekday: 'Friday',
          title: 'Championship Work Capacity (Peak Advanced)',
          difficulty: 'Stage 4 · Total Athletic Test',
          focus: 'Deadlifts, front squats, pull-ups, bench press & hanging core',
          exerciseIds: ['0032', '0024', '0652', '0025', '0472'],
          sets: 5,
          reps: 6,
        },
        {
          day: 'Day 6',
          weekday: 'Saturday',
          title: 'Joint Regeneration',
          difficulty: 'Rest & Recovery',
          focus: 'Soft tissue work and hydration',
          isRest: true,
          exerciseIds: [],
        },
        {
          day: 'Day 7',
          weekday: 'Sunday',
          title: 'Complete Rest & Weekly Reset',
          difficulty: 'Rest & Recovery',
          focus: 'Full body rest',
          isRest: true,
          exerciseIds: [],
        },
      ],
    },
  },
};

/**
 * Returns the customized program object calibrated to the user's goal, level, and days.
 */
export function getProgramForUser(goalKey = 'muscle', levelKey = 'beginner', daysCount = 3) {
  const goalGroup = PROGRESSION_ROUTINES[goalKey] || PROGRESSION_ROUTINES.muscle;
  const levelProgression = goalGroup[levelKey] || goalGroup.beginner;
  const daysNum = Math.max(2, Math.min(6, Number(daysCount) || 3));

  // Filter 7-day schedule to match user's chosen frequency:
  // Non-rest days take precedence up to `daysNum`.
  const allDays = levelProgression.days;
  const trainingDays = allDays.filter((d) => !d.isRest);
  const restDays = allDays.filter((d) => d.isRest);

  // Active workout slots
  const selectedTraining = trainingDays.slice(0, daysNum);
  // Remaining slots filled with rest / recovery
  const remainingSlots = 7 - selectedTraining.length;
  const selectedRest = restDays.slice(0, remainingSlots);

  // Merge back into Monday-Sunday order
  const customizedSchedule = allDays.map((origDay, idx) => {
    // If original day is active and within selectedTraining, keep it
    const activeMatch = selectedTraining.find((t) => t.weekday === origDay.weekday);
    if (activeMatch) return { ...activeMatch, dayIndex: idx };
    // Otherwise it is rest / active recovery
    return {
      day: `Day ${idx + 1}`,
      weekday: origDay.weekday,
      title: 'Active Rest / Mobility',
      difficulty: 'Rest & Recovery',
      focus: 'Muscle recovery, hydration and light mobility',
      isRest: true,
      exerciseIds: [],
      dayIndex: idx,
    };
  });

  return {
    id: levelProgression.planId,
    name: levelProgression.name,
    tagline: levelProgression.tagline,
    goal: goalKey,
    level: levelKey,
    frequencyDays: daysNum,
    levelDetails: LEVEL_METRICS[levelKey] || LEVEL_METRICS.beginner,
    schedule: customizedSchedule,
    day1Workout: customizedSchedule.find((d) => !d.isRest) || customizedSchedule[0],
  };
}

/**
 * Resolves today's specific workout routine for the user, with populated exercise objects.
 */
export function getTodayWorkoutForUser(profile = {}, activePlanData = null, findByNameOrId = null) {
  const goal = profile.goal || 'muscle';
  const level = profile.level || 'beginner';
  const days = profile.days || 3;

  const program = getProgramForUser(goal, level, days);
  const dayIndex = (activePlanData?.currentDayIndex || 0) % program.schedule.length;

  let todayDay = program.schedule[dayIndex];
  // If current day is marked rest, fallback to next available workout day so user always has training available
  if (todayDay?.isRest) {
    todayDay = program.schedule.find((d) => !d.isRest) || todayDay;
  }

  const items = (todayDay.exerciseIds || []).map((id) => {
    const ex = typeof findByNameOrId === 'function' ? findByNameOrId(id) : null;
    return {
      id,
      ex,
      sets: todayDay.sets || 3,
      reps: todayDay.reps || 10,
    };
  });

  return {
    program,
    todayDay,
    dayIndex,
    items,
    name: `${program.name} · ${todayDay.title}`,
    blurb: `${todayDay.difficulty} · ${todayDay.focus}`,
  };
}

// Dynamic goal exercise pool for automatic new exercise rotation across days & weeks
export const GOAL_ROTATION_POOLS = {
  muscle: [
    '0025', '0047', '0031', '0043', '0027', '0030', '0085', '0652', '0289', '0198',
    '0294', '0274', '0334', '1760', '0026', '0493', '0293', '0201', '0868', '0017',
    '0032', '0024', '0052', '0472', '0283', '0662', '0001', '0009', '0019', '0038',
    '0044', '0053', '0060', '0074', '0105', '0118', '0122', '0007', '0015', '1431'
  ],
  fat: [
    '0001', '0274', '0493', '1760', '0198', '0662', '0293', '0201', '0017', '0472',
    '0085', '0283', '0652', '0043', '0025', '0032', '0024', '0030', '0052', '0002',
    '0003', '0006', '0011', '0012', '0013', '0014', '0015', '0020', '0023', '0028',
    '0041', '0042', '0046', '0054', '0068', '0071', '0087', '0092', '0100', '0111'
  ],
  strength: [
    '0025', '0043', '0027', '0031', '0472', '0085', '0047', '0652', '0030', '0283',
    '0032', '0052', '0024', '0026', '0289', '0198', '1760', '0294', '0274', '0662',
    '0034', '0036', '0039', '0045', '0057', '0073', '0081', '0089', '0095', '0108',
    '0115', '0120', '0128', '0140', '0148', '0155', '0160', '0165', '0170'
  ],
  fit: [
    '1760', '0493', '0274', '0198', '0294', '0662', '0293', '0001', '0017', '0201',
    '0472', '0085', '0283', '0652', '0043', '0025', '0032', '0024', '0030', '0052',
    '0003', '0006', '0011', '0014', '0023', '0028', '0038', '0041', '0044', '0053',
    '0060', '0068', '0074', '0087', '0092', '0100', '0105', '0118', '0122', '0007'
  ],
};

// Full 7-day daily templates for all goals and levels ensuring every day has an active routine
export const DAILY_GOAL_TEMPLATES = {
  muscle: {
    beginner: [
      { weekday: 'Monday', title: 'Upper Torso & Chest Foundation', focus: 'Dumbbell bench press, lat pulldowns & light core control', exerciseIds: ['0289', '0198', '0294', '0274', '0334'] },
      { weekday: 'Tuesday', title: 'Lower Body & Stability', focus: 'Goblet squats, bench squats & leg control', exerciseIds: ['1760', '0026', '0493', '0001', '0274'] },
      { weekday: 'Wednesday', title: 'Back Width & Lat Hypertrophy', focus: 'Cable pulldown, dumbbell rows & back extension', exerciseIds: ['0198', '0293', '0201', '0274', '0334'] },
      { weekday: 'Thursday', title: 'Push / Pull Progression', focus: 'Incline push-ups, dumbbell rows & tricep extensions', exerciseIds: ['0493', '0293', '0201', '0868', '0274'] },
      { weekday: 'Friday', title: 'Full Body Muscle Density', focus: 'Assisted pull-ups, dumbbell bench press & goblet squats', exerciseIds: ['0017', '0289', '1760', '0294', '0001'] },
      { weekday: 'Saturday', title: 'Deltoid Cap & Arm Hypertrophy', focus: 'Dumbbell lateral raise, bicep curls & tricep control', exerciseIds: ['0294', '0289', '0201', '0868', '0001'] },
      { weekday: 'Sunday', title: 'Muscular Endurance & Tone', focus: 'Goblet squats, push-ups & dumbbell overhead work', exerciseIds: ['1760', '0017', '0289', '0293', '0334'] },
    ],
    intermediate: [
      { weekday: 'Monday', title: 'Compound Chest & Biceps Overload', focus: 'Heavy barbell bench press, barbell curls & hanging leg raises', exerciseIds: ['0025', '0047', '0031', '0472', '0334'] },
      { weekday: 'Tuesday', title: 'Posterior Chain & Quad Depth', focus: 'Barbell full squats, Romanian deadlifts & diamond push-ups', exerciseIds: ['0043', '0085', '0283', '0030', '0001'] },
      { weekday: 'Wednesday', title: 'Back Width & Lat Overload', focus: 'Pull-ups, bent over rows, incline barbell presses & curls', exerciseIds: ['0652', '0027', '0047', '0031', '0472'] },
      { weekday: 'Thursday', title: 'Back Width & Incline Power', focus: 'Pull-ups, bent over rows, incline barbell presses & JM presses', exerciseIds: ['0652', '0027', '0047', '0052', '0472'] },
      { weekday: 'Friday', title: 'Upper Body Finisher & Arm Pump', focus: 'Barbell bench, close-grip presses, barbell curls & drop sets', exerciseIds: ['0025', '0030', '0031', '0652', '0283'] },
      { weekday: 'Saturday', title: 'Shoulders & Arm Density Overload', focus: 'Overhead press, lateral raises, close-grip bench & barbell curls', exerciseIds: ['0047', '0030', '0031', '0052', '0472'] },
      { weekday: 'Sunday', title: 'Full Body Hypertrophy Finisher', focus: 'Full squats, bench press, deadlifts & pull-ups', exerciseIds: ['0043', '0025', '0085', '0652', '0334'] },
    ],
    advanced: [
      { weekday: 'Monday', title: 'Heavy Barbell Deadlift & Squat Drive', focus: 'Maximal deadlifts, deep back squats & weighted pull-ups', exerciseIds: ['0032', '0043', '0652', '0025', '0030'] },
      { weekday: 'Tuesday', title: 'Front Squats & Incline Pec Destruction', focus: 'Barbell front squats, incline barbell presses & pendlay rows', exerciseIds: ['0024', '0047', '0027', '0283', '0472'] },
      { weekday: 'Wednesday', title: 'CNS Back & Deadlift Drive', focus: 'Deadlifts, weighted pull-ups, barbell rows & hammer curls', exerciseIds: ['0032', '0652', '0027', '0047', '0031'] },
      { weekday: 'Thursday', title: 'Romanian Deadlifts & Back Density', focus: 'Heavy RDLs, full pull-ups, barbell rows & hanging leg raises', exerciseIds: ['0085', '0043', '0025', '0652', '0031'] },
      { weekday: 'Friday', title: 'Peak Density Giant Sets', focus: 'Deadlifts, front squats, incline presses, JM bench & core', exerciseIds: ['0032', '0024', '0047', '0027', '0052'] },
      { weekday: 'Saturday', title: 'Upper Body High-Tension Complex', focus: 'Barbell bench, incline press, close-grip bench & JM press', exerciseIds: ['0025', '0047', '0030', '0652', '0052'] },
      { weekday: 'Sunday', title: 'Max Muscle Density Climax', focus: 'Deadlifts, full squats, front squats & pull-ups', exerciseIds: ['0032', '0043', '0024', '0025', '0472'] },
    ],
  },
  fat: {
    beginner: [
      { weekday: 'Monday', title: 'Core Flexion & Caloric Ignition', focus: '3/4 sit-ups, crunch floor, incline push-ups & goblet squats', exerciseIds: ['0001', '0274', '0493', '1760', '0198'] },
      { weekday: 'Tuesday', title: 'Metabolic Interval Circuits', focus: 'Push-ups, goblet squats, dumbbell rows & crunches', exerciseIds: ['0662', '1760', '0293', '0001', '0201'] },
      { weekday: 'Wednesday', title: 'Metabolic Torch & Core Flexion', focus: '3/4 sit-ups, floor crunches, push-ups & goblet squats', exerciseIds: ['0001', '0274', '0662', '0493', '0293'] },
      { weekday: 'Thursday', title: 'Oblique & Transverse Burn', focus: '3/4 sit-ups, crunches, push-ups & pulldowns', exerciseIds: ['0001', '0274', '0493', '0198', '0294'] },
      { weekday: 'Friday', title: 'Full Body Calorie Torch', focus: 'Assisted pull-ups, goblet squats, floor crunches & push-ups', exerciseIds: ['0017', '1760', '0274', '0662', '0001'] },
      { weekday: 'Saturday', title: 'Full Body Interval Shred', focus: 'Incline push-ups, goblet squats, crunches & sit-ups', exerciseIds: ['0493', '0662', '1760', '0274', '0001'] },
      { weekday: 'Sunday', title: 'Total Core Deficit Burn', focus: 'Sit-ups, crunches, pulldowns, rows & goblet squats', exerciseIds: ['0001', '0274', '0198', '0293', '1760'] },
    ],
    intermediate: [
      { weekday: 'Monday', title: 'Upper Abs & Core Compression', focus: '3/4 sit-ups, floor crunches, push-ups & hanging leg raises', exerciseIds: ['0001', '0274', '0662', '1760', '0472'] },
      { weekday: 'Tuesday', title: 'Lower Abdominal Hanging Power', focus: 'Hanging leg raises, Romanian deadlifts, diamond push-ups & sit-ups', exerciseIds: ['0472', '0085', '0283', '0198', '0001'] },
      { weekday: 'Wednesday', title: 'Oblique Definition & Hanging Core', focus: 'Hanging leg raises, diamond push-ups, crunches & sit-ups', exerciseIds: ['0472', '0662', '0283', '0001', '0274'] },
      { weekday: 'Thursday', title: 'Oblique Carving & Serratus Sculpt', focus: 'Push-ups, squats, pull-ups, hanging leg raises & crunches', exerciseIds: ['0662', '0043', '0652', '0472', '0274'] },
      { weekday: 'Friday', title: 'Metabolic Shred & Core Torch', focus: 'Hanging leg raises, 3/4 sit-ups, pull-ups, bench press & diamond push-ups', exerciseIds: ['0472', '0001', '0652', '0025', '0283'] },
      { weekday: 'Saturday', title: 'Metabolic Power Intervals', focus: 'Pull-ups, Romanian deadlifts, diamond push-ups & leg raises', exerciseIds: ['0652', '0085', '0283', '0472', '0001'] },
      { weekday: 'Sunday', title: 'Six-Pack Chisel Final Peak', focus: 'Hanging leg raises, floor crunches, push-ups & diamond push-ups', exerciseIds: ['0472', '0274', '0001', '0662', '0283'] },
    ],
    advanced: [
      { weekday: 'Monday', title: 'Heavy Compound & Hanging Core Overload', focus: 'Hanging leg raises, barbell deadlifts, bench presses & pull-ups', exerciseIds: ['0472', '0032', '0025', '0652', '0283'] },
      { weekday: 'Tuesday', title: 'Front Squats & Dynamic Core Drive', focus: 'Barbell front squats, diamond push-ups, hanging leg raises & rows', exerciseIds: ['0024', '0283', '0472', '0027', '0085'] },
      { weekday: 'Wednesday', title: 'Metabolic Complex & Anti-Extension', focus: 'Barbell deadlift, hanging leg raises, pull-ups & bench press', exerciseIds: ['0032', '0472', '0652', '0025', '0052'] },
      { weekday: 'Thursday', title: 'Full-Body Metabolic Complex', focus: 'Deadlifts, pull-ups, close-grip bench, squats & leg raises', exerciseIds: ['0032', '0652', '0030', '0043', '0472'] },
      { weekday: 'Friday', title: 'Extreme Shred Finisher & Core Burn', focus: 'Deadlifts, front squats, pull-ups, hanging leg raises & JM presses', exerciseIds: ['0032', '0024', '0652', '0472', '0052'] },
      { weekday: 'Saturday', title: 'High Velocity Athletic Shred', focus: 'Front squats, deadlifts, diamond push-ups & pull-ups', exerciseIds: ['0024', '0032', '0283', '0652', '0472'] },
      { weekday: 'Sunday', title: 'Max Caloric Overload Complex', focus: 'Barbell deadlift, full squats, bench press & hanging leg raises', exerciseIds: ['0032', '0043', '0025', '0472', '0283'] },
    ],
  },
  strength: {
    beginner: [
      { weekday: 'Monday', title: 'Horizontal Press & Upper Pull', focus: 'Dumbbell bench press, cable pulldown & goblet squats', exerciseIds: ['0289', '0198', '1760', '0294', '0274'] },
      { weekday: 'Tuesday', title: 'Squat Mechanics & Core Stability', focus: 'Barbell bench squat, push-ups & dumbbell rows', exerciseIds: ['0026', '0662', '0293', '0001', '0289'] },
      { weekday: 'Wednesday', title: 'Upper Pull & Squat Mechanics', focus: 'Goblet squats, cable pulldown, dumbbell bench press & rows', exerciseIds: ['1760', '0198', '0289', '0293', '0274'] },
      { weekday: 'Thursday', title: 'Progressive Overload Intro', focus: 'Barbell bench press, goblet squat & assisted pull-ups', exerciseIds: ['0025', '1760', '0017', '0201', '0274'] },
      { weekday: 'Friday', title: 'Full Body Power Base', focus: 'Barbell bench press, goblet squats, pulldowns & curls', exerciseIds: ['0025', '1760', '0198', '0294', '0001'] },
      { weekday: 'Saturday', title: 'Compound Strength Reinforcement', focus: 'Barbell bench squat, bench press, goblet squats & rows', exerciseIds: ['0026', '0025', '1760', '0293', '0001'] },
      { weekday: 'Sunday', title: 'Strength Calibration & Deload', focus: 'Dumbbell bench press, goblet squats, pulldowns & crunches', exerciseIds: ['0289', '1760', '0198', '0274', '0001'] },
    ],
    intermediate: [
      { weekday: 'Monday', title: 'Heavy Bench Press & Squat Day', focus: 'Barbell bench press, barbell full squat, barbell row & curls', exerciseIds: ['0025', '0043', '0027', '0031', '0472'] },
      { weekday: 'Tuesday', title: 'Romanian Deadlift & Incline Drive', focus: 'Romanian deadlifts, incline barbell bench & pull-ups', exerciseIds: ['0085', '0047', '0652', '0030', '0283'] },
      { weekday: 'Wednesday', title: 'Overhead Press & Strict Row Force', focus: 'Incline bench press, barbell bent over row, bench press & pull-ups', exerciseIds: ['0047', '0027', '0025', '0652', '0472'] },
      { weekday: 'Thursday', title: 'Heavy Deadlift & Pull-Up Overload', focus: 'Barbell deadlift, pull-ups, bent rows & JM bench press', exerciseIds: ['0032', '0652', '0027', '0052', '0472'] },
      { weekday: 'Friday', title: 'Max Power Output Circuit', focus: 'Squats, bench press, deadlifts & hanging leg raises', exerciseIds: ['0043', '0025', '0032', '0652', '0030'] },
      { weekday: 'Saturday', title: 'Posterior Force & Pause Squats', focus: 'Romanian deadlifts, barbell full squats, bent rows & bench press', exerciseIds: ['0085', '0043', '0027', '0025', '0472'] },
      { weekday: 'Sunday', title: 'Full Compound Power Output', focus: 'Barbell deadlift, full squats, bench press & pull-ups', exerciseIds: ['0032', '0043', '0025', '0652', '0283'] },
    ],
    advanced: [
      { weekday: 'Monday', title: 'Max Effort Deadlift & Pause Squats', focus: 'Heavy barbell deadlifts, full squats, bench presses & pull-ups', exerciseIds: ['0032', '0043', '0025', '0652', '0030'] },
      { weekday: 'Tuesday', title: 'Front Squat Power & Incline Press', focus: 'Barbell front squats, incline bench, pendlay rows & leg raises', exerciseIds: ['0024', '0047', '0027', '0283', '0472'] },
      { weekday: 'Wednesday', title: 'Deficit Pulls & Explosive Drive', focus: 'Barbell deadlift, incline bench, barbell rows & weighted pull-ups', exerciseIds: ['0032', '0047', '0027', '0652', '0052'] },
      { weekday: 'Thursday', title: 'Deficit Deadlifts & Heavy Upper Pull', focus: 'Heavy deadlifts, weighted pull-ups, incline bench & JM presses', exerciseIds: ['0032', '0652', '0047', '0052', '0472'] },
      { weekday: 'Friday', title: 'Peak Force Generation', focus: 'Deadlifts, front squats, bench press, pull-ups & JM bench', exerciseIds: ['0032', '0024', '0025', '0652', '0052'] },
      { weekday: 'Saturday', title: 'Paused Compound Force Development', focus: 'Full squats, front squats, bench press & Romanian deadlifts', exerciseIds: ['0043', '0024', '0025', '0085', '0472'] },
      { weekday: 'Sunday', title: 'Max Neuromuscular Climax', focus: 'Barbell deadlift, full squats, front squats, pull-ups & JM bench', exerciseIds: ['0032', '0043', '0024', '0652', '0052'] },
    ],
  },
  fit: {
    beginner: [
      { weekday: 'Monday', title: 'Full Body Activation', focus: 'Goblet squats, incline push-ups, crunches & pulldowns', exerciseIds: ['1760', '0493', '0274', '0198', '0294'] },
      { weekday: 'Tuesday', title: 'Mobility & Torso Alignment', focus: 'Push-ups, dumbbell rows, goblet squats & 3/4 sit-ups', exerciseIds: ['0662', '0293', '1760', '0001', '0493'] },
      { weekday: 'Wednesday', title: 'Cardiovascular Tone & Core Alignment', focus: 'Goblet squats, crunches, push-ups, cable pulldowns & dumbbell rows', exerciseIds: ['1760', '0274', '0662', '0198', '0293'] },
      { weekday: 'Thursday', title: 'Endurance Progression', focus: 'Assisted pull-ups, push-ups, goblet squats & crunches', exerciseIds: ['0017', '0662', '1760', '0274', '0201'] },
      { weekday: 'Friday', title: 'Total Body Health Circuit', focus: 'Goblet squats, pulldowns, dumbbell press & crunches', exerciseIds: ['1760', '0198', '0289', '0274', '0294'] },
      { weekday: 'Saturday', title: 'Full Body Functional Agility', focus: 'Push-ups, goblet squats, lateral raises, crunches & sit-ups', exerciseIds: ['0662', '1760', '0294', '0274', '0001'] },
      { weekday: 'Sunday', title: 'Athletic Vitality & Core Flow', focus: 'Goblet squats, incline push-ups, pulldowns, rows & crunches', exerciseIds: ['1760', '0493', '0198', '0293', '0274'] },
    ],
    intermediate: [
      { weekday: 'Monday', title: 'Athletic Compound Conditioning', focus: 'Barbell squats, push-ups, cable pulldowns & hanging leg raises', exerciseIds: ['0043', '0662', '0198', '0472', '0031'] },
      { weekday: 'Tuesday', title: 'Upper Torso & Pull Power', focus: 'Pull-ups, incline dumbbell presses, rows & diamond push-ups', exerciseIds: ['0652', '0289', '0293', '0283', '0001'] },
      { weekday: 'Wednesday', title: 'Functional Power & Torso Alignment', focus: 'Pull-ups, goblet squats, diamond push-ups, hanging leg raises & rows', exerciseIds: ['0652', '1760', '0283', '0472', '0027'] },
      { weekday: 'Thursday', title: 'Leg Drive & Core Endurance', focus: 'Romanian deadlifts, squats, hanging leg raises & push-ups', exerciseIds: ['0085', '0043', '0472', '0662', '0201'] },
      { weekday: 'Friday', title: 'Peak Functional Conditioning', focus: 'Squats, pull-ups, bench press, hanging leg raises & curls', exerciseIds: ['0043', '0652', '0025', '0472', '0031'] },
      { weekday: 'Saturday', title: 'Athletic Conditioning & Agility', focus: 'Barbell full squats, push-ups, dumbbell rows & hanging leg raises', exerciseIds: ['0043', '0662', '0293', '0472', '0283'] },
      { weekday: 'Sunday', title: 'Functional Endurance & Core Sculpt', focus: 'Goblet squats, pull-ups, Romanian deadlifts, bench press & sit-ups', exerciseIds: ['1760', '0652', '0085', '0025', '0001'] },
    ],
    advanced: [
      { weekday: 'Monday', title: 'Heavy Compound & Explosive Pulls', focus: 'Barbell deadlifts, full squats, pull-ups & bench presses', exerciseIds: ['0032', '0043', '0652', '0025', '0472'] },
      { weekday: 'Tuesday', title: 'Front Squats & Athletic Upper Drive', focus: 'Barbell front squats, diamond push-ups, bent rows & leg raises', exerciseIds: ['0024', '0283', '0027', '0472', '0085'] },
      { weekday: 'Wednesday', title: 'Metabolic Density & Power Output', focus: 'Barbell deadlift, full squats, pull-ups, incline bench & leg raises', exerciseIds: ['0032', '0043', '0652', '0047', '0472'] },
      { weekday: 'Thursday', title: 'Maximal Density Complexes', focus: 'Deadlifts, pull-ups, incline presses, squats & JM presses', exerciseIds: ['0032', '0652', '0047', '0043', '0052'] },
      { weekday: 'Friday', title: 'Championship Work Capacity', focus: 'Deadlifts, front squats, pull-ups, bench press & hanging core', exerciseIds: ['0032', '0024', '0652', '0025', '0472'] },
      { weekday: 'Saturday', title: 'Elite Functional Athleticism', focus: 'Front squats, deadlifts, incline bench, diamond push-ups & leg raises', exerciseIds: ['0024', '0032', '0047', '0283', '0472'] },
      { weekday: 'Sunday', title: 'High Capacity Full Body Output', focus: 'Barbell deadlift, full squats, bench press, pull-ups & leg raises', exerciseIds: ['0032', '0043', '0025', '0652', '0472'] },
    ],
  },
};

/**
 * Resolves today's goal workout strictly driven by user's onboarding/profile goal,
 * difficulty level, and automatically rotating exercises daily with new additions.
 */
export function getGoalWorkoutForToday({
  profile = {},
  goalProgress = null,
  byId = new Map(),
  exercises = [],
} = {}) {
  const goalKey = profile.goal || 'muscle';
  const levelKey = profile.level || 'beginner';
  const daysCount = profile.days || 3;

  const diffConfig = DIFFICULTY_CALIBRATION[levelKey] || DIFFICULTY_CALIBRATION.beginner;
  const program = getProgramForUser(goalKey, levelKey, daysCount);

  // Derive today's active day index from current calendar date so it rotates daily automatically
  const now = new Date();
  // 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
  const calendarDayOfWeek = (now.getDay() + 6) % 7;
  const epochDays = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);

  // If goalProgress has a progression index offset, incorporate it; otherwise use today's weekday
  const currentDayIndex = goalProgress?.currentDayIndex
    ? (calendarDayOfWeek + goalProgress.currentDayIndex) % 7
    : calendarDayOfWeek;

  // Resolve today's tailored routine from DAILY_GOAL_TEMPLATES
  const goalTemplates = DAILY_GOAL_TEMPLATES[goalKey] || DAILY_GOAL_TEMPLATES.muscle;
  const levelTemplates = goalTemplates[levelKey] || goalTemplates.beginner;
  const todayDay = levelTemplates[currentDayIndex] || levelTemplates[0];

  // Rotate in new exercises from the goal pool automatically based on date/progression
  const pool = GOAL_ROTATION_POOLS[goalKey] || GOAL_ROTATION_POOLS.muscle;
  const rot1 = pool[(epochDays * 3 + currentDayIndex * 7) % pool.length];
  const rot2 = pool[(epochDays * 5 + currentDayIndex * 11 + 3) % pool.length];

  const exerciseIds = [...(todayDay.exerciseIds || [])];
  if (rot1 && !exerciseIds.includes(rot1)) {
    exerciseIds[Math.min(3, exerciseIds.length - 1)] = rot1;
  }
  if (rot2 && !exerciseIds.includes(rot2)) {
    exerciseIds[Math.min(4, exerciseIds.length - 1)] = rot2;
  }

  // Calculate day-over-day timer progression: base timer + 5s per workout index
  const setDuration = diffConfig.timerSeconds + (currentDayIndex % 7) * 5;

  const items = exerciseIds.map((id) => {
    const ex = byId.get(id) || null;
    const isBodyweight = ex?.equipment === 'body weight';
    const weight = isBodyweight ? 0 : diffConfig.baseWeight;
    return {
      id,
      ex: ex || { id, name: 'Exercise', equipment: 'body weight' },
      sets: diffConfig.sets,
      reps: diffConfig.reps,
      weight,
      isBodyweight,
      setDuration,
    };
  });

  return {
    program,
    todayDay,
    dayIndex: currentDayIndex,
    goal: goalKey,
    level: levelKey,
    diffConfig,
    setDuration,
    name: `${program.name} · ${todayDay.title}`,
    routineTitle: todayDay.title,
    focus: todayDay.focus,
    difficulty: todayDay.difficulty,
    items,
    exerciseIds: items.map((i) => i.id),
  };
}

/**
 * Calibrates progressive overload intensity based on program week (1 through 6).
 * Week 1: 3 sets × 10 reps (Foundation Load)
 * Week 2: 3 sets × 11 reps (+1 rep per set, Volume Accumulation)
 * Week 3: 4 sets × 10 reps (+1 set, Overload Stage 1)
 * Week 4: 4 sets × 11 reps (+1 set, +1 rep, Overload Stage 2)
 * Week 5: 4 sets × 12 reps (+1 set, +2 reps, Peak Hypertrophy)
 * Week 6: 5 sets × 12 reps (+2 sets, +2 reps, Climax Density)
 */
export function getProgressionForWeek(weekNum = 1) {
  const w = Math.max(1, Math.min(6, Number(weekNum) || 1));
  switch (w) {
    case 1:
      return { week: 1, sets: 3, reps: 10, bonusWeight: 0, tag: 'Foundation Load', factor: 1.0 };
    case 2:
      return { week: 2, sets: 3, reps: 11, bonusWeight: 0, tag: 'Volume Accumulation', factor: 1.1 };
    case 3:
      return { week: 3, sets: 4, reps: 10, bonusWeight: 2.5, tag: 'Overload Stage 1', factor: 1.25 };
    case 4:
      return { week: 4, sets: 4, reps: 11, bonusWeight: 2.5, tag: 'Overload Stage 2', factor: 1.35 };
    case 5:
      return { week: 5, sets: 4, reps: 12, bonusWeight: 5, tag: 'Peak Hypertrophy', factor: 1.5 };
    case 6:
      return { week: 6, sets: 5, reps: 12, bonusWeight: 5, tag: 'Climax Density', factor: 1.65 };
    default:
      return { week: 1, sets: 3, reps: 10, bonusWeight: 0, tag: 'Foundation Load', factor: 1.0 };
  }
}

/**
 * Calculates progressive set duration countdown:
 * Increases by 5-10s (5 seconds per day) across every consecutive workout day of the weekly cycle.
 * Day 1: 40s
 * Day 2: 45s
 * Day 3: 50s
 * Day 4: 55s
 * Day 5: 60s
 * Day 6: 65s
 * Day 7: 70s
 */
export function getSetDurationForDay(dayIndex = 0) {
  const daySafe = Math.max(0, Number(dayIndex) || 0) % 7;
  return 40 + daySafe * 5;
}

/**
 * Resolves the user's active plan, current week's progressive overload,
 * today's rotated exercises, and progressive set timers.
 */
export function getActivePlanWithProgression({
  activePlanData = null,
  profile = {},
  PLANS = [],
  byId = new Map(),
  targetWeek = null,
  targetDayIndex = null,
} = {}) {
  // 1. Resolve active plan from activePlanData or profile or goal fallback
  let planId = activePlanData?.planId || profile?.activePlanId;
  let plan = PLANS.find((p) => p.id === planId);

  if (!plan) {
    const goal = profile?.goal || 'muscle';
    if (goal === 'fat') planId = 'weight-loss';
    else if (goal === 'fit') planId = 'abs-building';
    else if (goal === 'strength') planId = 'boulder-shoulders';
    else planId = 'muscle-building';
    plan = PLANS.find((p) => p.id === planId) || PLANS[0];
  }

  // 2. Week progression: Calculate week number (1 to plan.weeks)
  const startedAt = activePlanData?.startedAt || Date.now();
  const weeksElapsed = Math.floor((Date.now() - startedAt) / (86400000 * 7));
  const currentWeek = targetWeek || Math.min(plan?.weeks || 6, Math.max(1, weeksElapsed + 1));
  const weekProgression = getProgressionForWeek(currentWeek);

  // 3. Day of week & daily rotation
  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const now = new Date();
  const todayWeekday = weekdayNames[now.getDay()];
  const todayDayIndex = targetDayIndex !== null && targetDayIndex !== undefined
    ? Number(targetDayIndex)
    : (now.getDay() + 6) % 7; // Mon: 0 .. Sun: 6

  // 4. Daily set duration: +5-10s everyday
  const setDuration = getSetDurationForDay(todayDayIndex);

  // 5. Today's scheduled routine from the plan
  let todayRoutine = plan.schedule?.find((d) => d.day === todayWeekday);
  let isRestDay = Boolean(todayRoutine?.isRest || !todayRoutine?.exerciseIds?.length);

  // If today is a rest day, provide the next active workout routine so the user can always train
  if (isRestDay) {
    todayRoutine = plan.schedule?.find((d) => !d.isRest && d.exerciseIds?.length) || plan.schedule[0];
  }

  // 6. Populate exercise objects with calibrated sets, reps, and overload weights
  const items = (todayRoutine?.exerciseIds || [])
    .map((id) => {
      const ex = byId.get(id);
      if (!ex) return null;
      const baseWeight = ex.equipment === 'body weight' ? 0 : 20;
      const weight = baseWeight > 0 ? baseWeight + weekProgression.bonusWeight : 0;
      return {
        id,
        ex,
        sets: weekProgression.sets,
        reps: weekProgression.reps,
        weight,
        setDuration,
      };
    })
    .filter(Boolean);

  return {
    plan,
    planId: plan.id,
    currentWeek,
    weekProgression,
    todayWeekday,
    todayDayIndex,
    todayRoutine,
    isRestDay,
    setDuration,
    items,
    name: `${plan.name} · ${todayRoutine?.title || todayRoutine?.day || 'Training'}`,
    blurb: todayRoutine?.focus || plan.tagline || 'Daily training session',
  };
}
