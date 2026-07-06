import type { Question } from './types'

function opt(id: string, score: number | null, flagLevel?: 0 | 1 | 2 | 3 | 4, triggers?: string[]): Question['options'][0] {
  const LABELS: Record<string, string> = {
    no_pain: 'No pain', mild_pain: 'Mild pain', moderate_pain: 'Moderate pain',
    severe_pain: 'Severe pain', very_severe_pain: 'Very severe pain',
    not_stressed: 'Not stressed', mildly_stressed: 'Mildly stressed',
    moderately_stressed: 'Moderately stressed', very_stressed: 'Very stressed',
    extremely_stressed: 'Extremely stressed', high_energy: 'High energy',
    good_energy: 'Good energy', okay_energy: 'Okay energy', low_energy: 'Low energy',
    very_low_energy: 'Very low energy', no: 'No', yes: 'Yes',
    yes_and_i_took_it: 'Yes, and I took it', yes_but_not_yet: 'Yes, but not yet',
    yes_but_i_missed_it: 'Yes, but I missed it', not_sure: 'Not sure',
    a_little: 'A little', some: 'Some', a_lot: 'A lot', very_much: 'Very much',
    not_at_all: 'Not at all', none: 'None', mild: 'Mild', moderate: 'Moderate',
    severe: 'Severe', very_severe: 'Very severe', yes_enough: 'Yes, enough',
    mostly_enough: 'Mostly enough', not_enough: 'Not enough', almost_nothing: 'Almost nothing',
    almost_none: 'Almost none', very_little: 'Very little', a_lot_score_0: 'A lot',
    moderate_amount: 'Moderate amount', did_not_need_medication: 'Did not need medication',
    missed_one_dose: 'Missed one dose', missed_more_than_one_dose: 'Missed more than one dose',
    took_more_than_planned: 'Took more than planned', prefer_not_answer: 'Prefer not to answer',
    never: 'Never', once: 'Once', two_three_times: '2-3 times', most_days: 'Most days',
    every_day: 'Every day', every_day_score_0: 'Every day', most_days_score_0: 'Most days',
    some_days: 'Some days', rarely: 'Rarely', do_not_take_medication: 'Do not take medication',
    two_three_days: '2-3 days', two_three_nights: '2-3 nights', most_nights: 'Most nights',
    every_night: 'Every night', very_rested: 'Very rested', rested: 'Rested',
    okay: 'Okay', tired: 'Tired', exhausted: 'Exhausted',
    nothing_made_it_worse: 'Nothing made it worse', pain: 'Pain',
    stress_worry: 'Stress or worry', bathroom: 'Bathroom trips', noise: 'Noise',
    light: 'Light', heat_cold: 'Heat or cold', phone_screen: 'Phone/screen use',
    alcohol_cannabis_substances: 'Alcohol, cannabis, or other substances',
    child_pet_caregiving: 'Child or pet caregiving', other: 'Other',
    same_as_usual: 'Same as usual', a_little_different: 'A little different',
    very_different: 'Very different', new_pain: 'New pain',
    no_pain_option: 'No pain', head_face: 'Head or face', neck_shoulders: 'Neck or shoulders',
    chest: 'Chest', stomach_abdomen: 'Stomach or abdomen', back: 'Back',
    arms_hands: 'Arms or hands', hips_legs_feet: 'Hips, legs, or feet',
    joints: 'Joints', whole_body: 'Whole body', no_other_symptoms: 'No other symptoms',
    fever_chills: 'Fever or chills', cough: 'Cough',
    trouble_breathing: 'Trouble breathing', dizziness: 'Dizziness',
    nausea_vomiting: 'Nausea or vomiting', diarrhea: 'Diarrhea',
    constipation: 'Constipation', headache: 'Headache', fatigue: 'Fatigue',
    skin_issue: 'Skin issue', not_low_sad: 'Not low or sad',
    mildly_low_sad: 'Mildly low or sad', moderately_low_sad: 'Moderately low or sad',
    very_low_sad: 'Very low or sad', extremely_low_sad: 'Extremely low or sad',
    not_hard: 'Not hard', a_little_hard: 'A little hard', somewhat_hard: 'Somewhat hard',
    very_hard: 'Very hard', unable_to_start: 'Unable to start',
    smoke_bad_air_smell: 'Smoke, bad air, or smell', mold_dust_allergens: 'Mold, dust, or allergens',
    unsafe_place: 'Unsafe place', work_school_pressure: 'Work or school pressure',
    conflict_at_home: 'Conflict at home', crowding: 'Crowding',
    nothing_specific: 'Nothing specific', low_mood: 'Low mood',
    anxiety_stress: 'Anxiety or stress', symptoms: 'Symptoms',
    medication_issue: 'Medication issue', work_school: 'Work or school',
    family_social_issue: 'Family or social issue', environment: 'Environment',
    food_issue: 'Food issue', had_no_pain: 'Had no pain', rest: 'Rest',
    movement_stretching: 'Movement or stretching', medication: 'Medication',
    heat_ice: 'Heat or ice', food_water: 'Food or water', sleep: 'Sleep',
    breathing_relaxation: 'Breathing or relaxation', nothing_helped: 'Nothing helped',
    yes_many_things: 'Yes, many things', yes_one_two_things: 'Yes, 1-2 things',
    not_much: 'Not much', no_not_safe: 'No, not safe', yes_safe: 'Yes, safe',
    mostly_safe: 'Mostly safe', wanted_support_but_did_not_get_it: 'Wanted support but did not get it',
    avoided_people: 'Avoided people', conflict_with_someone: 'Conflict with someone',
    felt_unsafe_with_someone: 'Felt unsafe with someone',
    chose_to_be_alone_and_felt_okay: 'Chose to be alone and felt okay',
    no_issue: 'No issue', forgot: 'Forgot', side_effects: 'Side effects',
    ran_out: 'Ran out', cost: 'Cost', instructions_unclear: 'Instructions unclear',
    do_not_want_to_take_it: 'Do not want to take it', too_many_pills: 'Too many pills',
    chose_not_to_take_it: 'Chose not to take it', felt_better: 'Felt better',
    felt_worse: 'Felt worse', yes_less_than_usual: 'Yes, less than usual',
    yes_same_as_usual: 'Yes, same as usual', yes_more_than_usual: 'Yes, more than usual',
    yes_much_more_than_usual: 'Yes, much more than usual', one_drink: '1 drink',
    two_drinks: '2 drinks', three_four_drinks: '3-4 drinks', five_or_more_drinks: '5 or more drinks',
    small_amount: 'Small amount', large_amount: 'Large amount',
    not_applicable: 'Not applicable', zero: 'Zero', one: 'One', two: 'Two', three: 'Three',
    more_than_three: 'More than 3', no_trouble: 'No trouble', a_little_trouble: 'A little trouble',
    some_trouble: 'Some trouble', a_lot_trouble: 'A lot of trouble',
    could_not_do_them: 'Could not do them', a_little_unsafe: 'A little unsafe',
    somewhat_unsafe: 'Somewhat unsafe', very_unsafe: 'Very unsafe',
    nothing_stopped_me: 'Nothing stopped me', no_time: 'No time', weather: 'Weather',
    no_access_equipment: 'No access to equipment', very_little_sitting: 'Very little',
    some_of_the_day: 'Some of the day', about_half_the_day: 'About half the day',
    most_of_the_day: 'Most of the day', almost_all_day: 'Almost all day',
    less_than_4: 'Less than 4 hours', four_five: '4-5 hours', six_seven: '6-7 hours',
    eight_nine: '8-9 hours', more_than_9: 'More than 9 hours',
    zero_days: 'Zero days', one_two_days: '1-2 days', three_four_days: '3-4 days',
    five_six_days: '5-6 days', seven_days: '7 days', no_pain_w: 'No pain',
    mild_pain_w: 'Mild pain', moderate_pain_w: 'Moderate pain',
    severe_pain_w: 'Severe pain', very_severe_pain_w: 'Very severe pain',
    smoking_vaping: 'Smoking or vaping', cannabis: 'Cannabis',
    prescription_medication_not_as_prescribed: 'Prescription medication (not as prescribed)',
    other_substances: 'Other substances', mood: 'Mood',
    eating: 'Eating', relationships: 'Relationships',
    money: 'Money', driving_safety: 'Driving or safety', do_not_know: 'Do not know',
    low_appetite: 'Low appetite', nausea_stomach_issue: 'Nausea or stomach issue',
    stress_mood: 'Stress or mood', no_food_available: 'No food available',
    trouble_preparing_food: 'Trouble preparing food', body_image_food_guilt: 'Body image or food guilt',
    housing_issue: 'Housing issue', work_school_environment: 'Work or school environment',
    transportation_issue: 'Transportation issue', caffeine: 'Caffeine',
    work_school_schedule: 'Work or school schedule',
    health: 'Health', safety: 'Safety', social_situation: 'Social situation',
    substance_use: 'Substance use', racing_heart: 'Racing heart',
    family_relationship: 'Family or relationship', do_not_take_medication_w: 'Do not take medication',
    nothing_made_it_hard: 'Nothing made it hard', chose_not_to_take: 'Chose not to take it',
    not_sure_w: 'Not sure', stopped_taking_it: 'Stopped taking it',
    mildly: 'Mildly', moderately: 'Moderately', severely: 'Severely', very_severely: 'Very severely',
    refill_needed: 'Refill needed', do_not_take_medication_n: 'Do not take medication',
    no_not_sure: 'No', maybe: 'Maybe', seven_days_0: '7 days', five_six_days_0: '5-6 days',
    three_four_days_0: '3-4 days', one_two_days_0: '1-2 days', zero_days_0: '0 days',
    not_sure_diet: 'Not sure', every_day_0: 'Every day', yes_w: 'Yes', mostly: 'Mostly',
    very_little_diet: 'Very little', no_diet: 'No', no_b: 'No',
    no_enough: 'No, not enough'
  }
  const label = LABELS[id] ?? id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return { id, label, score, ...(flagLevel !== undefined ? { flagLevel } : {}), ...(triggers ? { triggers } : {}) }
}

