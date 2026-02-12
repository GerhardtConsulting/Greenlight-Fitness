/**
 * Seed Script: Hypertrophie Block I
 * Erstellt den kompletten 7-Wochen-Plan (6 Trainingswochen + 1 Deload) in der Datenbase.
 * 
 * Ausführen: node scripts/seed-hypertrophy-plan.mjs
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lfpcyhrccefbeowsgojv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcGN5aHJjY2VmYmVvd3Nnb2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1OTg1NTksImV4cCI6MjA4NTE3NDU1OX0.099PgzM5nxL0dot6dCX1VsUepqaJ7Y_pPgv0GvH9DBc'
);

let idCounter = 0;
const uid = () => `gen-${Date.now()}-${++idCounter}`;

// Helper: create sets array
const sets = (count, reps, note) => Array.from({ length: count }, (_, i) => ({
  id: uid(), type: 'Normal', reps: String(reps), weight: '', ...(note && i === 0 ? { notes: note } : {})
}));

const topSetWithBackoff = (topReps, backoffCount, backoffNote) => [
  { id: uid(), type: 'Normal', reps: String(topReps), weight: '' },
  ...Array.from({ length: backoffCount }, () => ({ id: uid(), type: 'Normal', reps: String(topReps), weight: backoffNote || '' }))
];

// Helper: create exercise
const ex = (name, setsArr) => ({
  id: uid(), exerciseId: uid(), name, sets: setsArr
});

// Helper: create block
const block = (name, type, exercises) => ({
  id: uid(), name, type, exercises
});

// Helper: circuit block with single descriptive exercise
const condBlock = (name, exerciseName, description, setsCount = 1) => ({
  id: uid(), name, type: 'Circuit',
  exercises: [{ id: uid(), exerciseId: uid(), name: exerciseName, sets: [{ id: uid(), type: 'Normal', reps: description, weight: '' }] }]
});

// ═══════════════════════════════════════════════════════════════
// WEEK DEFINITIONS
// ═══════════════════════════════════════════════════════════════

const WEEKS = [
  // ═══ WOCHE 1 ═══
  {
    order: 1, focus: 'Grundlagen & Technikfokus (2-3 RiR)',
    sessions: [
      {
        title: 'Squat Day', dayOfWeek: 1, order: 1,
        description: 'Wir starten mit Kraft. Die Performance steht im Vordergrund – in der Progression bedeutet das, dass du dich je nach Intensität (RiR) pushen musst. 1-2 RiR sind dann schon sehr schwer aber noch technisch sauber.',
        workout_data: [
          block('A', 'Normal', [
            ex('Squat', [
              { id: uid(), type: 'Normal', reps: '12', weight: 'Top Set (2-3 RiR)' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 80%' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 80%' },
            ])
          ]),
          block('B', 'Superset', [
            ex('Beinstrecker', sets(3, '12-15')),
            ex('Beinbeuger', sets(3, '12-15')),
          ]),
        ]
      },
      {
        title: 'Active Recovery', dayOfWeek: 2, order: 2,
        description: 'Leichtes aktives Recovery.',
        workout_data: [
          block('A', 'Normal', [ex('Rower Hamstring Curl', sets(3, '12-15'))])
        ]
      },
      {
        title: 'Deadlift & Conditioning', dayOfWeek: 3, order: 3,
        description: 'Schwerer Deadlift gefolgt von Rückenarbeit und Conditioning.',
        workout_data: [
          block('A', 'Normal', [
            ex('Deadlift', [
              { id: uid(), type: 'Normal', reps: '12', weight: 'Top Set (2-3 RiR)' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 80%' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 80%' },
            ])
          ]),
          block('B', 'Superset', [
            ex('Bent Over Barbell Row', sets(3, '10-12')),
            ex('Single Arm Lat Pulldown', sets(3, '12-15')),
          ]),
          block('C', 'Circuit', [
            ex('AMRAP 3x3', [{ id: uid(), type: 'Normal', reps: '250m RowErg + 10 Burpee over Rower + max rep Single DB Snatch', weight: '3 Runden, 3 min Pause zwischen AMRAPs' }])
          ]),
        ]
      },
      {
        title: 'Front Squat & Press', dayOfWeek: 5, order: 4,
        description: 'Schwere Front Squats, Beinarbeit im Superset und Strict Press.',
        workout_data: [
          block('A', 'Normal', [
            ex('Front Squat', [
              { id: uid(), type: 'Normal', reps: '12', weight: 'Top Set (2-3 RiR)' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 80%' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 80%' },
            ])
          ]),
          block('B', 'Superset', [
            ex('Split Squats (Double DB)', sets(3, '12-15')),
            ex('Romanian Deadlift', sets(3, '10-12')),
          ]),
          block('C', 'Normal', [
            ex('Strict Press', [
              { id: uid(), type: 'Normal', reps: '8', weight: 'Top Set (2-3 RiR)' },
              { id: uid(), type: 'Normal', reps: '8', weight: 'Backoff @ 80%' },
              { id: uid(), type: 'Normal', reps: '8', weight: 'Backoff @ 80%' },
            ])
          ]),
        ]
      },
      {
        title: 'Cardio – Zone 2', dayOfWeek: 0, order: 5,
        description: 'Zone 2 Ausdauer: ca. 65-75% der HFmax.',
        workout_data: [
          block('A', 'Normal', [ex('Cardio (Run / Bike / Row)', [{ id: uid(), type: 'Normal', reps: '45 min – Zone 2', weight: '' }])])
        ]
      },
    ]
  },

  // ═══ WOCHE 2 ═══
  {
    order: 2, focus: 'Volumen steigern (2 RiR, 3 Backoff)',
    sessions: [
      {
        title: 'Squat & Conditioning', dayOfWeek: 1, order: 1,
        description: 'Mehr Volumen: 3 Backoff-Sätze. Conditioning mit AMRAP und Dead Hang.',
        workout_data: [
          block('A', 'Normal', [
            ex('Squat', [
              { id: uid(), type: 'Normal', reps: '12', weight: 'Top Set (2 RiR)' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 80%' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 80%' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 80%' },
            ])
          ]),
          block('B', 'Normal', [ex('Reverse Lunges', sets(3, '8+8'))]),
          block('C', 'Circuit', [
            ex('AMRAP 12', [{ id: uid(), type: 'Normal', reps: '10 WallBall (9/6) + 20 cal RowErg + 30m Double KB Farmers Carry', weight: '' }])
          ]),
          block('D', 'Normal', [ex('Dead Hang', [{ id: uid(), type: 'Normal', reps: '3 min kumuliert', weight: 'So wenige Sätze wie möglich' }])]),
        ]
      },
      {
        title: 'Deadlift & Core', dayOfWeek: 3, order: 2,
        description: 'Schwerer Deadlift mit Core-Arbeit im Superset.',
        workout_data: [
          block('A', 'Normal', [
            ex('Deadlift', [
              { id: uid(), type: 'Normal', reps: '12', weight: 'Top Set (2 RiR)' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 80%' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 80%' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 80%' },
            ])
          ]),
          block('B', 'Superset', [
            ex('Single Arm Renegade Row', sets(3, '10+10')),
            ex('Landmine Russian Twist', sets(3, '20')),
          ]),
        ]
      },
      {
        title: 'Front Squat & Arms', dayOfWeek: 5, order: 3,
        description: 'Front Squats, Bodyweight-Circuit und Armarbeit.',
        workout_data: [
          block('A', 'Normal', [
            ex('Front Squat', [
              { id: uid(), type: 'Normal', reps: '12', weight: 'Top Set (2 RiR)' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 80%' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 80%' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 80%' },
            ])
          ]),
          block('B', 'Circuit', [
            ex('4 Rounds For Time', [{ id: uid(), type: 'Normal', reps: '10-12 Australian Pull-ups + 10 banded Push-ups + 10 cal Erg (light)', weight: '' }])
          ]),
          block('C', 'Circuit', [
            ex('Incline Biceps Curls', sets(3, '10-12')),
            ex('Overhead Triceps Extension', sets(3, '10-12')),
          ]),
        ]
      },
      {
        title: 'Cardio – Zone 2', dayOfWeek: 0, order: 4,
        description: 'Zone 2 Ausdauereinheit.',
        workout_data: [
          block('A', 'Normal', [ex('Cardio (Run / Bike / Row)', [{ id: uid(), type: 'Normal', reps: '45-60 min – Zone 2', weight: '' }])])
        ]
      },
    ]
  },

  // ═══ WOCHE 3 ═══
  {
    order: 3, focus: 'Intensität erhöhen (1-2 RiR)',
    sessions: [
      {
        title: 'Squat & Accessories', dayOfWeek: 1, order: 1,
        description: 'Höhere Intensität: 1-2 RiR. Bein-Superset und Dead Hang.',
        workout_data: [
          block('A', 'Normal', [
            ex('Squat', [
              { id: uid(), type: 'Normal', reps: '12', weight: 'Top Set (1-2 RiR)' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 80%' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 80%' },
            ])
          ]),
          block('B', 'Superset', [
            ex('Beinbeuger', sets(3, '12-15')),
            ex('Beinstrecker', sets(3, '12-15')),
          ]),
          block('C', 'Normal', [ex('Dead Hang', [{ id: uid(), type: 'Normal', reps: '3 min kumuliert', weight: 'So wenige Sätze wie möglich' }])]),
        ]
      },
      {
        title: 'Deadlift & Conditioning', dayOfWeek: 3, order: 2,
        description: 'Deadlift bei 1-2 RiR, Rücken-Superset, intensives AMRAP.',
        workout_data: [
          block('A', 'Normal', [
            ex('Deadlift', [
              { id: uid(), type: 'Normal', reps: '12', weight: 'Top Set (1-2 RiR)' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 80%' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 80%' },
            ])
          ]),
          block('B', 'Superset', [
            ex('Bent Over Barbell Row', sets(3, '10-12')),
            ex('Single Arm Lat Pulldown', sets(3, '12-15')),
          ]),
          block('C', 'Circuit', [
            ex('AMRAP 15', [{ id: uid(), type: 'Normal', reps: '21 Double DB Deadlifts + 15 Double DB Push Press + 9 Double DB Box Step Over', weight: 'Gewicht an schwierigster Übung orientieren' }])
          ]),
        ]
      },
      {
        title: 'Front Squat & Press', dayOfWeek: 5, order: 3,
        description: 'Front Squats, Strict Press Progression (6 Reps), Bein-Superset.',
        workout_data: [
          block('A', 'Normal', [
            ex('Front Squat', [
              { id: uid(), type: 'Normal', reps: '12', weight: 'Top Set (1-2 RiR)' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 80%' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 80%' },
            ])
          ]),
          block('B', 'Normal', [
            ex('Strict Press', [
              { id: uid(), type: 'Normal', reps: '6', weight: 'Top Set (2-3 RiR)' },
              { id: uid(), type: 'Normal', reps: '6', weight: 'Backoff @ 80%' },
              { id: uid(), type: 'Normal', reps: '6', weight: 'Backoff @ 80%' },
            ])
          ]),
          block('C', 'Superset', [
            ex('Split Squats (Double DB)', sets(3, '12-15')),
            ex('Staggered Stance RDL', sets(3, '10-12')),
          ]),
        ]
      },
      {
        title: 'Cardio – Zone 2', dayOfWeek: 0, order: 4,
        description: 'Zone 2 Ausdauer mit Nasenatmung.',
        workout_data: [
          block('A', 'Normal', [ex('Cardio (Run / Bike / Row)', [{ id: uid(), type: 'Normal', reps: '45-60 min – Zone 2, Nose Breathing', weight: '' }])])
        ]
      },
    ]
  },

  // ═══ WOCHE 4 ═══
  {
    order: 4, focus: 'Progressive Overload (Backoff @ 85%)',
    sessions: [
      {
        title: 'Squat & Conditioning', dayOfWeek: 1, order: 1,
        description: 'Backoff-Gewichte steigen auf 85%. Langes AMRAP zum Abschluss.',
        workout_data: [
          block('A', 'Normal', [
            ex('Squat', [
              { id: uid(), type: 'Normal', reps: '12', weight: 'Top Set (2 RiR)' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 85%' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 85%' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 85%' },
            ])
          ]),
          block('B', 'Normal', [ex('Reverse Lunge', sets(3, '8+8'))]),
          block('C', 'Circuit', [
            ex('AMRAP 25', [{ id: uid(), type: 'Normal', reps: '500m RowErg + 10 Push-ups + 20 KB Swings + 30 AbMat Sit-ups', weight: '' }])
          ]),
          block('D', 'Normal', [ex('Dead Hang', [{ id: uid(), type: 'Normal', reps: '3 min kumuliert', weight: '' }])]),
        ]
      },
      {
        title: 'Deadlift & Upper Body', dayOfWeek: 3, order: 2,
        description: 'Deadlift @ 85% Backoff, Core-Superset, DB Bench Press.',
        workout_data: [
          block('A', 'Normal', [
            ex('Deadlift', [
              { id: uid(), type: 'Normal', reps: '12', weight: 'Top Set (2 RiR)' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 85%' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 85%' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 85%' },
            ])
          ]),
          block('B', 'Superset', [
            ex('Single Arm Renegade Row', sets(3, '10+10')),
            ex('Landmine Russian Twist', sets(3, '20')),
          ]),
          block('C', 'Normal', [ex('DB Bench Press', sets(4, '10-12'))]),
        ]
      },
      {
        title: 'Front Squat & Arms', dayOfWeek: 5, order: 3,
        description: 'Front Squats @ 85% Backoff, Bodyweight-Circuit, Armarbeit.',
        workout_data: [
          block('A', 'Normal', [
            ex('Front Squat', [
              { id: uid(), type: 'Normal', reps: '12', weight: 'Top Set (1-2 RiR)' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 85%' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 85%' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 85%' },
            ])
          ]),
          block('B', 'Circuit', [
            ex('4 Rounds For Time', [{ id: uid(), type: 'Normal', reps: '10 cal Erg + 12-15 Australian Pull-ups + 10 banded Push-ups', weight: '' }])
          ]),
          block('C', 'Circuit', [
            ex('Overhead Triceps Extension', sets(3, '12-15')),
            ex('Incline Biceps Curls', sets(3, '12-15')),
          ]),
        ]
      },
      {
        title: 'Cardio – Zone 2', dayOfWeek: 0, order: 4,
        description: 'Zone 2 Ausdauer mit Nasenatmung.',
        workout_data: [
          block('A', 'Normal', [ex('Cardio (Run / Bike / Row)', [{ id: uid(), type: 'Normal', reps: '60 min – Zone 2, Nose Breathing', weight: '' }])])
        ]
      },
    ]
  },

  // ═══ WOCHE 5 ═══
  {
    order: 5, focus: 'Peak Woche (1 RiR, Backoff @ 90%)',
    sessions: [
      {
        title: 'Squat & Conditioning', dayOfWeek: 1, order: 1,
        description: 'Vorletzte Woche im Block – bleib dran! Backoff steigt auf 90%.',
        workout_data: [
          block('A', 'Normal', [
            ex('Squat', [
              { id: uid(), type: 'Normal', reps: '12', weight: 'Top Set (1 RiR)' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 90%' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 90%' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 90%' },
            ])
          ]),
          block('B', 'Superset', [
            ex('Beinstrecker', sets(4, '10-12')),
            ex('Beinbeuger', sets(4, '10-12')),
          ]),
          block('C', 'Circuit', [
            ex('AMRAP 18', [{ id: uid(), type: 'Normal', reps: '10 Air Squat + 5 Pull-up + 10 alt. Lunges + 5 Push-ups', weight: 'Übungen so skalieren, dass erste 4-5 Runden unbroken gehen. Variante das gesamte Workout beibehalten!' }])
          ]),
        ]
      },
      {
        title: 'Deadlift & Conditioning', dayOfWeek: 3, order: 2,
        description: 'Deadlift @ 1 RiR, höheres Volumen bei Rows, AMRAP Finisher.',
        workout_data: [
          block('A', 'Normal', [
            ex('Deadlift', [
              { id: uid(), type: 'Normal', reps: '12', weight: 'Top Set (1 RiR)' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 90%' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 90%' },
            ])
          ]),
          block('B', 'Superset', [
            ex('Bent Over Barbell Row', sets(4, '10-12')),
            ex('Single Arm Lat Pulldown', sets(4, '8-10')),
          ]),
          block('C', 'Circuit', [
            ex('AMRAP 12', [{ id: uid(), type: 'Normal', reps: '16 DB Snatch @15-20 Kg + 8 Single DB Box Step Over + 24 cal RowErg', weight: '' }])
          ]),
        ]
      },
      {
        title: 'Front Squat, Press & Conditioning', dayOfWeek: 5, order: 3,
        description: 'Front Squat @ 1 RiR, Strict Press (5 Reps), Bein-Superset, RowErg Conditioning.',
        workout_data: [
          block('A', 'Normal', [
            ex('Front Squat', [
              { id: uid(), type: 'Normal', reps: '12', weight: 'Top Set (1 RiR)' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 80%' },
              { id: uid(), type: 'Normal', reps: '12', weight: 'Backoff @ 80%' },
            ])
          ]),
          block('B', 'Normal', [
            ex('Strict Press', [
              { id: uid(), type: 'Normal', reps: '5', weight: 'Top Set (2-3 RiR)' },
              { id: uid(), type: 'Normal', reps: '5', weight: 'Backoff @ 80%' },
              { id: uid(), type: 'Normal', reps: '5', weight: 'Backoff @ 80%' },
            ])
          ]),
          block('C', 'Superset', [
            ex('Split Squats (Double DB)', sets(3, '12-15')),
            ex('Staggered Stance RDL', sets(3, '10-12')),
          ]),
          block('D', 'Normal', [
            ex('RowErg Conditioning', [{ id: uid(), type: 'Normal', reps: '5x (1 min ON / 2 min OFF)', weight: 'Warmup: 1min easy, 1min mod, 1min hard, 1min mod, 1min easy. Track Kalorien in ON-Phasen.' }])
          ]),
        ]
      },
      {
        title: 'Cardio – Zone 2', dayOfWeek: 0, order: 4,
        description: 'Zone 2 Ausdauer mit Nasenatmung.',
        workout_data: [
          block('A', 'Normal', [ex('Cardio (Run / Bike / Row)', [{ id: uid(), type: 'Normal', reps: '60 min – Zone 2, Nose Breathing', weight: '' }])])
        ]
      },
    ]
  },

  // ═══ WOCHE 6 – TESTWOCHE ═══
  {
    order: 6, focus: 'Testwoche – 12RM Maximalversuche',
    sessions: [
      {
        title: 'Back Squat 12RM Test', dayOfWeek: 1, order: 1,
        description: 'Gut essen vor dem Training, auf Schlaf und Regeneration achten. Geh ans Maximum – es darf keine Wiederholung mehr im Tank bleiben! Formel: (Gewicht x Reps) x 0,033 + Gewicht = est. 1RM',
        workout_data: [
          block('A', 'Normal', [
            ex('Back Squat – 12RM', [{ id: uid(), type: 'Normal', reps: '12RM', weight: 'Absolutes Maximum! Keine Rep im Tank.' }])
          ]),
          block('B', 'Circuit', [
            ex('AMRAP 15', [{ id: uid(), type: 'Normal', reps: '20 WallBall @9 Kg + 10 Pull-ups + 200m Run', weight: 'Pull-ups und Wall Balls in erster Runde unbroken. Scale as needed.' }])
          ]),
        ]
      },
      {
        title: 'Deadlift 12RM Test', dayOfWeek: 3, order: 2,
        description: 'Deadlift-Test. Geh ans Maximum – keine Wiederholung im Tank! Formel: (Gewicht x Reps) x 0,033 + Gewicht = est. 1RM',
        workout_data: [
          block('A', 'Normal', [
            ex('Deadlift – 12RM', [{ id: uid(), type: 'Normal', reps: '12RM', weight: 'Absolutes Maximum!' }])
          ]),
          block('B', 'Circuit', [
            ex('AMRAP 15', [{ id: uid(), type: 'Normal', reps: '4 Sandbag over Shoulder (60/40) + 8 V-ups + 12 Box Jump Over', weight: 'Alternativ: Rucksack ~20 Kg, 8 Reps' }])
          ]),
        ]
      },
      {
        title: 'Front Squat 12RM Test', dayOfWeek: 5, order: 3,
        description: 'Front Squat-Test. Geh ans Maximum! Formel: (Gewicht x Reps) x 0,033 + Gewicht = est. 1RM',
        workout_data: [
          block('A', 'Normal', [
            ex('Front Squat – 12RM', [{ id: uid(), type: 'Normal', reps: '12RM', weight: 'Absolutes Maximum!' }])
          ]),
          block('B', 'Circuit', [
            ex('For Time 21-15-9', [{ id: uid(), type: 'Normal', reps: 'Double DB Clean @15-22,5 Kg + Burpee over DB', weight: 'So schnell wie möglich. Smart splitten!' }])
          ]),
          block('C', 'Normal', [ex('Dead Hang', [{ id: uid(), type: 'Normal', reps: '3 min kumuliert', weight: 'So wenige Sätze wie möglich' }])]),
        ]
      },
      {
        title: 'Feedback & Check-up', dayOfWeek: 6, order: 4,
        description: 'Optionaler Check-up Call in der kommenden Woche.',
        workout_data: [
          block('A', 'Normal', [ex('Check-up Call', [{ id: uid(), type: 'Normal', reps: 'Feedback-Bogen ausfüllen', weight: '' }])])
        ]
      },
      {
        title: 'Cardio – Zone 2', dayOfWeek: 0, order: 5,
        description: 'Lockere Zone 2 Einheit nach der Testwoche.',
        workout_data: [
          block('A', 'Normal', [ex('Cardio (Run / Bike / Row)', [{ id: uid(), type: 'Normal', reps: '60-75 min – Zone 2, Nose Breathing', weight: '' }])])
        ]
      },
    ]
  },

  // ═══ WOCHE 7 – DELOAD ═══
  {
    order: 7, focus: 'Deload – Regeneration & Entlastung',
    sessions: [
      {
        title: 'Deload – Ganzkörper', dayOfWeek: 1, order: 1,
        description: 'Mach diese Woche etwas weniger – wir nutzen den Übergang, um deinen Körper zu entlasten. Alles bei 70-80% der möglichen Leistung.',
        workout_data: [
          block('A', 'Circuit', [
            ex('40 min For Quality', [{ id: uid(), type: 'Normal', reps: '2000m Bike + 20 Air Squats + 15 Double DB Deadlifts + 10 Australian Pull-ups', weight: '@70-80% Kapazität' }])
          ]),
        ]
      },
      {
        title: 'Deload – Upper Body', dayOfWeek: 3, order: 2,
        description: 'Lockeres Oberkörper-AMRAP mit Dead Hang.',
        workout_data: [
          block('A', 'Circuit', [
            ex('AMRAP 30', [{ id: uid(), type: 'Normal', reps: '20 alt. seated Double DB Press + 20 alt. DB Row + 20 cal Erg (Row)', weight: '' }])
          ]),
          block('B', 'Normal', [ex('Dead Hang', [{ id: uid(), type: 'Normal', reps: '3 min kumuliert', weight: '' }])]),
        ]
      },
      {
        title: 'Deload – Conditioning', dayOfWeek: 5, order: 3,
        description: 'Nicht ballern, auf Qualität achten – trotzdem zügig. Übungen so schwer, dass du nicht länger als 2:40 min brauchst.',
        workout_data: [
          block('A', 'Circuit', [
            ex('E3MOM 30', [{ id: uid(), type: 'Normal', reps: '10 Double DB Thruster + 10 DB Crush Grip Bench Press + 10 cal Erg', weight: 'Qualität > Speed, max 2:40 min pro Runde' }])
          ]),
        ]
      },
      {
        title: 'Cardio', dayOfWeek: 6, order: 4,
        description: 'Auch gerne Schwimmen! 60-150 min Zone 2 pro Woche halten, mindestens 30 min pro Session.',
        workout_data: [
          block('A', 'Normal', [ex('Cardio (Run / Bike / Row / Swim)', [{ id: uid(), type: 'Normal', reps: '46-50 min – Zone 2', weight: '' }])])
        ]
      },
      {
        title: 'Power auf Dauer – Row', dayOfWeek: 0, order: 5,
        description: 'Sprint-Start + Intervall-Rowing. In der OFF-Phase HF möglichst auf Normalwert bringen für Durchhaltefähigkeit.',
        workout_data: [
          block('A', 'Normal', [ex('Row Sprint Start', sets(5, '10 cal Sprint'))]),
          block('B', 'Circuit', [
            ex('AMRAP 38: Row Intervals', [{ id: uid(), type: 'Normal', reps: '2 min ON (Row for Calories) + 1 min OFF (Rest)', weight: 'Display durchlaufen lassen, in OFF trinken & HF senken' }])
          ]),
        ]
      },
    ]
  },
];

// ═══════════════════════════════════════════════════════════════
// SEED LOGIC
// ═══════════════════════════════════════════════════════════════
async function seed() {
  console.log('🏋️ Seeding Hypertrophie Block I...\n');

  // 1. Find admin/coach user
  const { data: coaches, error: coachErr } = await supabase
    .from('profiles')
    .select('id, email, role')
    .in('role', ['ADMIN', 'COACH'])
    .limit(5);

  if (coachErr) { console.error('❌ Fehler beim Laden der Profile:', coachErr.message); process.exit(1); }
  if (!coaches?.length) { console.error('❌ Kein Admin/Coach-Profil gefunden.'); process.exit(1); }

  const coach = coaches.find(c => c.role === 'ADMIN') || coaches[0];
  console.log(`✅ Coach/Admin gefunden: ${coach.email} (${coach.id})\n`);

  // 2. Create plan
  const { data: plan, error: planErr } = await supabase
    .from('plans')
    .insert({
      coach_id: coach.id,
      name: 'Hypertrophie Block I',
      description: '6-wöchiger Hypertrophie-Block mit progressiver Überlastung (12 Rep Scheme). Inkl. Squat-, Deadlift- und Front Squat-Progression, Conditioning-Elemente und einer finalen Testwoche mit 12RM-Tests. Abschluss: 1 Woche Deload. Basiert auf einem klassischen Push/Pull/Legs Split mit 4 Trainingstagen + 1 Cardio-Tag pro Woche.'
    })
    .select()
    .single();

  if (planErr) { console.error('❌ Plan erstellen fehlgeschlagen:', planErr.message); process.exit(1); }
  console.log(`✅ Plan erstellt: "${plan.name}" (${plan.id})\n`);

  // 3. Create weeks + sessions
  for (const weekDef of WEEKS) {
    const { data: week, error: weekErr } = await supabase
      .from('weeks')
      .insert({ plan_id: plan.id, order: weekDef.order, focus: weekDef.focus })
      .select()
      .single();

    if (weekErr) { console.error(`❌ Woche ${weekDef.order}:`, weekErr.message); continue; }
    console.log(`  📅 Woche ${weekDef.order}: ${weekDef.focus}`);

    for (const sessionDef of weekDef.sessions) {
      const { error: sessErr } = await supabase
        .from('sessions')
        .insert({
          week_id: week.id,
          title: sessionDef.title,
          description: sessionDef.description,
          day_of_week: sessionDef.dayOfWeek,
          order: sessionDef.order,
          workout_data: sessionDef.workout_data
        });

      if (sessErr) { console.error(`    ❌ Session "${sessionDef.title}":`, sessErr.message); }
      else { console.log(`     ✅ ${sessionDef.title}`); }
    }
  }

  console.log('\n🎉 Hypertrophie Block I erfolgreich erstellt!');
  console.log(`   Plan-ID: ${plan.id}`);
  console.log(`   Coach: ${coach.email}`);
  console.log(`   7 Wochen, ${WEEKS.reduce((sum, w) => sum + w.sessions.length, 0)} Sessions`);
}

seed().catch(err => { console.error('Fatal:', err); process.exit(1); });
