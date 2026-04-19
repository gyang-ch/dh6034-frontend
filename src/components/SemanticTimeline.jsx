import { useMemo, useState } from 'react'
import { ResponsiveBar } from '@nivo/bar'
import { Wordcloud } from '@visx/wordcloud'
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion'

function prettyKeyword(value) {
  return value.replace(/\b\w/g, (c) => c.toUpperCase())
}

function createSeededRandom(seed) {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }

  return function seededRandom() {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    const t = (h ^= h >>> 16) >>> 0
    return t / 4294967296
  }
}

function SemanticTooltip({ id, value, color, data }) {
  const family = data.families.find((item) => item.key === id)
  if (!family || value <= 0) return null

  return (
    <div
      style={{
        display: 'grid',
        gap: '0.28rem',
        minWidth: '11rem',
        padding: '0.7rem 0.8rem',
        borderRadius: '0.95rem',
        border: '1px solid rgba(122,79,79,0.14)',
        background: 'rgba(249,246,240,0.96)',
        boxShadow: '0 18px 36px rgba(34,26,24,0.12)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <p style={{ margin: 0, font: '600 0.68rem/1.2 var(--archive-font-ui)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
        {data.year}
      </p>
      <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem', font: '600 0.86rem/1.2 var(--archive-font-ui)', color: 'var(--archive-color-ink)' }}>
        <span style={{ width: '0.78rem', height: '0.78rem', borderRadius: '999px', background: color, display: 'inline-block' }} />
        {family.label}
      </p>
      <p style={{ margin: 0, font: '0.78rem/1.45 var(--archive-font-ui)', color: 'var(--archive-color-copy)' }}>
        {Number(value).toLocaleString()} photographs · {family.share}% of the year
      </p>
    </div>
  )
}

export default function SemanticTimeline({ years }) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [activeYear, setActiveYear] = useState(years.at(-1)?.year ?? null)
  const activeRecord = years.find((year) => year.year === activeYear) ?? years.at(-1) ?? null

  const familyOrder = useMemo(() => years[0]?.families.map((family) => family.key) ?? [], [years])
  const familyMeta = useMemo(
    () =>
      years[0]?.families.reduce((acc, family) => {
        acc[family.key] = family
        return acc
      }, {}) ?? {},
    [years]
  )

  const chartData = useMemo(
    () =>
      years.map((year) => {
        const datum = {
          year: year.year,
          total: year.total,
          families: year.families,
        }

        year.families.forEach((family) => {
          datum[family.key] = family.count
        })

        return datum
      }),
    [years]
  )

  const keywordWords = useMemo(() => {
    const totals = new Map()

    years.forEach((year) => {
      year.topKeywords.forEach((keyword) => {
        totals.set(keyword.label, (totals.get(keyword.label) ?? 0) + keyword.count)
      })
    })

    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 24)
      .map(([text, count], index) => ({
        text,
        value: count,
        count,
        rank: index,
      }))
  }, [years])

  const [activeKeyword, setActiveKeyword] = useState(null)
  const keywordFocus = activeKeyword ?? keywordWords[0] ?? null
  const keywordPalette = useMemo(() => ['#7a4f4f', '#4c6378', '#8b6b4a', '#5f8065', '#7a6a92', '#8f8a80'], [])
  const keywordRandom = useMemo(() => createSeededRandom('semantic-keywords'), [])

  const chartTheme = useMemo(
    () => ({
      background: 'transparent',
      axis: {
        domain: {
          line: {
            stroke: 'rgba(122,79,79,0.16)',
            strokeWidth: 1,
          },
        },
        ticks: {
          line: {
            stroke: 'rgba(122,79,79,0.12)',
            strokeWidth: 1,
          },
          text: {
            fill: 'var(--archive-color-muted)',
            fontSize: 11,
            fontFamily: 'var(--archive-font-ui)',
          },
        },
        legend: {
          text: {
            fill: 'var(--archive-color-muted)',
            fontSize: 11,
            fontFamily: 'var(--archive-font-ui)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          },
        },
      },
      grid: {
        line: {
          stroke: 'rgba(29,35,41,0.08)',
          strokeWidth: 1,
          strokeDasharray: '2 7',
        },
      },
      tooltip: {
        container: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
        },
      },
      labels: {
        text: {
          fill: 'rgba(255,255,255,0.92)',
          fontSize: 10,
          fontFamily: 'var(--archive-font-ui)',
          fontWeight: 600,
        },
      },
    }),
    []
  )

  return (
    <article style={{ display: 'grid', gap: '1rem', padding: '1.2rem', border: '1px solid var(--archive-color-rule)', borderRadius: '1.75rem', background: 'linear-gradient(180deg,rgba(255,255,255,0.84),rgba(247,244,237,0.9)),radial-gradient(circle at 12% 14%,rgba(122,79,79,0.08),transparent 34%)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'end', flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: '0 0 0.35rem', font: '600 0.72rem/1.2 var(--archive-font-ui)', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>Semantic Timeline</p>
          <h3 style={{ margin: 0, font: '500 1.55rem/1.08 var(--archive-font-display)', color: 'var(--archive-color-ink)', maxWidth: '28rem' }}>Subjects migrate from family presence toward architecture, art, and study.</h3>
        </div>
        {activeRecord && (
          <div style={{ display: 'grid', gap: '0.1rem', textAlign: 'right' }}>
            <p style={{ margin: 0, font: '600 1.05rem/1 var(--archive-font-ui)', color: 'var(--archive-color-ink)' }}>{activeRecord.year}</p>
            <p style={{ margin: 0, font: '0.82rem/1 var(--archive-font-ui)', color: 'var(--archive-color-muted)' }}>{activeRecord.total.toLocaleString()} photographs annotated</p>
          </div>
        )}
      </header>

      <div style={{ display: 'grid', gap: '1rem' }}>
        <div
          style={{
            position: 'relative',
            minHeight: '24rem',
            padding: '0.75rem 0.65rem 0.4rem',
            borderRadius: '1.4rem',
            border: '1px solid rgba(122,79,79,0.08)',
            background: 'linear-gradient(180deg,rgba(255,255,255,0.7),rgba(245,240,232,0.78))',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: '0.95rem 1rem 2.8rem',
              pointerEvents: 'none',
              background: 'linear-gradient(180deg,rgba(122,79,79,0.03),transparent 32%)',
              borderRadius: '1rem',
            }}
          />
          <ResponsiveBar
            data={chartData}
            keys={familyOrder}
            indexBy="year"
            groupMode="stacked"
            margin={{ top: 10, right: 14, bottom: 52, left: 52 }}
            padding={0.24}
            innerPadding={1}
            valueScale={{ type: 'linear' }}
            indexScale={{ type: 'band', round: true }}
            colors={({ id }) => familyMeta[id]?.color ?? '#8f8a80'}
            borderRadius={0}
            borderWidth={1}
            borderColor={({ color }) => `color-mix(in srgb, ${color} 72%, #f9f6f0)`}
            enableGridX={false}
            enableGridY
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 0,
              tickPadding: 14,
            }}
            axisLeft={{
              tickSize: 0,
              tickPadding: 12,
              tickValues: 4,
              legend: 'Annotated photographs',
              legendPosition: 'middle',
              legendOffset: -42,
            }}
            enableLabel={false}
            isInteractive
            animate={!prefersReducedMotion}
            motionConfig="gentle"
            theme={chartTheme}
            role="img"
            ariaLabel="Semantic timeline histogram by year and subject family"
            isFocusable
            barAriaLabel={(datum) => {
              const family = familyMeta[datum.id]
              return `${family?.label ?? datum.id} in ${datum.indexValue}: ${datum.value} annotated photographs`
            }}
            onMouseEnter={(datum) => setActiveYear(String(datum.indexValue))}
            onClick={(datum) => setActiveYear(String(datum.indexValue))}
            tooltip={(bar) => <SemanticTooltip {...bar} />}
          />
        </div>

        {activeRecord && (
          <aside style={{ display: 'grid', alignContent: 'start', gap: '0.85rem', padding: '0.95rem 1rem', borderRadius: '1.2rem', background: 'rgba(255,255,255,0.68)', boxShadow: 'inset 0 0 0 1px rgba(122,79,79,0.08)' }}>
            <div style={{ display: 'grid', gap: '0.35rem' }}>
              <p style={{ margin: 0, font: '600 0.68rem/1.2 var(--archive-font-ui)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>Dominant families</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {[...activeRecord.families].filter((family) => family.count > 0).sort((a, b) => b.count - a.count).slice(0, 4).map((family) => (
                  <span key={family.key} style={{ display: 'inline-flex', alignItems: 'center', padding: '0.38rem 0.62rem', borderRadius: '999px', background: `color-mix(in srgb, ${family.color} 16%, white)`, font: '600 0.74rem/1 var(--archive-font-ui)', color: 'var(--archive-color-ink)' }}>
                    {family.label} · {family.share}%
                  </span>
                ))}
              </div>
            </div>
            {activeRecord.topSubjects.length > 0 && (
              <div style={{ display: 'grid', gap: '0.35rem' }}>
                <p style={{ margin: 0, font: '600 0.68rem/1.2 var(--archive-font-ui)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>Top VQA subjects</p>
                <p style={{ margin: 0, font: '0.84rem/1.5 var(--archive-font-ui)', color: 'var(--archive-color-copy)' }}>
                  {activeRecord.topSubjects.map((subject) => `${prettyKeyword(subject.label)} (${subject.count})`).join(' · ')}
                </p>
              </div>
            )}
            {activeRecord.topKeywords.length > 0 && (
              <div style={{ display: 'grid', gap: '0.35rem' }}>
                <p style={{ margin: 0, font: '600 0.68rem/1.2 var(--archive-font-ui)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>Top cleaned keywords</p>
                <p style={{ margin: 0, font: '0.84rem/1.5 var(--archive-font-ui)', color: 'var(--archive-color-copy)' }}>
                  {activeRecord.topKeywords.map((keyword) => `${prettyKeyword(keyword.label)} (${keyword.count})`).join(' · ')}
                </p>
              </div>
            )}
          </aside>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem 1rem' }}>
        {(activeRecord?.families ?? []).map((family) => (
          <span key={family.key} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.42rem', font: '0.78rem/1.2 var(--archive-font-ui)', color: 'var(--archive-color-copy)' }}>
            <span style={{ width: '0.8rem', height: '0.8rem', borderRadius: '999px', background: family.color, display: 'inline-block' }} />
            {family.label}
          </span>
        ))}
      </div>

      {keywordWords.length > 0 && (
        <section style={{ display: 'grid', gap: '0.85rem', padding: '1rem', borderRadius: '1.35rem', background: 'linear-gradient(180deg,rgba(250,248,243,0.84),rgba(243,238,231,0.92))', boxShadow: 'inset 0 0 0 1px rgba(122,79,79,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'grid', gap: '0.3rem' }}>
              <p style={{ margin: 0, font: '600 0.68rem/1.2 var(--archive-font-ui)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>Keyword Cloud</p>
              <p style={{ margin: 0, maxWidth: '34rem', font: '0.84rem/1.55 var(--archive-font-ui)', color: 'var(--archive-color-copy)' }}>
                Cleaned keywords aggregated across the timeline. Hover a word to inspect how insistently it recurs in the archive.
              </p>
            </div>
            {keywordFocus && (
              <div style={{ display: 'grid', gap: '0.12rem', textAlign: 'right' }}>
                <p style={{ margin: 0, font: '500 1.25rem/1.05 var(--archive-font-display)', color: 'var(--archive-color-ink)' }}>{prettyKeyword(keywordFocus.text)}</p>
                <p style={{ margin: 0, font: '0.78rem/1.3 var(--archive-font-ui)', color: 'var(--archive-color-muted)' }}>
                  {keywordFocus.count.toLocaleString()} repeated keyword occurrences
                </p>
              </div>
            )}
          </div>

          <div style={{ minHeight: '23rem', padding: '0.35rem 0', borderTop: '1px solid rgba(122,79,79,0.08)', borderBottom: '1px solid rgba(122,79,79,0.08)' }}>
            <div style={{ minHeight: '22rem', padding: '0.8rem 0.2rem', display: 'grid', placeItems: 'center' }}>
              <Wordcloud
                words={keywordWords}
                width={920}
                height={360}
                font="var(--archive-font-ui)"
                fontStyle="normal"
                fontWeight={600}
                padding={3}
                spiral="archimedean"
                random={keywordRandom}
                rotate={() => 0}
                fontSize={(word) => {
                  const maxValue = keywordWords[0]?.count ?? 1
                  const emphasis = Math.sqrt(word.count / maxValue)
                  return 16 + emphasis * 54
                }}
              >
                {(words) =>
                  words.map((word) => {
                    const keyword = keywordWords.find((item) => item.text === word.text)
                    if (!keyword) return null

                    const isActive = keywordFocus?.text === keyword.text

                    return (
                      <text
                        key={word.text}
                        textAnchor="middle"
                        transform={`translate(${word.x}, ${word.y}) rotate(${word.rotate})`}
                        fontSize={word.size}
                        fontFamily={word.font}
                        fontWeight={isActive ? 700 : 600}
                        fill={isActive ? 'var(--archive-color-ink)' : keywordPalette[keyword.rank % keywordPalette.length]}
                        fillOpacity={isActive ? 1 : 0.82}
                        style={{
                          cursor: 'pointer',
                          transition: prefersReducedMotion ? 'none' : 'fill 180ms ease, fill-opacity 180ms ease',
                        }}
                        onMouseEnter={() => setActiveKeyword(keyword)}
                        onFocus={() => setActiveKeyword(keyword)}
                        onClick={() => setActiveKeyword(keyword)}
                        tabIndex={0}
                        role="button"
                        aria-label={`${prettyKeyword(keyword.text)}: ${keyword.count.toLocaleString()} repeated keyword occurrences`}
                      >
                        <title>{`${prettyKeyword(keyword.text)} · ${keyword.count.toLocaleString()} occurrences`}</title>
                        {prettyKeyword(word.text)}
                      </text>
                    )
                  })
                }
              </Wordcloud>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
            {keywordWords.slice(0, 8).map((keyword) => (
              <button
                key={keyword.text}
                type="button"
                onMouseEnter={() => setActiveKeyword(keyword)}
                onFocus={() => setActiveKeyword(keyword)}
                onClick={() => setActiveKeyword(keyword)}
                style={{
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.38rem',
                  padding: '0.42rem 0.65rem',
                  border: '1px solid rgba(122,79,79,0.12)',
                  borderRadius: '999px',
                  background: keywordFocus?.text === keyword.text ? 'rgba(122,79,79,0.12)' : 'rgba(255,255,255,0.62)',
                  font: '600 0.74rem/1 var(--archive-font-ui)',
                  color: 'var(--archive-color-ink)',
                }}
              >
                <span style={{ width: '0.55rem', height: '0.55rem', borderRadius: '999px', background: keywordPalette[keyword.rank % keywordPalette.length], display: 'inline-block' }} />
                {prettyKeyword(keyword.text)} · {keyword.count}
              </button>
            ))}
          </div>
        </section>
      )}
    </article>
  )
}