// ─── BEGINNER MORNING ─────────────────────────────────────────────────────────

const BEGINNER_MORNING: Question[] = [
  {
    id: 'Q_B_M_1', domain: 'pain', tier: 'beginner', timing: 'morning',
    text: 'Do you have pain right now?',
    examples: ['headache', 'back pain', 'stomach pain', 'joint pain'],
    responseType: 'single_choice', required: true,
    options: [
      opt('no_pain', 0), opt('mild_pain', 1), opt('moderate_pain', 2, 2),
      opt('severe_pain', 3, 3), opt('very_severe_pain', 4, 4),
    ],
  },
  {
    id: 'Q_B_M_2', domain: 'mental_health', tier: 'beginner', timing: 'morning',
    text: 'How stressed or worried do you feel right now?',
    examples: ['nervous', 'tense', 'overwhelmed', 'unable to relax'],
    responseType: 'single_choice', required: true,
    options: [
      opt('not_stressed', 0), opt('mildly_stressed', 1), opt('moderately_stressed', 2, 2),
      opt('very_stressed', 3, 3), opt('extremely_stressed', 4, 3),
    ],
  },
  {
    id: 'Q_B_M_3', domain: 'activity', tier: 'beginner', timing: 'morning',
    text: 'How much energy do you have right now?',
    examples: ['energy to walk', 'work', 'study', 'do chores'],
    responseType: 'single_choice', required: true,
    options: [
      opt('high_energy', 0), opt('good_energy', 1), opt('okay_energy', 2),
      opt('low_energy', 3, 2), opt('very_low_energy', 4, 3),
    ],
  },
  {
    id: 'Q_B_M_4', domain: 'medication', tier: 'beginner', timing: 'morning',
    text: 'Do you need to take medication this morning?',
    responseType: 'single_choice', required: true,
    options: [
      opt('no', 0), opt('yes_and_i_took_it', 0), opt('yes_but_not_yet', 1),
      opt('yes_but_i_missed_it', 3, 3), opt('not_sure', 3, 3),
    ],
  },
  {
    id: 'Q_B_M_5', domain: 'environment', tier: 'beginner', timing: 'morning',
    text: 'Is anything around you making your health worse right now?',
    examples: ['smoke', 'bad air', 'noise', 'heat', 'cold', 'unsafe place', 'mold'],
    responseType: 'single_choice', required: true,
    options: [
      opt('no', 0), opt('a_little', 1), opt('some', 2, 2),
      opt('a_lot', 3, 3), opt('very_much', 4, 4),
    ],
  },
]

// ─── BEGINNER NIGHT ────────────────────────────────────────────────────────────

const BEGINNER_NIGHT: Question[] = [
  {
    id: 'Q_B_N_1', domain: 'pain', tier: 'beginner', timing: 'night',
    text: 'How much pain did you have today?',
    responseType: 'single_choice', required: true,
    options: [
      opt('no_pain', 0), opt('mild_pain', 1), opt('moderate_pain', 2, 2),
      opt('severe_pain', 3, 3), opt('very_severe_pain', 4, 4),
    ],
  },
  {
    id: 'Q_B_N_2', domain: 'mental_health', tier: 'beginner', timing: 'night',
    text: 'How much sadness, stress, or anxiety did you feel today?',
    examples: ['feeling down', 'tense', 'panicked', 'overwhelmed'],
    responseType: 'single_choice', required: true,
    options: [
      opt('none', 0), opt('mild', 1), opt('moderate', 2, 2),
      opt('severe', 3, 3), opt('very_severe', 4, 4),
    ],
  },
  {
    id: 'Q_B_N_3', domain: 'social', tier: 'beginner', timing: 'night',
    text: 'Did you feel alone or unsupported today?',
    examples: ['no one to talk to', 'felt ignored', 'felt disconnected'],
    responseType: 'single_choice', required: true,
    options: [
      opt('not_at_all', 0), opt('a_little', 1), opt('some', 2, 2),
      opt('a_lot', 3, 3), opt('very_much', 4, 4),
    ],
  },
  {
    id: 'Q_B_N_4', domain: 'lifestyle', tier: 'beginner', timing: 'night',
    text: 'Did smoking, vaping, alcohol, cannabis, or other substances affect you today?',
    examples: ['mood', 'sleep', 'energy', 'relationships', 'school/work'],
    responseType: 'single_choice', required: true,
    options: [
      opt('no', 0), opt('a_little', 1), opt('some', 2, 2),
      opt('a_lot', 3, 3), opt('very_much', 4, 4),
      opt('prefer_not_answer', null),
    ],
  },
  {
    id: 'Q_B_N_5', domain: 'diet', tier: 'beginner', timing: 'night',
    text: 'Did you eat enough food today?',
    examples: ['enough meals', 'enough calories', 'not skipping food because of stress, money, nausea, or low appetite'],
    responseType: 'single_choice', required: true,
    options: [
      opt('yes_enough', 0), opt('mostly_enough', 1), opt('not_sure', 2),
      opt('not_enough', 3, 3), opt('almost_nothing', 4, 4),
    ],
  },
  {
    id: 'Q_B_N_6', domain: 'activity', tier: 'beginner', timing: 'night',
    text: 'How much did you move your body today?',
    examples: ['walking', 'stretching', 'exercise', 'chores', 'physical work'],
    responseType: 'single_choice', required: true,
    options: [
      { id: 'a_lot', label: 'A lot', score: 0 },
      { id: 'moderate_amount', label: 'Moderate amount', score: 1 },
      { id: 'a_little', label: 'A little', score: 2 },
      { id: 'very_little', label: 'Very little', score: 3, flagLevel: 2 },
      { id: 'almost_none', label: 'Almost none', score: 4, flagLevel: 3 },
    ],
  },
  {
    id: 'Q_B_N_7', domain: 'medication', tier: 'beginner', timing: 'night',
    text: 'If you needed medication today, did you take it as planned?',
    responseType: 'single_choice', required: true,
    options: [
      opt('did_not_need_medication', 0), opt('yes', 0), opt('missed_one_dose', 2, 2),
      opt('missed_more_than_one_dose', 3, 3), opt('took_more_than_planned', 4, 4),
      opt('not_sure', 3, 3),
    ],
  },
]

// ─── BEGINNER WEEKLY ───────────────────────────────────────────────────────────

