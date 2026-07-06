import type { Question } from './types'

export const FOLLOW_UP_QUESTIONS: Question[] = [
  // Pain follow-ups
  {
    id: 'Q_FU_P_1', domain: 'pain', tier: 'all', timing: 'triggered',
    followUpOnly: true,
    text: 'Where is the pain located?',
    responseType: 'multi_choice', required: true,
    options: [
      { id: 'head_face', label: 'Head or face', score: 2 },
      { id: 'neck_shoulders', label: 'Neck or shoulders', score: 2 },
      { id: 'chest', label: 'Chest', score: 4, flagLevel: 4 },
      { id: 'stomach_abdomen', label: 'Stomach or abdomen', score: 2 },
      { id: 'back', label: 'Back', score: 2 },
      { id: 'arms_hands', label: 'Arms or hands', score: 2 },
      { id: 'hips_legs_feet', label: 'Hips, legs, or feet', score: 2 },
      { id: 'joints', label: 'Joints', score: 2 },
      { id: 'whole_body', label: 'Whole body', score: 3 },
      { id: 'other', label: 'Other', score: 2 },
    ],
  },
  {
    id: 'Q_FU_P_2', domain: 'pain', tier: 'all', timing: 'triggered',
    followUpOnly: true,
    text: 'Is this pain new or different from your usual pain?',
    responseType: 'single_choice', required: true,
    options: [
      { id: 'no_same_as_usual', label: 'No, same as usual', score: 0 },
      { id: 'a_little_different', label: 'A little different', score: 1 },
      { id: 'very_different', label: 'Very different', score: 3, flagLevel: 3 },
      { id: 'completely_new', label: 'Completely new pain', score: 3, flagLevel: 3 },
    ],
  },
  {
    id: 'Q_FU_P_3', domain: 'pain', tier: 'all', timing: 'triggered',
    followUpOnly: true,
    text: 'How long have you had this pain?',
    responseType: 'single_choice', required: true,
    options: [
      { id: 'started_today', label: 'Started today', score: 3 },
      { id: 'a_few_days', label: 'A few days', score: 2 },
      { id: 'about_a_week', label: 'About a week', score: 1 },
      { id: 'more_than_two_weeks', label: 'More than 2 weeks', score: 2 },
      { id: 'ongoing_chronic', label: 'Ongoing / chronic', score: 0 },
    ],
  },

  // Mental health follow-ups
  {
    id: 'Q_FU_MH_1', domain: 'mental_health', tier: 'all', timing: 'triggered',
    followUpOnly: true,
    text: 'Have you had any thoughts of hurting yourself or not wanting to be alive?',
    responseType: 'single_choice', required: true,
    options: [
      { id: 'no', label: 'No', score: 0 },
      { id: 'brief_passing_thought', label: 'A brief passing thought, but I would not act on it', score: 2, flagLevel: 2 },
      { id: 'thoughts_more_than_once', label: 'Thoughts more than once', score: 3, flagLevel: 3 },
      { id: 'thoughts_with_plan', label: 'I have thought about how I would do it', score: 4, flagLevel: 4 },
      { id: 'prefer_not_answer', label: 'Prefer not to answer', score: null },
    ],
  },
  {
    id: 'Q_FU_MH_2', domain: 'mental_health', tier: 'all', timing: 'triggered',
    followUpOnly: true,
    text: 'Is there someone safe you can contact right now?',
    responseType: 'single_choice', required: true,
    options: [
      { id: 'yes_now', label: 'Yes, I can contact them now', score: 0 },
      { id: 'yes_but_not_now', label: 'Yes, but I am not ready to reach out', score: 2 },
      { id: 'no', label: 'No', score: 4, flagLevel: 4 },
      { id: 'not_sure', label: 'Not sure', score: 3 },
    ],
  },
  {
    id: 'Q_FU_MH_3', domain: 'mental_health', tier: 'all', timing: 'triggered',
    followUpOnly: true,
    text: 'How long have you felt this way?',
    responseType: 'single_choice', required: true,
    options: [
      { id: 'just_today', label: 'Just today', score: 2 },
      { id: 'a_few_days', label: 'A few days', score: 2 },
      { id: 'about_a_week', label: 'About a week', score: 3 },
      { id: 'more_than_two_weeks', label: 'More than 2 weeks', score: 4 },
      { id: 'longer', label: 'Longer than that', score: 4 },
    ],
  },
  {
    id: 'Q_FU_MH_4', domain: 'mental_health', tier: 'all', timing: 'triggered',
    followUpOnly: true,
    text: 'Did anything specific cause this feeling today?',
    responseType: 'single_choice', required: false,
    options: [
      { id: 'nothing_specific', label: 'Nothing specific', score: 2 },
      { id: 'pain', label: 'Pain', score: 2 },
      { id: 'news_event', label: 'News or event', score: 1 },
      { id: 'conflict_relationship', label: 'Conflict or relationship issue', score: 2 },
      { id: 'work_school', label: 'Work or school', score: 1 },
      { id: 'health_concern', label: 'Health concern', score: 2 },
      { id: 'other', label: 'Other', score: 1 },
    ],
  },

  // Safety follow-ups
  {
    id: 'Q_FU_S_1', domain: 'safety', tier: 'all', timing: 'triggered',
    followUpOnly: true,
    text: 'What made you feel unsafe?',
    responseType: 'multi_choice', required: false,
    options: [
      { id: 'person_at_home', label: 'A person at home', score: 4, flagLevel: 4 },
      { id: 'neighborhood_area', label: 'Neighborhood or area', score: 3 },
      { id: 'work_school_person', label: 'Someone at work or school', score: 3 },
      { id: 'online_threats', label: 'Online threats or harassment', score: 3 },
      { id: 'physical_environment', label: 'Physical environment (traffic, weather)', score: 2 },
      { id: 'own_health_symptoms', label: 'My own health or symptoms', score: 2 },
      { id: 'other', label: 'Other', score: 2 },
    ],
  },
  {
    id: 'Q_FU_S_2', domain: 'safety', tier: 'all', timing: 'triggered',
    followUpOnly: true,
    text: 'Are you currently in a safe place?',
    responseType: 'single_choice', required: true,
    options: [
      { id: 'yes_safe', label: 'Yes, I am safe', score: 0 },
      { id: 'mostly_safe', label: 'Mostly safe', score: 1 },
      { id: 'not_sure', label: 'Not sure', score: 2 },
      { id: 'no', label: 'No, I do not feel safe', score: 4, flagLevel: 4 },
    ],
  },

  // Social follow-ups
  {
    id: 'Q_FU_SOC_1', domain: 'social', tier: 'all', timing: 'triggered',
    followUpOnly: true,
    text: 'What contributed to feeling alone or unsupported?',
    responseType: 'multi_choice', required: false,
    options: [
      { id: 'no_one_to_talk_to', label: 'No one to talk to', score: 3 },
      { id: 'wanted_support_but_did_not_get_it', label: 'Wanted support but did not get it', score: 3 },
      { id: 'avoided_people', label: 'Avoided people', score: 2 },
      { id: 'conflict_with_someone', label: 'Conflict with someone', score: 3 },
      { id: 'felt_unsafe_with_someone', label: 'Felt unsafe with someone', score: 4, flagLevel: 4 },
      { id: 'chose_to_be_alone_and_felt_okay', label: 'Chose to be alone and felt okay', score: 0 },
      { id: 'other', label: 'Other', score: 1 },
    ],
  },

  // Diet follow-ups
  {
    id: 'Q_FU_D_1', domain: 'diet', tier: 'all', timing: 'triggered',
    followUpOnly: true,
    text: 'What made it hard to eat enough today?',
    responseType: 'multi_choice', required: false,
    options: [
      { id: 'no_food_available', label: 'No food available', score: 4, flagLevel: 3 },
      { id: 'no_money', label: 'No money for food', score: 4, flagLevel: 3 },
      { id: 'low_appetite', label: 'Low appetite', score: 2 },
      { id: 'nausea_stomach_issue', label: 'Nausea or stomach issue', score: 2 },
      { id: 'stress_mood', label: 'Stress or mood', score: 2 },
      { id: 'trouble_preparing_food', label: 'Trouble preparing food', score: 3 },
      { id: 'body_image_food_guilt', label: 'Body image or food guilt', score: 3 },
      { id: 'other', label: 'Other', score: 1 },
    ],
  },

  // Medication follow-ups
  {
    id: 'Q_FU_MED_1', domain: 'medication', tier: 'all', timing: 'triggered',
    followUpOnly: true,
    text: 'Why did you miss or change your medication?',
    responseType: 'multi_choice', required: false,
    options: [
      { id: 'forgot', label: 'Forgot', score: 1 },
      { id: 'side_effects', label: 'Side effects', score: 3 },
      { id: 'ran_out', label: 'Ran out', score: 3, flagLevel: 3 },
      { id: 'cost', label: 'Cost', score: 3, flagLevel: 3 },
      { id: 'instructions_unclear', label: 'Instructions unclear', score: 2 },
      { id: 'chose_not_to_take_it', label: 'Chose not to take it', score: 3 },
      { id: 'felt_better', label: 'Felt better and thought I did not need it', score: 2 },
      { id: 'felt_worse', label: 'Felt worse after taking it', score: 3 },
      { id: 'other', label: 'Other', score: 1 },
    ],
  },
  {
    id: 'Q_FU_MED_2', domain: 'medication', tier: 'all', timing: 'triggered',
    followUpOnly: true,
    text: 'Which medications did you miss or take differently?',
    responseType: 'text_optional', required: false,
    options: [],
  },

  // Substance follow-ups
  {
    id: 'Q_FU_SUB_1', domain: 'lifestyle', tier: 'all', timing: 'triggered',
    followUpOnly: true,
    text: 'Which substance or substances affected your day?',
    responseType: 'multi_choice', required: false,
    options: [
      { id: 'smoking_vaping', label: 'Smoking or vaping', score: 2 },
      { id: 'alcohol', label: 'Alcohol', score: 2 },
      { id: 'cannabis', label: 'Cannabis', score: 2 },
      { id: 'prescription_medication_not_as_prescribed', label: 'Prescription medication (not as prescribed)', score: 3 },
      { id: 'other_substances', label: 'Other substances', score: 3 },
    ],
  },
  {
    id: 'Q_FU_SUB_2', domain: 'lifestyle', tier: 'all', timing: 'triggered',
    followUpOnly: true,
    text: 'How did substance use affect your day?',
    responseType: 'multi_choice', required: false,
    options: [
      { id: 'sleep', label: 'Sleep', score: 2 },
      { id: 'mood', label: 'Mood', score: 2 },
      { id: 'pain', label: 'Pain', score: 2 },
      { id: 'anxiety', label: 'Anxiety', score: 2 },
      { id: 'eating', label: 'Eating', score: 2 },
      { id: 'relationships', label: 'Relationships', score: 3 },
      { id: 'work_school', label: 'Work or school', score: 3 },
      { id: 'money', label: 'Money', score: 3 },
      { id: 'driving_safety', label: 'Driving or safety', score: 4, flagLevel: 4 },
      { id: 'do_not_know', label: 'Do not know', score: 1 },
      { id: 'other', label: 'Other', score: 1 },
    ],
  },

  // Environment follow-ups
  {
    id: 'Q_FU_E_1', domain: 'environment', tier: 'all', timing: 'triggered',
    followUpOnly: true,
    text: 'What is making your environment unsafe or harmful?',
    responseType: 'multi_choice', required: false,
    options: [
      { id: 'smoke_chemicals', label: 'Smoke, chemicals, or strong smells', score: 3 },
      { id: 'mold_dust_allergens', label: 'Mold, dust, or allergens', score: 3 },
      { id: 'extreme_temp', label: 'Extreme heat or cold', score: 3 },
      { id: 'noise', label: 'Noise', score: 2 },
      { id: 'violence_conflict', label: 'Violence or conflict', score: 4, flagLevel: 4 },
      { id: 'housing_instability', label: 'Housing instability or homelessness', score: 4, flagLevel: 4 },
      { id: 'other', label: 'Other', score: 2 },
    ],
  },
  {
    id: 'Q_FU_E_2', domain: 'environment', tier: 'all', timing: 'triggered',
    followUpOnly: true,
    text: 'How long has this environmental issue been affecting you?',
    responseType: 'single_choice', required: false,
    options: [
      { id: 'just_today', label: 'Just today', score: 1 },
      { id: 'a_few_days', label: 'A few days', score: 2 },
      { id: 'a_week_or_more', label: 'A week or more', score: 3 },
      { id: 'ongoing', label: 'Ongoing', score: 4 },
    ],
  },

  // Sleep follow-ups
  {
    id: 'Q_FU_SL_1', domain: 'sleep', tier: 'all', timing: 'triggered',
    followUpOnly: true,
    text: 'What made it hard to sleep?',
    responseType: 'multi_choice', required: false,
    options: [
      { id: 'pain', label: 'Pain', score: 2 },
      { id: 'stress_worry', label: 'Stress or worry', score: 2 },
      { id: 'bathroom', label: 'Bathroom trips', score: 1 },
      { id: 'noise', label: 'Noise', score: 2 },
      { id: 'light', label: 'Light', score: 1 },
      { id: 'heat_cold', label: 'Heat or cold', score: 2 },
      { id: 'racing_thoughts', label: 'Racing thoughts', score: 2 },
      { id: 'alcohol_substances', label: 'Alcohol or substances', score: 3 },
      { id: 'caregiving', label: 'Caregiving responsibilities', score: 1 },
      { id: 'other', label: 'Other', score: 1 },
    ],
  },
]
