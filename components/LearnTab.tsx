import { getDailyLearnArticles } from '@/components/learnArticles'

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
      <div className="rounded-[2.2rem] border border-white/70 bg-white/85 p-6 shadow-[0_24px_90px_rgba(120,133,107,0.16)] backdrop-blur-xl sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#6f8e58]">
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
          <div className="rounded-full bg-[#edf2e5] px-4 py-2 text-sm text-[#456246]">
            Refreshed for {refreshedLabel}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {articles.map((article) => (
          <article
            key={`${article.factor}-${article.title}`}
            className="rounded-[2rem] border border-white/70 bg-[rgba(255,255,255,0.88)] p-6 shadow-[0_18px_70px_rgba(120,133,107,0.13)] backdrop-blur-xl"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#6f8e58]">
                  {article.factor}
                </p>
                <h3 className="font-display mt-3 text-2xl leading-tight text-stone-900">
                  {article.title}
                </h3>
              </div>
              <div className="rounded-full bg-stone-100 px-3 py-2 text-xs text-stone-500">
                {formatPublishedDate(article.publishedAt)}
              </div>
            </div>

            <p className="mt-4 text-base leading-7 text-stone-600">{article.summary}</p>

            <dl className="mt-5 space-y-3 text-sm text-stone-500">
              <div className="flex items-center justify-between gap-4 rounded-[1.2rem] bg-[#f6f3ea] px-4 py-3">
                <dt>Source</dt>
                <dd className="font-medium text-stone-700">{article.source}</dd>
              </div>
              <div className="rounded-[1.2rem] bg-[#eff4e8] px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6f8e58]">
                  Peer-reviewed study
                </dt>
                <dd className="mt-2 text-sm font-medium leading-6 text-stone-700">
                  {article.studyTitle}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={article.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-[#6f9658] px-4 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
              >
                Read article
              </a>
              <a
                href={article.studyUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-[#d3dfc1] bg-white px-4 py-3 text-sm font-semibold text-[#456246] transition-transform duration-200 hover:-translate-y-0.5"
              >
                View study
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