const BEGINNER_WEEKLY: Question[] = [
  {
    id: 'Q_B_W_1', domain: 'pain', tier: 'beginner', timing: 'weekly',
    text: 'In the past 7 days, how often did pain stop you from doing normal activities?',
    examples: ['walking', 'sleeping', 'school', 'work', 'chores', 'social plans'],
    responseType: 'single_choice', required: true,
    options: [
      opt('never', 0), opt('once', 1), opt('two_three_times', 2),
      opt('most_days', 3, 3), opt('every_day', 4, 3),
    ],
  },
  {
    id: 'Q_B_W_2', domain: 'mental_health', tier: 'beginner', timing: 'weekly',
    text: 'In the past 7 days, how often did stress, sadness, or anxiety make your day harder?',
    responseType: 'single_choice', required: true,
    options: [
      opt('never', 0), opt('once', 1), opt('two_three_times', 2),
      opt('most_days', 3, 3), opt('every_day', 4, 4),
    ],
  },
  {
    id: 'Q_B_W_3', domain: 'social', tier: 'beginner', timing: 'weekly',
    text: 'In the past 7 days, how often did you feel alone or unsupported?',
    responseType: 'single_choice', required: true,
    options: [
      opt('never', 0), opt('once', 1), opt('two_three_times', 2),
      opt('most_days', 3, 3), opt('every_day', 4, 4),
    ],
  },
  {
    id: 'Q_B_W_4', domain: 'lifestyle', tier: 'beginner', timing: 'weekly',
    text: 'In the past 7 days, did smoking, vaping, alcohol, cannabis, or other substances cause problems?',
    examples: ['poor sleep', 'low mood', 'arguments', 'missed work/school', 'unsafe choices'],
    responseType: 'single_choice', required: true,
    options: [
      opt('no', 0), opt('a_little', 1), opt('some', 2),
      opt('a_lot', 3, 3), opt('very_much', 4, 4),
      opt('prefer_not_answer', null),
    ],
  },
  {
    id: 'Q_B_W_5', domain: 'diet', tier: 'beginner', timing: 'weekly',
    text: 'In the past 7 days, how often did you have enough food?',
    responseType: 'single_choice', required: true,
    options: [
      { id: 'every_day', label: 'Every day', score: 0 },
      { id: 'most_days', label: 'Most days', score: 1 },
      { id: 'some_days', label: 'Some days', score: 2 },
      { id: 'rarely', label: 'Rarely', score: 3, flagLevel: 3 },
      { id: 'never', label: 'Never', score: 4, flagLevel: 4 },
    ],
  },
  {
    id: 'Q_B_W_6', domain: 'environment', tier: 'beginner', timing: 'weekly',
    text: 'In the past 7 days, did your home, school, work, or neighborhood make your health worse?',
    examples: ['smoke', 'noise', 'unsafe area', 'heat/cold', 'mold', 'stress at work/school'],
    responseType: 'single_choice', required: true,
    options: [
      opt('no', 0), opt('a_little', 1), opt('some', 2),
      opt('a_lot', 3, 3), opt('very_much', 4, 4),
    ],
  },
  {
    id: 'Q_B_W_7', domain: 'medication', tier: 'beginner', timing: 'weekly',
    text: 'In the past 7 days, how often did you miss medication or take it differently than planned?',
    responseType: 'single_choice', required: true,
    options: [
      opt('do_not_take_medication', 0), opt('never', 0), opt('once', 1),
      opt('two_three_times', 2, 2), opt('most_days', 3, 3), opt('every_day', 4, 4),
    ],
  },
  {
    id: 'Q_B_W_8', domain: 'activity', tier: 'beginner', timing: 'weekly',
    text: 'In the past 7 days, how often did you move your body for at least 10 minutes?',
    examples: ['walking', 'stretching', 'exercise', 'sports', 'chores'],
    responseType: 'single_choice', required: true,
    options: [
      { id: 'every_day', label: 'Every day', score: 0 },
      { id: 'most_days', label: 'Most days', score: 1 },
      { id: 'some_days', label: 'Some days', score: 2 },
      { id: 'once', label: 'Once', score: 3, flagLevel: 2 },
      { id: 'never', label: 'Never', score: 4, flagLevel: 3 },
    ],
  },
]

// ─── INTERMEDIATE MORNING ──────────────────────────────────────────────────────

const INTERMEDIATE_MORNING: Question[] = [
  {
    id: 'Q_I_M_1', domain: 'sleep', tier: 'intermediate', timing: 'morning',
    text: 'How rested do you feel after sleeping?',
    examples: ['refreshed', 'tired', 'exhausted'],
    responseType: 'single_choice', required: true,
    options: [
      opt('very_rested', 0), opt('rested', 1), opt('okay', 2),
      opt('tired', 3, 2), opt('exhausted', 4, 3),
    ],
  },
  {
    id: 'Q_I_M_2', domain: 'pain', tier: 'intermediate', timing: 'morning',
    text: 'Do you have pain right now?',
    responseType: 'single_choice', required: true,
    options: [
      opt('no_pain', 0), opt('mild_pain', 1), opt('moderate_pain', 2, 2),
      opt('severe_pain', 3, 3), opt('very_severe_pain', 4, 4),
    ],
  },
  {
    id: 'Q_I_M_3', domain: 'mental_health', tier: 'intermediate', timing: 'morning',
    text: 'How stressed or worried do you feel right now?',
    responseType: 'single_choice', required: true,
    options: [
      opt('not_stressed', 0), opt('mildly_stressed', 1), opt('moderately_stressed', 2, 2),
      opt('very_stressed', 3, 3), opt('extremely_stressed', 4, 3),
    ],
  },
  {
    id: 'Q_I_M_4', domain: 'mental_health', tier: 'intermediate', timing: 'morning',
    text: 'How low or sad do you feel right now?',
    examples: ['sad', 'empty', 'hopeless', 'unmotivated'],
    responseType: 'single_choice', required: true,
    options: [
      opt('not_low_sad', 0), opt('mildly_low_sad', 1), opt('moderately_low_sad', 2, 2),
      opt('very_low_sad', 3, 3), opt('extremely_low_sad', 4, 4),
    ],
  },
  {
    id: 'Q_I_M_5', domain: 'activity', tier: 'intermediate', timing: 'morning',
    text: 'How hard does it feel to start normal daily tasks right now?',
    examples: ['getting ready', 'school/work', 'chores', 'appointments'],
    responseType: 'single_choice', required: true,
    options: [
      opt('not_hard', 0), opt('a_little_hard', 1), opt('somewhat_hard', 2),
      opt('very_hard', 3, 3), opt('unable_to_start', 4, 4),
    ],
  },
  {
    id: 'Q_I_M_6', domain: 'medication', tier: 'intermediate', timing: 'morning',
    text: 'Do you need to take medication this morning?',
    responseType: 'single_choice', required: true,
    options: [
      opt('no', 0), opt('yes_and_i_took_it', 0), opt('yes_but_not_yet', 1),
      opt('yes_but_i_missed_it', 3, 3), opt('not_sure', 3, 3),
    ],
  },
  {
    id: 'Q_I_M_7', domain: 'environment', tier: 'intermediate', timing: 'morning',
    text: 'Is anything around you making your health worse right now?',
    responseType: 'multi_choice', required: true,
    options: [
      opt('no', 0), opt('smoke_bad_air_smell', 3, 3), opt('noise', 2),
      opt('heat_cold', 2), opt('mold_dust_allergens', 3, 3),
      opt('unsafe_place', 4, 4), opt('work_school_pressure', 2),
      opt('conflict_at_home', 3, 3), opt('other', 2),
    ],
  },
]

// ─── INTERMEDIATE NIGHT ────────────────────────────────────────────────────────

