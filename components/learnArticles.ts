export type LearnFactor =
  | 'Pain'
  | 'Mental Health'
  | 'Social'
  | 'Lifestyle'
  | 'Diet'
  | 'Environment'
  | 'Medication'
  | 'Activity'

export interface LearnArticle {
  factor: LearnFactor
  title: string
  source: string
  url: string
  publishedAt: string
  summary: string
  studyTitle: string
  studyUrl: string
}

const ARTICLE_LIBRARY: Record<LearnFactor, LearnArticle[]> = {
  Pain: [
    {
      factor: 'Pain',
      title: 'Complementary Health Approaches for Pain Relief',
      source: 'NIH News in Health',
      url: 'https://newsinhealth.nih.gov/2023/05/complementary-health-approaches-pain-relief',
      publishedAt: '2023-05-01',
      summary:
        'Summarizes non-drug approaches like movement, mindfulness, acupuncture, and massage in a patient-friendly way.',
      studyTitle:
        'Effect of Pain Reprocessing Therapy vs Placebo and Usual Care for Patients With Chronic Back Pain: A Randomized Clinical Trial',
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
      studyTitle:
        'Effect of Pain Reprocessing Therapy vs Placebo and Usual Care for Patients With Chronic Back Pain: A Randomized Clinical Trial',
      studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/34586357/',
    },
  ],
  'Mental Health': [
    {
      factor: 'Mental Health',
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
      factor: 'Mental Health',
      title: 'Manage Stress and Build Resilience',
      source: 'NIH News in Health',
      url: 'https://newsinhealth.nih.gov/2020/10/manage-stress-build-resilience',
      publishedAt: '2020-10-01',
      summary:
        'Focuses on sustainable practices like reframing, connection, sleep, and exercise to help stress feel more manageable.',
      studyTitle:
        'Mindfulness-Based Stress Reduction vs Escitalopram for the Treatment of Adults With Anxiety Disorders: A Randomized Clinical Trial',
      studyUrl:
        'https://jamanetwork.com/journals/jamapsychiatry/fullarticle/2798510',
    },
  ],
  Social: [
    {
      factor: 'Social',
      title: 'Build Social Bonds to Protect Health',
      source: 'NIH News in Health',
      url: 'https://newsinhealth.nih.gov/2025/03/build-social-bonds-protect-health',
      publishedAt: '2025-03-01',
      summary:
        'Shows how meaningful connection, even in small doses, can support resilience and whole-person health.',
      studyTitle: 'Social Isolation, Loneliness in Older People Pose Health Risks',
      studyUrl: 'https://www.ncbi.nlm.nih.gov/books/NBK568329/',
    },
    {
      factor: 'Social',
      title: 'Do Social Ties Affect Our Health?',
      source: 'NIH News in Health',
      url: 'https://newsinhealth.nih.gov/2017/02/do-social-ties-affect-our-health',
      publishedAt: '2017-02-01',
      summary:
        'Connects social support, belonging, and daily wellbeing without drifting into prescriptive medical advice.',
      studyTitle: 'Loneliness and Social Isolation as Risk Factors for Mortality: A Meta-Analytic Review',
      studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/25910392/',
    },
  ],
  Lifestyle: [
    {
      factor: 'Lifestyle',
      title: 'Healthy lifestyle habits',
      source: 'Harvard Health',
      url: 'https://www.health.harvard.edu/healthbeat/healthy-lifestyle-habits',
      publishedAt: '2024-06-28',
      summary:
        'Covers practical habits around food, movement, alcohol, and weight that can support long-term wellbeing.',
      studyTitle: 'Healthy Lifestyle and Life Expectancy at Age 50 Years in the US Population',
      studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/30601814/',
    },
    {
      factor: 'Lifestyle',
      title: '10 habits for good health',
      source: 'Harvard Health',
      url: 'https://www.health.harvard.edu/staying-healthy/10-habits-for-good-health',
      publishedAt: '2024-05-01',
      summary:
        'Breaks routine health habits into small, approachable actions that are easier to sustain.',
      studyTitle: 'The Combined Effect of Sleep and Physical Activity on All-Cause Mortality',
      studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/35494906/',
    },
  ],
  Diet: [
    {
      factor: 'Diet',
      title: 'Of all the flavors in the world, we choose salty, and that is not good',
      source: 'Harvard Health',
      url: 'https://www.health.harvard.edu/blog/of-all-the-flavors-in-the-world-we-choose-salty-and-thats-not-good-2017052511732',
      publishedAt: '2017-05-25',
      summary:
        'Explains how sodium can quietly add up and offers realistic ways to lower salt in everyday meals.',
      studyTitle: 'Sodium Intake and Health: What Should We Recommend Based on the Current Evidence?',
      studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/30942919/',
    },
    {
      factor: 'Diet',
      title: 'Controlling what and how much we eat',
      source: 'Harvard Health',
      url: 'https://www.health.harvard.edu/staying-healthy/controlling-what--and-how-much--we-eat',
      publishedAt: '2012-12-01',
      summary:
        'Looks at mindful portions, lower-sodium choices, and small decisions that can improve daily eating patterns.',
      studyTitle: 'The Mediterranean Diet and Cardiovascular Health: A Systematic Review and Meta-Analysis',
      studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/36829553/',
    },
  ],
  Environment: [
    {
      factor: 'Environment',
      title: 'A 20-minute nature break relieves stress',
      source: 'Harvard Health',
      url: 'https://www.health.harvard.edu/mind-and-mood/a-20-minute-nature-break-relieves-stress',
      publishedAt: '2019-07-01',
      summary:
        'Highlights how small doses of nature and calmer surroundings can improve how the body handles stress.',
      studyTitle: 'Spending at Least 120 Minutes a Week in Nature Is Associated With Good Health and Wellbeing',
      studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/31267783/',
    },
    {
      factor: 'Environment',
      title: 'Sleep hygiene: Simple practices for better rest',
      source: 'Harvard Health',
      url: 'https://www.health.harvard.edu/staying-healthy/sleep-hygiene-simple-practices-for-better-rest',
      publishedAt: '2025-01-31',
      summary:
        'Shows how light, noise, temperature, and routine can shape how restorative your environment feels.',
      studyTitle:
        'The Role of Sleep Hygiene in Promoting Public Health: A Review of Empirical Evidence',
      studyUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4400203/',
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
      studyTitle:
        'Mobile Telephone Text Messaging for Medication Adherence in Chronic Disease: A Meta-analysis',
      studyUrl:
        'https://jamanetwork.com/journals/jamainternalmedicine/article-abstract/2484905',
    },
    {
      factor: 'Medication',
      title: 'Taking medications correctly requires clear communication',
      source: 'Harvard Health',
      url: 'https://www.health.harvard.edu/blog/taking-medications-correctly-requires-clear-communication-2017013011043',
      publishedAt: '2017-01-30',
      summary:
        'Centers medication routines around understanding, shared planning, and support rather than blame.',
      studyTitle:
        'Discordance Between Drug Adherence as Reported by Patients and Drug Importance as Assessed by Physicians',
      studyUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5394381/',
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
      title: 'Get Active Together',
      source: 'NIH News in Health',
      url: 'https://newsinhealth.nih.gov/2024/05/get-active-together',
      publishedAt: '2024-05-01',
      summary:
        'Frames movement as something easier to sustain when it is social, approachable, and regular.',
      studyTitle: 'Recommended Physical Activity and All Cause and Cause Specific Mortality in US Adults',
      studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/32611588/',
    },
  ],
}

const FACTOR_ORDER: LearnFactor[] = [
  'Pain',
  'Mental Health',
  'Social',
  'Lifestyle',
  'Diet',
  'Environment',
  'Medication',
  'Activity',
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
