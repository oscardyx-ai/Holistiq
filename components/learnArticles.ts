import { TrackedFactor } from '@/components/checkInData'

export interface LearnArticle {
  factor: TrackedFactor
  title: string
  source: string
  url: string
  publishedAt: string
  summary: string
  studyTitle: string
  studyUrl: string
}

const ARTICLE_LIBRARY: Record<TrackedFactor, LearnArticle[]> = {
  Feeling: [
    {
      factor: 'Feeling',
      title: 'Shake it Off',
      source: 'NIH News in Health',
      url: 'https://newsinhealth.nih.gov/2019/01/shake-it-off',
      publishedAt: '2019-01-01',
      summary:
        'A practical look at how sleep, movement, routines, and supportive habits can help lift mood over time.',
      studyTitle:
        'Association of Resistance Exercise Training With Depressive Symptoms: Meta-analysis and Meta-regression Analysis of Randomized Clinical Trials',
      studyUrl:
        'https://jamanetwork.com/journals/jamapsychiatry/fullarticle/2680311',
    },
    {
      factor: 'Feeling',
      title: 'Practicing Gratitude',
      source: 'NIH News in Health',
      url: 'https://newsinhealth.nih.gov/2019/03/practicing-gratitude',
      publishedAt: '2019-03-01',
      summary:
        'Explores how simple gratitude habits may support emotional balance, perspective, and day-to-day resilience.',
      studyTitle: 'A Brief Gratitude Writing Intervention Decreased Stress and Negative Affect During the COVID-19 Pandemic',
      studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/35228834/',
    },
  ],
  Energy: [
    {
      factor: 'Energy',
      title: 'Energy & Fatigue',
      source: 'Harvard Health',
      url: 'https://www.health.harvard.edu/topics/boosting-energy-managing-fatigue',
      publishedAt: '2023-04-12',
      summary:
        'Covers everyday contributors to fatigue and offers gentle habit-level ideas that can support steadier energy.',
      studyTitle: 'The Effect of Chronic Exercise on Energy and Fatigue States: A Systematic Review and Meta-Analysis of Randomized Trials',
      studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/35726269/',
    },
    {
      factor: 'Energy',
      title: 'Physical Activity May Lessen Depression Symptoms',
      source: 'NIH News in Health',
      url: 'https://newsinhealth.nih.gov/2019/03/physical-activity-may-lessen-depression-symptoms',
      publishedAt: '2019-03-01',
      summary:
        'Highlights how regular movement is connected with better mood and more momentum in daily life.',
      studyTitle: 'Health Benefits of Physical Activity: A Systematic Review of Current Systematic Reviews',
      studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/28708630',
    },
  ],
  Sleep: [
    {
      factor: 'Sleep',
      title: 'Sleep hygiene: Simple practices for better rest',
      source: 'Harvard Health',
      url: 'https://www.health.harvard.edu/healthy-aging-and-longevity/sleep-hygiene-simple-practices-for-better-rest',
      publishedAt: '2025-01-31',
      summary:
        'Offers concrete, non-clinical habits around light, routines, food, exercise, and environment that can support better rest.',
      studyTitle: 'The Role of Sleep Hygiene in Promoting Public Health: A Review of Empirical Evidence',
      studyUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4400203/',
    },
    {
      factor: 'Sleep',
      title: 'Sleep On It',
      source: 'NIH News in Health',
      url: 'https://newsinhealth.nih.gov/2013/04/sleep-it',
      publishedAt: '2013-04-01',
      summary:
        'A trusted overview of how sleep connects to memory, attention, and feeling more restored the next day.',
      studyTitle: 'Effects of Exercise on Sleep Quality and Insomnia in Adults: A Systematic Review and Meta-Analysis of Randomized Controlled Trials',
      studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/34163383/',
    },
  ],
  Pain: [
    {
      factor: 'Pain',
      title: 'Complementary Health Approaches for Pain Relief',
      source: 'NIH News in Health',
      url: 'https://newsinhealth.nih.gov/2023/05/complementary-health-approaches-pain-relief',
      publishedAt: '2023-05-01',
      summary:
        'Summarizes non-drug approaches like movement, mindfulness, acupuncture, and massage in a patient-friendly way.',
      studyTitle: 'Effect of Pain Reprocessing Therapy vs Placebo and Usual Care for Patients With Chronic Back Pain: A Randomized Clinical Trial',
      studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/34586357/',
    },
    {
      factor: 'Pain',
      title: 'Retraining the Brain to Treat Chronic Back Pain',
      source: 'NIH News in Health',
      url: 'https://newsinhealth.nih.gov/2022/01/retraining-brain-treat-chronic-back-pain',
      publishedAt: '2022-01-01',
      summary:
        'Explains how pain can involve brain-body patterns and how newer therapies aim to reduce the threat response around pain.',
      studyTitle: 'Effect of Pain Reprocessing Therapy vs Placebo and Usual Care for Patients With Chronic Back Pain: A Randomized Clinical Trial',
      studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/34586357/',
    },
  ],
  Stress: [
    {
      factor: 'Stress',
      title: 'Manage Stress and Build Resilience',
      source: 'NIH News in Health',
      url: 'https://newsinhealth.nih.gov/2020/10/manage-stress-build-resilience',
      publishedAt: '2020-10-01',
      summary:
        'Focuses on sustainable practices like reframing, connection, sleep, and exercise to help stress feel more manageable.',
      studyTitle: 'Mindfulness-Based Stress Reduction vs Escitalopram for the Treatment of Adults With Anxiety Disorders: A Randomized Clinical Trial',
      studyUrl: 'https://jamanetwork.com/journals/jamapsychiatry/fullarticle/2798510',
    },
    {
      factor: 'Stress',
      title: 'Feeling Stressed?',
      source: 'NIH News in Health',
      url: 'https://newsinhealth.nih.gov/2021/01/feeling-stressed',
      publishedAt: '2021-01-01',
      summary:
        'Walks through body signals of stress and simple calming practices without drifting into medical advice.',
      studyTitle: 'A Brief Gratitude Writing Intervention Decreased Stress and Negative Affect During the COVID-19 Pandemic',
      studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/35228834/',
    },
  ],
  Activity: [
    {
      factor: 'Activity',
      title: 'How Much Activity Do You Need?',
      source: 'NIH News in Health',
      url: 'https://newsinhealth.nih.gov/2019/01/how-much-activity-do-you-need',
      publishedAt: '2019-01-01',
      summary:
        'Translates movement guidance into everyday terms and emphasizes that some activity is better than none.',
      studyTitle: 'The Physical Activity Guidelines for Americans',
      studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/30418471/',
    },
    {
      factor: 'Activity',
      title: 'Step It Up!',
      source: 'NIH News in Health',
      url: 'https://newsinhealth.nih.gov/2021/07/step-it-up',
      publishedAt: '2021-07-01',
      summary:
        'Encourages approachable movement habits and explains why regular activity supports mood, sleep, and long-term health.',
      studyTitle: 'Recommended Physical Activity and All Cause and Cause Specific Mortality in US Adults: Prospective Cohort Study',
      studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/32611588/',
    },
  ],
  Medication: [
    {
      factor: 'Medication',
      title: 'Taking your medications as prescribed: Smartphones can help',
      source: 'Harvard Health',
      url: 'https://www.health.harvard.edu/blog/smart-phone-can-help-keep-track-medications-201604289521',
      publishedAt: '2016-04-28',
      summary:
        'Looks at simple reminder systems that can make medication routines feel easier and more consistent.',
      studyTitle: 'Mobile Telephone Text Messaging for Medication Adherence in Chronic Disease: A Meta-analysis',
      studyUrl: 'https://jamanetwork.com/journals/jamainternalmedicine/article-abstract/2484905',
    },
    {
      factor: 'Medication',
      title: 'Taking medications correctly requires clear communication',
      source: 'Harvard Health',
      url: 'https://www.health.harvard.edu/blog/taking-medications-correctly-requires-clear-communication-2017013011043',
      publishedAt: '2017-01-30',
      summary:
        'Centers medication routines around understanding, shared planning, and support rather than blame.',
      studyTitle: 'Discordance Between Drug Adherence as Reported by Patients and Drug Importance as Assessed by Physicians',
      studyUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5394381/',
    },
  ],
}

const FACTOR_ORDER: TrackedFactor[] = [
  'Feeling',
  'Energy',
  'Sleep',
  'Pain',
  'Stress',
  'Activity',
  'Medication',
]

function getDayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24

  return Math.floor(diff / oneDay)
}

export function getDailyLearnArticles(date = new Date()) {
  const dayIndex = getDayOfYear(date)

  return FACTOR_ORDER.map((factor) => {
    const articles = ARTICLE_LIBRARY[factor]
    return articles[dayIndex % articles.length]
  })
}