const INTERMEDIATE_NIGHT: Question[] = [
  {
    id: 'Q_I_N_1', domain: 'pain', tier: 'intermediate', timing: 'night',
    text: 'What was your worst pain today?',
    responseType: 'single_choice', required: true,
    options: [
      opt('no_pain', 0), opt('mild_pain', 1), opt('moderate_pain', 2, 2),
      opt('severe_pain', 3, 3), opt('very_severe_pain', 4, 4),
    ],
  },
  {
    id: 'Q_I_N_2', domain: 'pain', tier: 'intermediate', timing: 'night',
    text: 'Did pain stop you from doing normal activities today?',
    examples: ['walking', 'school/work', 'chores', 'sleep', 'social plans'],
    responseType: 'single_choice', required: true,
    options: [
      opt('not_at_all', 0), opt('a_little', 1), opt('some', 2),
      opt('a_lot', 3, 3), opt('very_much', 4, 4),
    ],
  },
  {
    id: 'Q_I_N_3', domain: 'mental_health', tier: 'intermediate', timing: 'night',
    text: 'How much sadness, emptiness, or hopelessness did you feel today?',
    responseType: 'single_choice', required: true,
    options: [
      opt('none', 0), opt('mild', 1), opt('moderate', 2, 2),
      opt('severe', 3, 3), opt('very_severe', 4, 4),
    ],
  },
  {
    id: 'Q_I_N_4', domain: 'mental_health', tier: 'intermediate', timing: 'night',
    text: 'How much worry, stress, or panic did you feel today?',
    responseType: 'single_choice', required: true,
    options: [
      opt('none', 0), opt('mild', 1), opt('moderate', 2, 2),
      opt('severe', 3, 3), opt('very_severe', 4, 3),
    ],
  },
  {
    id: 'Q_I_N_5', domain: 'social', tier: 'intermediate', timing: 'night',
    text: 'Did you feel alone or unsupported today?',
    responseType: 'single_choice', required: true,
    options: [
      opt('not_at_all', 0), opt('a_little', 1), opt('some', 2),
      opt('a_lot', 3, 3), opt('very_much', 4, 4),
    ],
  },
  {
    id: 'Q_I_N_6', domain: 'lifestyle', tier: 'intermediate', timing: 'night',
    text: 'Did smoking, vaping, alcohol, cannabis, or other substances affect your day?',
    examples: ['sleep', 'mood', 'energy', 'safety', 'spending', 'relationships', 'work/school'],
    responseType: 'single_choice', required: true,
    options: [
      opt('no', 0), opt('a_little', 1), opt('some', 2, 2),
      opt('a_lot', 3, 3), opt('very_much', 4, 4),
      opt('prefer_not_answer', null),
    ],
  },
  {
    id: 'Q_I_N_7', domain: 'diet', tier: 'intermediate', timing: 'night',
    text: 'Did you eat enough food today?',
    responseType: 'single_choice', required: true,
    options: [
      opt('yes_enough', 0), opt('mostly_enough', 1), opt('not_sure', 2),
      opt('not_enough', 3, 3), opt('almost_nothing', 4, 4),
    ],
  },
  {
    id: 'Q_I_N_8', domain: 'diet', tier: 'intermediate', timing: 'night',
    text: 'Did your food include enough helpful foods today?',
    examples: ['protein', 'fruits/vegetables', 'whole grains', 'water'],
    responseType: 'single_choice', required: true,
    options: [
      opt('yes', 0), opt('mostly', 1), opt('some', 2),
      opt('very_little', 3, 2), opt('no', 4, 3),
    ],
  },
  {
    id: 'Q_I_N_9', domain: 'environment', tier: 'intermediate', timing: 'night',
    text: 'Did your environment make your health worse today?',
    examples: ['smoke', 'heat', 'cold', 'noise', 'mold', 'unsafe space', 'stressful workplace'],
    responseType: 'single_choice', required: true,
    options: [
      opt('no', 0), opt('a_little', 1), opt('some', 2),
      opt('a_lot', 3, 3), opt('very_much', 4, 4),
    ],
  },
  {
    id: 'Q_I_N_10', domain: 'medication', tier: 'intermediate', timing: 'night',
    text: 'If you needed medication today, did you take it as planned?',
    responseType: 'single_choice', required: true,
    options: [
      opt('did_not_need_medication', 0), opt('yes', 0), opt('missed_one_dose', 2, 2),
      opt('missed_more_than_one_dose', 3, 3), opt('took_more_than_planned', 4, 4),
      opt('not_sure', 3, 3),
    ],
  },
  {
    id: 'Q_I_N_11', domain: 'activity', tier: 'intermediate', timing: 'night',
    text: 'How much did you move your body today?',
    responseType: 'single_choice', required: true,
    options: [
      { id: 'a_lot', label: 'A lot', score: 0 },
      { id: 'moderate_amount', label: 'Moderate amount', score: 1 },
      { id: 'a_little', label: 'A little', score: 2 },
      { id: 'very_little', label: 'Very little', score: 3, flagLevel: 2 },
      { id: 'almost_none', label: 'Almost none', score: 4, flagLevel: 3 },
    ],
  },
  {
    id: 'Q_I_N_12', domain: 'activity', tier: 'intermediate', timing: 'night',
    text: 'Did tiredness, mood, pain, or symptoms stop you from doing normal tasks today?',
    examples: ['hygiene', 'eating', 'chores', 'school', 'work', 'errands'],
    responseType: 'single_choice', required: true,
    options: [
      opt('not_at_all', 0), opt('a_little', 1), opt('some', 2),
      opt('a_lot', 3, 3), opt('very_much', 4, 4),
    ],
  },
]

// ─── INTERMEDIATE WEEKLY ───────────────────────────────────────────────────────

const INTERMEDIATE_WEEKLY: Question[] = [
  {
    id: 'Q_I_W_1', domain: 'pain', tier: 'intermediate', timing: 'weekly',
    text: 'In the past 7 days, how often did you have pain?',
    responseType: 'single_choice', required: true,
    options: [
      opt('never', 0), opt('once', 1), { id: 'two_three_days', label: '2-3 days', score: 2 },
      opt('most_days', 3), opt('every_day', 4),
    ],
  },
  {
    id: 'Q_I_W_2', domain: 'pain', tier: 'intermediate', timing: 'weekly',
    text: 'In the past 7 days, how often did pain affect sleep?',
    responseType: 'single_choice', required: true,
    options: [
      opt('never', 0), opt('once', 1), opt('two_three_nights', 2),
      opt('most_nights', 3), opt('every_night', 4),
    ],
  },
  {
    id: 'Q_I_W_3', domain: 'pain', tier: 'intermediate', timing: 'weekly',
    text: 'In the past 7 days, how often did pain stop normal activities?',
    responseType: 'single_choice', required: true,
    options: [
      opt('never', 0), opt('once', 1), { id: 'two_three_days', label: '2-3 days', score: 2 },
      opt('most_days', 3), opt('every_day', 4),
    ],
  },
  {
    id: 'Q_I_W_4', domain: 'mental_health', tier: 'intermediate', timing: 'weekly',
    text: 'In the past 7 days, how often did you feel sad, empty, or hopeless?',
    responseType: 'single_choice', required: true,
    options: [
      opt('never', 0), opt('once', 1), { id: 'two_three_days', label: '2-3 days', score: 2 },
      opt('most_days', 3), opt('every_day', 4),
    ],
  },
  {
    id: 'Q_I_W_5', domain: 'mental_health', tier: 'intermediate', timing: 'weekly',
    text: 'In the past 7 days, how often did you feel worried, tense, or panicked?',
    responseType: 'single_choice', required: true,
    options: [
      opt('never', 0), opt('once', 1), { id: 'two_three_days', label: '2-3 days', score: 2 },
      opt('most_days', 3), opt('every_day', 4),
    ],
  },
  {
    id: 'Q_I_W_6', domain: 'mental_health', tier: 'intermediate', timing: 'weekly',
    text: 'In the past 7 days, how often was it hard to control your emotions?',
    examples: ['crying', 'anger', 'panic', 'numbness', 'shutting down'],
    responseType: 'single_choice', required: true,
    options: [
      opt('never', 0), opt('once', 1), { id: 'two_three_days', label: '2-3 days', score: 2 },
      opt('most_days', 3), opt('every_day', 4),
    ],
  },
  {
    id: 'Q_I_W_7', domain: 'social', tier: 'intermediate', timing: 'weekly',
    text: 'In the past 7 days, how often did you feel alone or unsupported?',
    responseType: 'single_choice', required: true,
    options: [
      opt('never', 0), opt('once', 1), { id: 'two_three_days', label: '2-3 days', score: 2 },
      opt('most_days', 3), opt('every_day', 4),
    ],
  },
  {
    id: 'Q_I_W_8', domain: 'social', tier: 'intermediate', timing: 'weekly',
    text: 'In the past 7 days, how often did conflict with another person affect your health?',
    examples: ['family', 'partner', 'friend', 'coworker', 'classmate'],
    responseType: 'single_choice', required: true,
    options: [
      opt('never', 0), opt('once', 1), opt('two_three_times', 2),
      opt('most_days', 3), opt('every_day', 4),
    ],
  },
  {
    id: 'Q_I_W_9', domain: 'lifestyle', tier: 'intermediate', timing: 'weekly',
    text: 'In the past 7 days, how often did work, school, or home responsibilities feel like too much?',
    responseType: 'single_choice', required: true,
    options: [
      opt('never', 0), opt('once', 1), { id: 'two_three_days', label: '2-3 days', score: 2 },
      opt('most_days', 3), opt('every_day', 4),
    ],
  },
  {
    id: 'Q_I_W_10', domain: 'lifestyle', tier: 'intermediate', timing: 'weekly',
    text: 'In the past 7 days, did smoking, vaping, alcohol, cannabis, or other substances cause problems?',
    examples: ['sleep', 'mood', 'money', 'safety', 'relationships', 'work/school'],
    responseType: 'single_choice', required: true,
    options: [
      opt('no', 0), opt('a_little', 1), opt('some', 2),
      opt('a_lot', 3), opt('very_much', 4),
      opt('prefer_not_answer', null),
    ],
  },
  {
    id: 'Q_I_W_11', domain: 'diet', tier: 'intermediate', timing: 'weekly',
    text: 'In the past 7 days, how often did you have enough food?',
    responseType: 'single_choice', required: true,
    options: [
      { id: 'every_day', label: 'Every day', score: 0 },
      { id: 'most_days', label: 'Most days', score: 1 },
      { id: 'some_days', label: 'Some days', score: 2 },
      { id: 'rarely', label: 'Rarely', score: 3 },
      { id: 'never', label: 'Never', score: 4 },
    ],
  },
  {
    id: 'Q_I_W_12', domain: 'diet', tier: 'intermediate', timing: 'weekly',
    text: 'In the past 7 days, how often did you eat balanced meals?',
    examples: ['protein', 'fruits/vegetables', 'whole grains', 'enough water'],
    responseType: 'single_choice', required: true,
    options: [
      { id: 'every_day', label: 'Every day', score: 0 },
      { id: 'most_days', label: 'Most days', score: 1 },
      { id: 'some_days', label: 'Some days', score: 2 },
      { id: 'rarely', label: 'Rarely', score: 3 },
      { id: 'never', label: 'Never', score: 4 },
    ],
  },
  {
    id: 'Q_I_W_13', domain: 'environment', tier: 'intermediate', timing: 'weekly',
    text: 'In the past 7 days, how often did your environment make symptoms worse?',
    examples: ['smoke', 'noise', 'heat/cold', 'mold', 'dust', 'unsafe area'],
    responseType: 'single_choice', required: true,
    options: [
      opt('never', 0), opt('once', 1), { id: 'two_three_days', label: '2-3 days', score: 2 },
      opt('most_days', 3), opt('every_day', 4),
    ],
  },
  {
    id: 'Q_I_W_14', domain: 'safety', tier: 'intermediate', timing: 'weekly',
    text: 'In the past 7 days, how often did you feel unsafe at home, work, school, or outside?',
    responseType: 'single_choice', required: true,
    options: [
      opt('never', 0), opt('once', 1), opt('two_three_times', 2),
      opt('most_days', 3), opt('every_day', 4),
    ],
  },
  {
    id: 'Q_I_W_15', domain: 'medication', tier: 'intermediate', timing: 'weekly',
    text: 'In the past 7 days, how often did you miss medication or take it differently than planned?',
    responseType: 'single_choice', required: true,
    options: [
      opt('do_not_take_medication', 0), opt('never', 0), opt('once', 1),
      opt('two_three_times', 2), opt('most_days', 3), opt('every_day', 4),
    ],
  },
  {
    id: 'Q_I_W_16', domain: 'medication', tier: 'intermediate', timing: 'weekly',
    text: 'In the past 7 days, did medication side effects bother you?',
    responseType: 'single_choice', required: true,
    options: [
      opt('do_not_take_medication', 0), opt('no', 0), opt('a_little', 1),
      opt('some', 2), opt('a_lot', 3), opt('very_much', 4),
    ],
  },
  {
    id: 'Q_I_W_17', domain: 'activity', tier: 'intermediate', timing: 'weekly',
    text: 'In the past 7 days, how often did you move your body for at least 10 minutes?',
    examples: ['walking', 'stretching', 'exercise', 'sports', 'chores'],
    responseType: 'single_choice', required: true,
    options: [
      { id: 'every_day', label: 'Every day', score: 0 },
      { id: 'most_days', label: 'Most days', score: 1 },
      { id: 'some_days', label: 'Some days', score: 2 },
      { id: 'once', label: 'Once', score: 3 },
      { id: 'never', label: 'Never', score: 4 },
    ],
  },
  {
    id: 'Q_I_W_18', domain: 'activity', tier: 'intermediate', timing: 'weekly',
    text: 'In the past 7 days, how often did symptoms stop you from being active?',
    examples: ['pain', 'tiredness', 'breathing', 'low mood', 'anxiety'],
    responseType: 'single_choice', required: true,
    options: [
      opt('never', 0), opt('once', 1), { id: 'two_three_days', label: '2-3 days', score: 2 },
      opt('most_days', 3), opt('every_day', 4),
    ],
  },
]

