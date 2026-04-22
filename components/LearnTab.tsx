import { getDailyLearnArticles } from '@/components/learnArticles'

const twoLineClamp =
  'overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]'

function formatPublishedDate(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function LearnTab() {
  const articles = getDailyLearnArticles()
  const refreshedLabel = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <section className="space-y-6">
      <div className="rounded-[2.2rem] border border-stone-100 bg-white p-6 shadow-[0_24px_90px_rgba(76,149,108,0.10)] sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#4c956c]">
              Learn
            </p>
            <h2 className="font-display mt-3 text-3xl text-stone-900 sm:text-4xl">
              Daily reading, grounded in trusted health sources
            </h2>
            <p className="mt-3 text-base leading-7 text-stone-600">
              Each card pairs a patient-friendly article with a peer-reviewed study. These are
              for education and reflection, not medical advice.
            </p>
          </div>
          <div className="rounded-full bg-[#e0f5ec] px-4 py-2 text-sm text-[#2c6e49]">
            Refreshed for {refreshedLabel}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {articles.map((article) => (
          <article
            key={`${article.factor}-${article.title}`}
            className="flex h-full flex-col rounded-[2rem] border border-stone-100 bg-white p-6 shadow-[0_18px_70px_rgba(76,149,108,0.08)]"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#4c956c]">
                {article.factor}
              </p>
              <div className="shrink-0 rounded-full bg-[#f0f0f0] px-3 py-1.5 text-[11px] text-stone-500 sm:text-xs">
                {formatPublishedDate(article.publishedAt)}
              </div>
            </div>

            <h3 className="font-display mt-3 text-2xl leading-tight text-stone-900">
              <span
                className={`${twoLineClamp} min-h-[2.5em]`}
                title={article.title}
              >
                {article.title}
              </span>
            </h3>

            <div className="mt-4 flex flex-1 flex-col">
              <p className="min-h-[3.5rem] text-base leading-7 text-stone-600">
                {article.summary}
              </p>

              <dl className="mt-5 space-y-3 text-sm text-stone-500">
                <div className="flex min-h-[3.5rem] items-center justify-between gap-4 rounded-[1.2rem] bg-[#f5f5f5] px-4 py-3">
                  <dt>Source</dt>
                  <dd className="font-medium text-stone-700">{article.source}</dd>
                </div>
                <div className="min-h-[6.5rem] rounded-[1.2rem] bg-[#e0f5ec] px-4 py-3">
                  <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4c956c]">
                    Peer-reviewed study
                  </dt>
                  <dd
                    className={`mt-2 min-h-[3rem] text-sm font-medium leading-6 text-stone-700 ${twoLineClamp}`}
                    title={article.studyTitle}
                  >
                    {article.studyTitle}
                  </dd>
                </div>
              </dl>

              <div className="mt-auto flex flex-wrap gap-3 pt-5">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-[linear-gradient(180deg,#56a86e_0%,#4c956c_100%)] px-4 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,#3a7d56_0%,#2c6e49_100%)]"
                >
                  Read article
                </a>
                <a
                  href={article.studyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#b8dcc9] bg-white px-4 py-3 text-sm font-semibold text-[#2c6e49] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,#3a7d56_0%,#2c6e49_100%)]"
                >
                  View study
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