// ─── ADVANCED MORNING ─────────────────────────────────────────────────────────

const ADVANCED_MORNING: Question[] = [
  {
    id: 'Q_A_M_1', domain: 'sleep', tier: 'advanced', timing: 'morning',
    text: 'How many hours did you sleep last night?',
    responseType: 'single_choice', required: true,
    options: [
      opt('less_than_4', 4, 3), opt('four_five', 3), opt('six_seven', 1),
      opt('eight_nine', 0), opt('more_than_9', 2),
    ],
  },
  {
    id: 'Q_A_M_2', domain: 'sleep', tier: 'advanced', timing: 'morning',
    text: 'How rested do you feel right now?',
    responseType: 'single_choice', required: true,
    options: [
      opt('very_rested', 0), opt('rested', 1), opt('okay', 2),
      opt('tired', 3, 2), opt('exhausted', 4, 3),
    ],
  },
  {
    id: 'Q_A_M_3', domain: 'sleep', tier: 'advanced', timing: 'morning',
    text: 'What made sleep worse?',
    responseType: 'multi_choice', required: false,
    options: [
      { id: 'nothing_made_it_worse', label: 'Nothing made it worse', score: 0 },
      opt('pain', 2), opt('stress_worry', 2), opt('bathroom', 1),
      opt('noise', 2), opt('light', 1), opt('heat_cold', 2),
      opt('phone_screen', 1), opt('alcohol_cannabis_substances', 3),
      opt('child_pet_caregiving', 1), opt('other', 1),
    ],
  },
  {
    id: 'Q_A_M_4', domain: 'pain', tier: 'advanced', timing: 'morning',
    text: 'Do you have pain right now?',
    responseType: 'single_choice', required: true,
    options: [
      opt('no_pain', 0), opt('mild_pain', 1), opt('moderate_pain', 2, 2),
      opt('severe_pain', 3, 3), opt('very_severe_pain', 4, 4),
    ],
  },
  {
    id: 'Q_A_M_5', domain: 'pain', tier: 'advanced', timing: 'morning',
    text: 'Is this pain different from your usual pain?',
    responseType: 'single_choice', required: false,
    options: [
      opt('no_pain', 0), opt('same_as_usual', 0), opt('a_little_different', 2),
      opt('very_different', 3, 3), opt('new_pain', 3, 3),
    ],
  },
  {
    id: 'Q_A_M_6', domain: 'pain', tier: 'advanced', timing: 'morning',
    text: 'Where is the pain?',
    responseType: 'multi_choice', required: false,
    options: [
      { id: 'no_pain', label: 'No pain', score: 0 },
      opt('head_face', 2), opt('neck_shoulders', 2), opt('chest', 4, 4),
      opt('stomach_abdomen', 2), opt('back', 2), opt('arms_hands', 2),
      opt('hips_legs_feet', 2), opt('joints', 2), opt('whole_body', 3), opt('other', 2),
    ],
  },
  {
    id: 'Q_A_M_7', domain: 'pain', tier: 'advanced', timing: 'morning',
    text: 'Do you have any symptoms right now besides pain?',
    responseType: 'multi_choice', required: false,
    options: [
      { id: 'no_other_symptoms', label: 'No other symptoms', score: 0 },
      opt('fever_chills', 3), opt('cough', 2), opt('trouble_breathing', 4, 4),
      opt('dizziness', 3), opt('nausea_vomiting', 3), opt('diarrhea', 2),
      opt('constipation', 1), opt('headache', 2), opt('fatigue', 2),
      opt('skin_issue', 2), opt('other', 2),
    ],
  },
  {
    id: 'Q_A_M_8', domain: 'mental_health', tier: 'advanced', timing: 'morning',
    text: 'How much sadness, emptiness, or hopelessness do you feel right now?',
    responseType: 'single_choice', required: true,
    options: [
      opt('none', 0), opt('mild', 1), opt('moderate', 2, 2),
      opt('severe', 3, 3), opt('very_severe', 4, 4),
    ],
  },
  {
    id: 'Q_A_M_9', domain: 'mental_health', tier: 'advanced', timing: 'morning',
    text: 'How much worry, stress, or panic do you feel right now?',
    responseType: 'single_choice', required: true,
    options: [
      opt('none', 0), opt('mild', 1), opt('moderate', 2, 2),
      opt('severe', 3, 3), opt('very_severe', 4, 3),
    ],
  },
  {
    id: 'Q_A_M_10', domain: 'activity', tier: 'advanced', timing: 'morning',
    text: 'How hard does it feel to start your day?',
    examples: ['getting out of bed', 'hygiene', 'eating', 'school/work', 'errands'],
    responseType: 'single_choice', required: true,
    options: [
      opt('not_hard', 0), opt('a_little_hard', 1), opt('somewhat_hard', 2),
      opt('very_hard', 3, 3), opt('unable_to_start', 4, 4),
    ],
  },
  {
    id: 'Q_A_M_11', domain: 'medication', tier: 'advanced', timing: 'morning',
    text: 'Do you need to take medication this morning?',
    responseType: 'single_choice', required: true,
    options: [
      opt('no', 0), opt('yes_and_i_took_it', 0), opt('yes_but_not_yet', 1),
      opt('yes_but_i_missed_it', 3, 3), opt('not_sure', 3, 3),
    ],
  },
  {
    id: 'Q_A_M_12', domain: 'medication', tier: 'advanced', timing: 'morning',
    text: 'Is anything making medication difficult today?',
    responseType: 'multi_choice', required: false,
    options: [
      opt('no_issue', 0), opt('forgot', 2), opt('side_effects', 3),
      opt('ran_out', 3), opt('cost', 3), opt('instructions_unclear', 3),
      opt('do_not_want_to_take_it', 3), opt('other', 2),
    ],
  },
  {
    id: 'Q_A_M_13', domain: 'environment', tier: 'advanced', timing: 'morning',
    text: 'Is anything around you making your health worse right now?',
    responseType: 'multi_choice', required: false,
    options: [
      opt('no_issue', 0), opt('smoke_bad_air_smell', 3), opt('noise', 2),
      { id: 'heat', label: 'Heat', score: 2 }, { id: 'cold', label: 'Cold', score: 2 },
      opt('mold_dust_allergens', 3), opt('unsafe_place', 4, 4), opt('crowding', 2),
      opt('work_school_pressure', 2), opt('conflict_at_home', 3), opt('other', 2),
    ],
  },
  {
    id: 'Q_A_M_14', domain: 'activity', tier: 'advanced', timing: 'morning',
    text: 'What is most likely to make today difficult?',
    responseType: 'multi_choice', required: false, maxSelect: 2,
    options: [
      opt('nothing_specific', 0), opt('pain', 2), opt('low_mood', 3),
      opt('anxiety_stress', 3), opt('low_energy', 2), opt('symptoms', 3),
      opt('medication_issue', 3), opt('work_school', 2), opt('family_social_issue', 2),
      opt('environment', 2), opt('food_issue', 3), opt('other', 2),
    ],
  },
]

// ─── ADVANCED NIGHT ───────────────────────────────────────────────────────────

const ADVANCED_NIGHT: Question[] = [
  {
    id: 'Q_A_N_1', domain: 'pain', tier: 'advanced', timing: 'night',
    text: 'What was your worst pain today?',
    responseType: 'single_choice', required: true,
    options: [
      opt('no_pain', 0), opt('mild_pain', 1), opt('moderate_pain', 2, 2),
      opt('severe_pain', 3, 3), opt('very_severe_pain', 4, 4),
    ],
  },
  {
    id: 'Q_A_N_2', domain: 'pain', tier: 'advanced', timing: 'night',
    text: 'Did pain stop you from doing normal activities today?',
    examples: ['walking', 'school/work', 'chores', 'sleep', 'social plans'],
    responseType: 'single_choice', required: true,
    options: [
      opt('not_at_all', 0), opt('a_little', 1), opt('some', 2),
      opt('a_lot', 3, 3), opt('very_much', 4, 4),
    ],
  },
  {
    id: 'Q_A_N_3', domain: 'pain', tier: 'advanced', timing: 'night',
    text: 'What helped your pain today?',
    responseType: 'multi_choice', required: false,
    options: [
      opt('had_no_pain', 0), opt('rest', 0), opt('movement_stretching', 0),
      opt('medication', 0), opt('heat_ice', 0), opt('food_water', 0),
      opt('sleep', 0), opt('breathing_relaxation', 0),
      opt('nothing_helped', 3), opt('other', 0),
    ],
  },
  {
    id: 'Q_A_N_4', domain: 'mental_health', tier: 'advanced', timing: 'night',
    text: 'How much sadness, emptiness, or hopelessness did you feel today?',
    responseType: 'single_choice', required: true,
    options: [
      opt('none', 0), opt('mild', 1), opt('moderate', 2, 2),
      opt('severe', 3, 3), opt('very_severe', 4, 4),
    ],
  },
  {
    id: 'Q_A_N_5', domain: 'mental_health', tier: 'advanced', timing: 'night',
    text: 'How much worry, stress, or panic did you feel today?',
    responseType: 'single_choice', required: true,
    options: [
      opt('none', 0), opt('mild', 1), opt('moderate', 2, 2),
      opt('severe', 3, 3), opt('very_severe', 4, 4),
    ],
  },
  {
    id: 'Q_A_N_6', domain: 'mental_health', tier: 'advanced', timing: 'night',
    text: 'Did mood or anxiety stop you from doing normal activities today?',
    examples: ['school/work', 'hygiene', 'eating', 'chores', 'talking to people'],
    responseType: 'single_choice', required: true,
    options: [
      opt('not_at_all', 0), opt('a_little', 1), opt('some', 2),
      opt('a_lot', 3, 3), opt('very_much', 4, 4),
    ],
  },
  {
    id: 'Q_A_N_7', domain: 'mental_health', tier: 'advanced', timing: 'night',
    text: 'Did you enjoy anything today?',
    examples: ['food', 'music', 'hobby', 'conversation', 'rest', 'entertainment'],
    responseType: 'single_choice', required: true,
    options: [
      opt('yes_many_things', 0), opt('yes_one_two_things', 1), opt('a_little', 2),
      opt('not_much', 3), opt('not_at_all', 4),
    ],
  },
  {
    id: 'Q_A_N_8', domain: 'social', tier: 'advanced', timing: 'night',
    text: 'Did you feel alone or unsupported today?',
    responseType: 'single_choice', required: true,
    options: [
      opt('not_at_all', 0), opt('a_little', 1), opt('some', 2),
      opt('a_lot', 3, 3), opt('very_much', 4, 4),
    ],
  },
  {
    id: 'Q_A_N_9', domain: 'social', tier: 'advanced', timing: 'night',
    text: 'Did conflict with another person affect your health today?',
    examples: ['family', 'partner', 'friend', 'coworker', 'classmate'],
    responseType: 'single_choice', required: true,
    options: [
      opt('not_at_all', 0), opt('a_little', 1), opt('some', 2),
      opt('a_lot', 3, 3), opt('very_much', 4, 4),
    ],
  },
  {
    id: 'Q_A_N_10', domain: 'social', tier: 'advanced', timing: 'night',
    text: 'Did you avoid people today because of mood, pain, stress, or low energy?',
    responseType: 'single_choice', required: true,
    options: [
      opt('no', 0), opt('a_little', 1), opt('some', 2), opt('a_lot', 3),
      { id: 'completely_avoided_people', label: 'Completely avoided people', score: 4 },
    ],
  },
  {
    id: 'Q_A_N_11', domain: 'lifestyle', tier: 'advanced', timing: 'night',
    text: 'Did you smoke or vape today?',
    responseType: 'single_choice', required: true,
    options: [
      opt('no', 0), opt('yes_less_than_usual', 1), opt('yes_same_as_usual', 2),
      opt('yes_more_than_usual', 3), opt('yes_much_more_than_usual', 4),
    ],
  },
  {
    id: 'Q_A_N_12', domain: 'lifestyle', tier: 'advanced', timing: 'night',
    text: 'Did you drink alcohol today?',
    responseType: 'single_choice', required: true,
    options: [
      opt('no', 0), opt('one_drink', 1), opt('two_drinks', 2),
      opt('three_four_drinks', 3), opt('five_or_more_drinks', 4),
      opt('prefer_not_answer', null),
    ],
  },
  {
    id: 'Q_A_N_13', domain: 'lifestyle', tier: 'advanced', timing: 'night',
    text: 'Did you use cannabis or other substances today?',
    responseType: 'single_choice', required: true,
    options: [
      opt('no', 0), opt('small_amount', 1), opt('moderate_amount', 2),
      opt('large_amount', 3), opt('prefer_not_answer', null),
    ],
  },
  {
    id: 'Q_A_N_14', domain: 'lifestyle', tier: 'advanced', timing: 'night',
    text: 'Did smoking, vaping, alcohol, cannabis, or other substances cause problems today?',
    examples: ['poor sleep', 'anxiety', 'low mood', 'conflict', 'unsafe choices', 'missed work/school'],
    responseType: 'single_choice', required: true,
    options: [
      opt('not_applicable', 0), opt('no', 0), opt('a_little', 1),
      opt('some', 2), opt('a_lot', 3), opt('very_much', 4),
    ],
  },
  {
    id: 'Q_A_N_15', domain: 'diet', tier: 'advanced', timing: 'night',
    text: 'How many meals did you eat today?',
    responseType: 'single_choice', required: true,
    options: [
      { id: 'zero', label: 'Zero', score: 4, flagLevel: 4 },
      { id: 'one', label: 'One', score: 3 },
      { id: 'two', label: 'Two', score: 1 },
      { id: 'three', label: 'Three', score: 0 },
      { id: 'more_than_three', label: 'More than 3', score: 1 },
    ],
  },
  {
    id: 'Q_A_N_16', domain: 'diet', tier: 'advanced', timing: 'night',
    text: 'Did you eat enough food today?',
    responseType: 'single_choice', required: true,
    options: [
      opt('yes_enough', 0), opt('mostly_enough', 1), opt('not_sure', 2),
      opt('not_enough', 3, 3), opt('almost_nothing', 4, 4),
    ],
  },
  {
    id: 'Q_A_N_17', domain: 'diet', tier: 'advanced', timing: 'night',
    text: 'Did your food include helpful foods today?',
    examples: ['protein', 'fruits/vegetables', 'whole grains', 'enough water'],
    responseType: 'single_choice', required: true,
    options: [
      opt('yes', 0), opt('mostly', 1), opt('some', 2),
      opt('very_little', 3), opt('no', 4),
    ],
  },
  {
    id: 'Q_A_N_18', domain: 'diet', tier: 'advanced', timing: 'night',
    text: 'Did eating cause problems today?',
    examples: ['nausea', 'stomach pain', 'overeating', 'binge eating', 'not eating enough', 'loss of appetite'],
    responseType: 'single_choice', required: true,
    options: [
      opt('no', 0), opt('a_little', 1), opt('some', 2),
      opt('a_lot', 3, 3), opt('very_much', 4, 4),
    ],
  },
  {
    id: 'Q_A_N_19', domain: 'environment', tier: 'advanced', timing: 'night',
    text: 'Did your environment make your health worse today?',
    examples: ['smoke', 'noise', 'mold', 'heat', 'cold', 'unsafe place', 'stressful workplace'],
    responseType: 'single_choice', required: true,
    options: [
      opt('no', 0), opt('a_little', 1), opt('some', 2),
      opt('a_lot', 3, 3), opt('very_much', 4, 4),
    ],
  },
  {
    id: 'Q_A_N_20', domain: 'environment', tier: 'advanced', timing: 'night',
    text: 'What environmental issue affected you most today?',
    responseType: 'single_choice', required: false,
    options: [
      opt('no_issue', 0), opt('smoke_bad_air_smell', 3), opt('noise', 2),
      { id: 'heat', label: 'Heat', score: 2 }, { id: 'cold', label: 'Cold', score: 2 },
      opt('mold_dust_allergens', 3), opt('unsafe_place', 4, 4),
      opt('housing_issue', 3), opt('work_school_environment', 2),
      opt('transportation_issue', 2), opt('other', 2),
    ],
  },
  {
    id: 'Q_A_N_21', domain: 'medication', tier: 'advanced', timing: 'night',
    text: 'If you needed medication today, did you take it as planned?',
    responseType: 'single_choice', required: true,
    options: [
      opt('did_not_need_medication', 0), opt('yes', 0), opt('missed_one_dose', 2, 2),
      opt('missed_more_than_one_dose', 3, 3), opt('took_more_than_planned', 4, 4),
      { id: 'stopped_taking_it', label: 'Stopped taking it', score: 4, flagLevel: 4 },
      opt('not_sure', 3, 3),
    ],
  },
  {
    id: 'Q_A_N_22', domain: 'medication', tier: 'advanced', timing: 'night',
    text: 'Did medication side effects bother you today?',
    responseType: 'single_choice', required: true,
    options: [
      opt('do_not_take_medication', 0), opt('no', 0), opt('mildly', 1),
      opt('moderately', 2), opt('severely', 3, 3), opt('very_severely', 4, 4),
    ],
  },
  {
    id: 'Q_A_N_23', domain: 'medication', tier: 'advanced', timing: 'night',
    text: 'Do you need help with medication?',
    responseType: 'single_choice', required: false,
    options: [
      opt('no', 0), opt('refill_needed', 2), opt('cost', 3),
      opt('side_effects', 3), opt('instructions_unclear', 3),
      opt('do_not_want_to_take_it', 3), opt('other', 2),
    ],
  },
  {
    id: 'Q_A_N_24', domain: 'activity', tier: 'advanced', timing: 'night',
    text: 'How much did you move your body today?',
    examples: ['walking', 'stretching', 'exercise', 'chores', 'physical work'],
    responseType: 'single_choice', required: true,
    options: [
      { id: 'a_lot', label: 'A lot', score: 0 },
      { id: 'moderate_amount', label: 'Moderate amount', score: 1 },
      { id: 'a_little', label: 'A little', score: 2 },
      { id: 'very_little', label: 'Very little', score: 3, flagLevel: 2 },
      { id: 'almost_none', label: 'Almost none', score: 4, flagLevel: 3 },
    ],
  },
  {
    id: 'Q_A_N_25', domain: 'activity', tier: 'advanced', timing: 'night',
    text: 'What stopped you from being active today?',
    responseType: 'multi_choice', required: false,
    options: [
      opt('nothing_stopped_me', 0), opt('pain', 2), opt('low_energy', 2),
      opt('low_mood', 3), opt('anxiety_stress', 3), opt('symptoms', 3),
      opt('no_time', 1), opt('weather', 1), opt('unsafe_place', 4, 4),
      opt('no_access_equipment', 2), opt('other', 2),
    ],
  },
  {
    id: 'Q_A_N_26', domain: 'activity', tier: 'advanced', timing: 'night',
    text: 'How much time did you spend sitting or lying down while awake?',
    responseType: 'single_choice', required: true,
    options: [
      { id: 'very_little', label: 'Very little', score: 0 },
      opt('some_of_the_day', 1), opt('about_half_the_day', 2),
      opt('most_of_the_day', 3), opt('almost_all_day', 4),
    ],
  },
]

// ─── ADVANCED WEEKLY ──────────────────────────────────────────────────────────

const ADVANCED_WEEKLY: Question[] = [
  {
    id: 'Q_A_W_1', domain: 'pain', tier: 'advanced', timing: 'weekly',
    text: 'In the past 7 days, how many days did you have pain?',
    responseType: 'single_choice', required: true,
    options: [
      opt('zero_days', 0), opt('one_two_days', 1), opt('three_four_days', 2),
      opt('five_six_days', 3), opt('seven_days', 4),
    ],
  },
  {
    id: 'Q_A_W_2', domain: 'pain', tier: 'advanced', timing: 'weekly',
    text: 'In the past 7 days, what was your average pain level?',
    responseType: 'single_choice', required: true,
    options: [
      opt('no_pain', 0), opt('mild_pain', 1), opt('moderate_pain', 2, 2),
      opt('severe_pain', 3, 3), opt('very_severe_pain', 4, 4),
    ],
  },
  {
    id: 'Q_A_W_3', domain: 'pain', tier: 'advanced', timing: 'weekly',
    text: 'In the past 7 days, how often did pain affect sleep?',
    responseType: 'single_choice', required: true,
    options: [
      opt('never', 0), opt('once', 1), opt('two_three_nights', 2),
      opt('most_nights', 3), opt('every_night', 4),
    ],
  },
  {
    id: 'Q_A_W_4', domain: 'pain', tier: 'advanced', timing: 'weekly',
    text: 'In the past 7 days, how often did pain stop normal activities?',
    responseType: 'single_choice', required: true,
    options: [
      opt('never', 0), opt('once', 1), { id: 'two_three_days', label: '2-3 days', score: 2 },
      opt('most_days', 3), opt('every_day', 4),
    ],
  },
  {
    id: 'Q_A_W_5', domain: 'mental_health', tier: 'advanced', timing: 'weekly',
    text: 'In the past 7 days, how often did you feel sad, empty, or hopeless?',
    responseType: 'single_choice', required: true,
    options: [
      opt('never', 0), opt('once', 1), { id: 'two_three_days', label: '2-3 days', score: 2 },
      opt('most_days', 3), opt('every_day', 4),
    ],
  },
  {
    id: 'Q_A_W_6', domain: 'mental_health', tier: 'advanced', timing: 'weekly',
    text: 'In the past 7 days, how often did you feel worried, tense, or panicked?',
    responseType: 'single_choice', required: true,
    options: [
      opt('never', 0), opt('once', 1), { id: 'two_three_days', label: '2-3 days', score: 2 },
      opt('most_days', 3), opt('every_day', 4),
    ],
  },
  {
    id: 'Q_A_W_7', domain: 'mental_health', tier: 'advanced', timing: 'weekly',
    text: 'In the past 7 days, how often did you feel unable to control your emotions?',
    examples: ['crying', 'anger', 'panic', 'shutting down', 'numbness'],
    responseType: 'single_choice', required: true,
    options: [
      opt('never', 0), opt('once', 1), { id: 'two_three_days', label: '2-3 days', score: 2 },
      opt('most_days', 3), opt('every_day', 4),
    ],
  },
  {
    id: 'Q_A_W_8', domain: 'mental_health', tier: 'advanced', timing: 'weekly',
    text: 'In the past 7 days, how often did mood or anxiety stop normal activities?',
    examples: ['school/work', 'hygiene', 'eating', 'chores', 'talking to people'],
    responseType: 'single_choice', required: true,
    options: [
      opt('never', 0), opt('once', 1), { id: 'two_three_days', label: '2-3 days', score: 2 },
      opt('most_days', 3), opt('every_day', 4),
    ],
  },
  {
    id: 'Q_A_W_9', domain: 'social', tier: 'advanced', timing: 'weekly',
    text: 'In the past 7 days, how often did you feel alone or unsupported?',
    responseType: 'single_choice', required: true,
    options: [
      opt('never', 0), opt('once', 1), { id: 'two_three_days', label: '2-3 days', score: 2 },
      opt('most_days', 3), opt('every_day', 4),
    ],
  },
  {
    id: 'Q_A_W_10', domain: 'social', tier: 'advanced', timing: 'weekly',
    text: 'In the past 7 days, how often did conflict with another person affect your health?',
    responseType: 'single_choice', required: true,
    options: [
      opt('never', 0), opt('once', 1), opt('two_three_times', 2),
      opt('most_days', 3), opt('every_day', 4),
    ],
  },
  {
    id: 'Q_A_W_11', domain: 'social', tier: 'advanced', timing: 'weekly',
    text: 'In the past 7 days, how often did you avoid people because of mood, stress, pain, or low energy?',
    responseType: 'single_choice', required: true,
    options: [
      opt('never', 0), opt('once', 1), { id: 'two_three_days', label: '2-3 days', score: 2 },
      opt('most_days', 3), opt('every_day', 4),
    ],
  },
  {
    id: 'Q_A_W_12', domain: 'lifestyle', tier: 'advanced', timing: 'weekly',
    text: 'In the past 7 days, how often did work, school, or home responsibilities feel like too much?',
    responseType: 'single_choice', required: true,
    options: [
      opt('never', 0), opt('once', 1), { id: 'two_three_days', label: '2-3 days', score: 2 },
      opt('most_days', 3), opt('every_day', 4),
    ],
  },
  {
    id: 'Q_A_W_13', domain: 'lifestyle', tier: 'advanced', timing: 'weekly',
    text: 'In the past 7 days, how many days did you smoke or vape?',
    responseType: 'single_choice', required: true,
    options: [
      opt('zero_days', 0), opt('one_two_days', 1), opt('three_four_days', 2),
      opt('five_six_days', 3), opt('seven_days', 4),
    ],
  },
  {
    id: 'Q_A_W_14', domain: 'lifestyle', tier: 'advanced', timing: 'weekly',
    text: 'In the past 7 days, how many days did you drink alcohol?',
    responseType: 'single_choice', required: true,
    options: [
      opt('zero_days', 0), opt('one_two_days', 1), opt('three_four_days', 2),
      opt('five_six_days', 3), opt('seven_days', 4),
    ],
  },
  {
    id: 'Q_A_W_15', domain: 'lifestyle', tier: 'advanced', timing: 'weekly',
    text: 'In the past 7 days, how many days did you use cannabis or other substances?',
    responseType: 'single_choice', required: true,
    options: [
      opt('zero_days', 0), opt('one_two_days', 1), opt('three_four_days', 2),
      opt('five_six_days', 3), opt('seven_days', 4),
      opt('prefer_not_answer', null),
    ],
  },
  {
    id: 'Q_A_W_16', domain: 'lifestyle', tier: 'advanced', timing: 'weekly',
    text: 'In the past 7 days, did smoking, vaping, alcohol, cannabis, or other substances cause problems?',
    examples: ['poor sleep', 'anxiety', 'low mood', 'conflict', 'unsafe choices', 'missed work/school'],
    responseType: 'single_choice', required: true,
    options: [
      opt('no', 0), opt('a_little', 1), opt('some', 2),
      opt('a_lot', 3), opt('very_much', 4),
      opt('prefer_not_answer', null),
    ],
  },
  {
    id: 'Q_A_W_17', domain: 'diet', tier: 'advanced', timing: 'weekly',
    text: 'In the past 7 days, how many days did you eat enough food?',
    responseType: 'single_choice', required: true,
    options: [
      opt('seven_days', 0), opt('five_six_days', 1), opt('three_four_days', 2),
      opt('one_two_days', 3), opt('zero_days', 4),
    ],
  },
  {
    id: 'Q_A_W_18', domain: 'diet', tier: 'advanced', timing: 'weekly',
    text: 'In the past 7 days, how many days did you eat protein foods?',
    examples: ['meat', 'fish', 'eggs', 'beans', 'tofu', 'dairy', 'lentils', 'protein drinks'],
    responseType: 'single_choice', required: true,
    options: [
      opt('seven_days', 0), opt('five_six_days', 1), opt('three_four_days', 2),
      opt('one_two_days', 3), opt('zero_days', 4),
      { id: 'not_sure', label: 'Not sure', score: 2 },
    ],
  },
  {
    id: 'Q_A_W_19', domain: 'diet', tier: 'advanced', timing: 'weekly',
    text: 'In the past 7 days, how many days did you eat fruits or vegetables?',
    responseType: 'single_choice', required: true,
    options: [
      opt('seven_days', 0), opt('five_six_days', 1), opt('three_four_days', 2),
      opt('one_two_days', 3), opt('zero_days', 4),
    ],
  },
  {
    id: 'Q_A_W_20', domain: 'diet', tier: 'advanced', timing: 'weekly',
    text: 'In the past 7 days, was it hard to get enough food?',
    examples: ['cost', 'transportation', 'low appetite', 'nausea', 'no time', 'no access'],
    responseType: 'single_choice', required: true,
    options: [
      opt('no', 0), opt('a_little', 1), opt('some', 2),
      opt('a_lot', 3), { id: 'very_hard', label: 'Very hard', score: 4 },
    ],
  },
  {
    id: 'Q_A_W_21', domain: 'environment', tier: 'advanced', timing: 'weekly',
    text: 'In the past 7 days, how often did your home environment make your health worse?',
    examples: ['smoke', 'noise', 'heat/cold', 'mold', 'dust', 'unsafe place'],
    responseType: 'single_choice', required: true,
    options: [
      opt('never', 0), opt('once', 1), { id: 'two_three_days', label: '2-3 days', score: 2 },
      opt('most_days', 3), opt('every_day', 4),
    ],
  },
  {
    id: 'Q_A_W_22', domain: 'environment', tier: 'advanced', timing: 'weekly',
    text: 'In the past 7 days, how often did your work or school environment make your health worse?',
    responseType: 'single_choice', required: true,
    options: [
      opt('not_applicable', 0), opt('never', 0), opt('once', 1),
      { id: 'two_three_days', label: '2-3 days', score: 2 },
      opt('most_days', 3), opt('every_day', 4),
    ],
  },
  {
    id: 'Q_A_W_23', domain: 'safety', tier: 'advanced', timing: 'weekly',
    text: 'In the past 7 days, how often did you feel unsafe at home, work, school, or outside?',
    responseType: 'single_choice', required: true,
    options: [
      opt('never', 0), opt('once', 1), opt('two_three_times', 2),
      opt('most_days', 3), opt('every_day', 4),
    ],
  },
  {
    id: 'Q_A_W_24', domain: 'medication', tier: 'advanced', timing: 'weekly',
    text: 'In the past 7 days, how many days did you take medication exactly as planned?',
    responseType: 'single_choice', required: true,
    options: [
      opt('do_not_take_medication', 0), opt('seven_days', 0), opt('five_six_days', 1),
      opt('three_four_days', 2), opt('one_two_days', 3), opt('zero_days', 4),
    ],
  },
  {
    id: 'Q_A_W_25', domain: 'medication', tier: 'advanced', timing: 'weekly',
    text: 'In the past 7 days, what made medication hard?',
    responseType: 'multi_choice', required: false,
    options: [
      opt('do_not_take_medication', 0), opt('nothing_made_it_hard', 0),
      opt('forgot', 2), opt('side_effects', 3), opt('cost', 3),
      opt('ran_out', 3), opt('instructions_unclear', 3), opt('too_many_pills', 2),
      opt('chose_not_to_take', 3), opt('other', 2),
    ],
  },
  {
    id: 'Q_A_W_26', domain: 'medication', tier: 'advanced', timing: 'weekly',
    text: 'In the past 7 days, did medication side effects affect your life?',
    responseType: 'single_choice', required: true,
    options: [
      opt('do_not_take_medication', 0), opt('no', 0), opt('a_little', 1),
      opt('some', 2), opt('a_lot', 3), opt('very_much', 4),
    ],
  },
  {
    id: 'Q_A_W_27', domain: 'activity', tier: 'advanced', timing: 'weekly',
    text: 'In the past 7 days, how many days did you move your body for at least 10 minutes?',
    examples: ['walking', 'stretching', 'exercise', 'sports', 'chores'],
    responseType: 'single_choice', required: true,
    options: [
      opt('seven_days', 0), opt('five_six_days', 1), opt('three_four_days', 2),
      opt('one_two_days', 3), opt('zero_days', 4),
    ],
  },
  {
    id: 'Q_A_W_28', domain: 'activity', tier: 'advanced', timing: 'weekly',
    text: 'In the past 7 days, how many days did symptoms stop you from being active?',
    examples: ['pain', 'tiredness', 'breathing', 'low mood', 'anxiety'],
    responseType: 'single_choice', required: true,
    options: [
      opt('zero_days', 0), opt('one_two_days', 1), opt('three_four_days', 2),
      opt('five_six_days', 3), opt('seven_days', 4),
    ],
  },
  {
    id: 'Q_A_W_29', domain: 'activity', tier: 'advanced', timing: 'weekly',
    text: 'In the past 7 days, how often did you have trouble with normal physical tasks?',
    examples: ['stairs', 'walking', 'carrying things', 'chores', 'showering'],
    responseType: 'single_choice', required: true,
    options: [
      opt('never', 0), opt('once', 1), { id: 'two_three_days', label: '2-3 days', score: 2 },
      opt('most_days', 3), opt('every_day', 4),
    ],
  },
]

export const ALL_QUESTIONS: Question[] = [
  ...BEGINNER_MORNING,
  ...BEGINNER_NIGHT,
  ...BEGINNER_WEEKLY,
  ...INTERMEDIATE_MORNING,
  ...INTERMEDIATE_NIGHT,
  ...INTERMEDIATE_WEEKLY,
  ...ADVANCED_MORNING,
  ...ADVANCED_NIGHT,
  ...ADVANCED_WEEKLY,
]
