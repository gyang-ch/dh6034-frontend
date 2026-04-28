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
        padding: '0.75rem',
        borderRadius: '4px',
        border: '1px solid var(--archive-color-ink)',
        background: 'var(--archive-color-bg)',
        boxShadow: '4px 4px 0 rgba(29,35,41,0.08)', // Academic print offset shadow
      }}
    >
      <p style={{ margin: 0, font: '600 0.65rem/1.2 var(--archive-font-ui)', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
        {data.year}
      </p>
      <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', font: '600 0.9rem/1.2 "Aptos", "Segoe UI", sans-serif', color: 'var(--archive-color-ink)' }}>
        <span style={{ width: '0.6rem', height: '0.6rem', background: color, display: 'inline-block' }} />
        {family.label}
      </p>
      <p style={{ margin: 0, font: '400 0.75rem/1.45 var(--archive-font-ui)', color: 'var(--archive-color-copy)' }}>
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
          line: { stroke: 'var(--archive-color-ink)', strokeWidth: 1 },
        },
        ticks: {
          line: { stroke: 'var(--archive-color-rule)', strokeWidth: 1 },
          text: { fill: 'var(--archive-color-muted)', fontSize: 11, fontFamily: 'var(--archive-font-data)' },
        },
        legend: {
          text: { fill: 'var(--archive-color-muted)', fontSize: 11, fontFamily: 'var(--archive-font-ui)', letterSpacing: '0.1em', textTransform: 'uppercase' },
        },
      },
      grid: {
        line: { stroke: 'var(--archive-color-rule)', strokeWidth: 1, strokeDasharray: '2 4' },
      },
      tooltip: {
        container: { background: 'transparent', boxShadow: 'none', padding: 0 },
      },
      labels: {
        text: { fill: 'var(--archive-color-bg)', fontSize: 10, fontFamily: 'var(--archive-font-data)', fontWeight: 400 },
      },
    }),
    []
  )

  return (
    <article style={{
      display: 'grid', gap: '2rem', padding: '2.5rem',
      border: '1px solid var(--archive-color-rule)',
      borderRadius: 'var(--radius-soft, 8px)',
      background: 'var(--archive-color-bg)',
      boxShadow: '0 4px 30px -15px rgba(0,0,0,0.06)',
    }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap', borderBottom: '1px solid var(--archive-color-rule)', paddingBottom: '1.5rem' }}>
        <div>
          <p style={{ margin: '0 0 0.75rem', font: '600 0.7rem/1.2 var(--archive-font-ui)', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--archive-color-accent)' }}>
            Figure 2. Semantic Timeline
          </p>
          <h3 style={{ margin: 0, font: '500 1.85rem/1.15 "Aptos", "Segoe UI", sans-serif', color: 'var(--archive-color-ink)', maxWidth: '40rem' }}>
            How the visual subjects of the archival photographs shift across the years.
          </h3>
        </div>
        {activeRecord && (
          <div style={{ textAlign: 'right', minWidth: '120px' }}>
            <p style={{ margin: '0 0 0.2rem', font: '600 1.1rem/1 "Aptos", "Segoe UI", sans-serif', color: 'var(--archive-color-ink)' }}>{activeRecord.year}</p>
            <p style={{ margin: 0, font: '400 0.8rem/1.4 var(--archive-font-ui)', color: 'var(--archive-color-muted)' }}>{activeRecord.total.toLocaleString()} annotated</p>
          </div>
        )}
      </header>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <div style={{ position: 'relative', minHeight: '24rem', padding: '1rem 0' }}>
          <ResponsiveBar
            data={chartData}
            keys={familyOrder}
            indexBy="year"
            groupMode="stacked"
            margin={{ top: 10, right: 14, bottom: 52, left: 52 }}
            padding={0.2}
            innerPadding={1}
            valueScale={{ type: 'linear' }}
            indexScale={{ type: 'band', round: true }}
            colors={({ id }) => familyMeta[id]?.color ?? '#8f8a80'}
            borderRadius={0}
            borderWidth={0}
            enableGridX={false}
            enableGridY
            axisTop={null}
            axisRight={null}
            axisBottom={{ tickSize: 5, tickPadding: 14 }}
            axisLeft={{
              tickSize: 5, tickPadding: 12, tickValues: 4,
              legend: 'Annotated photographs', legendPosition: 'middle', legendOffset: -42,
            }}
            enableLabel={false}
            isInteractive
            animate={!prefersReducedMotion}
            motionConfig="gentle"
            theme={chartTheme}
            role="img"
            isFocusable={false}
            onMouseEnter={(datum) => setActiveYear(String(datum.indexValue))}
            onClick={(datum) => setActiveYear(String(datum.indexValue))}
            tooltip={(bar) => <SemanticTooltip {...bar} />}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem 1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--archive-color-rule)' }}>
        {(years[0]?.families ?? []).map((family) => (
          <span key={family.key} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.42rem', font: '400 0.75rem/1.2 var(--archive-font-ui)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--archive-color-copy)' }}>
            <span style={{ width: '0.6rem', height: '0.6rem', background: family.color, display: 'inline-block' }} />
            {family.label}
          </span>
        ))}
      </div>

      {keywordWords.length > 0 && (
        <section style={{ display: 'grid', gap: '1.5rem', marginTop: '1rem', paddingTop: '2rem', borderTop: '2px solid var(--archive-color-ink)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <p style={{ margin: 0, font: '600 0.7rem/1.2 var(--archive-font-ui)', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--archive-color-accent)' }}>Keyword Cloud</p>
              <p style={{ margin: 0, maxWidth: '34rem', font: '400 0.95rem/1.55 "Aptos", "Segoe UI", sans-serif', color: 'var(--archive-color-copy)' }}>
                Cleaned keywords aggregated across the timeline. Hover a word to inspect how insistently it recurs in the archive.
              </p>
            </div>
            {keywordFocus && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 0.2rem', font: '600 1.25rem/1 "Aptos", "Segoe UI", sans-serif', color: 'var(--archive-color-ink)' }}>{prettyKeyword(keywordFocus.text)}</p>
                <p style={{ margin: 0, font: '400 0.8rem/1.4 var(--archive-font-ui)', color: 'var(--archive-color-muted)' }}>
                  n = {keywordFocus.count.toLocaleString()} occurrences
                </p>
              </div>
            )}
          </div>

          <div style={{ minHeight: '22rem', padding: '0', display: 'grid', placeItems: 'center', background: 'rgba(29,35,41,0.02)', border: '1px solid var(--archive-color-rule)' }}>
            <Wordcloud
              words={keywordWords}
              width={880}
              height={340}
              font='"Aptos", "Segoe UI", sans-serif'
              fontStyle="normal"
              fontWeight={400}
              padding={6}
              spiral="archimedean"
              random={keywordRandom}
              rotate={() => 0}
              fontSize={(word) => {
                const maxValue = keywordWords[0]?.count ?? 1
                const emphasis = Math.sqrt(word.count / maxValue)
                return 18 + emphasis * 50
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
                      transform={`translate(${word.x}, ${word.y})`}
                      fontSize={word.size}
                      fontFamily={word.font}
                      fontStyle={word.fontStyle}
                      fontWeight={isActive ? 600 : 400}
                      fill={isActive ? 'var(--archive-color-ink)' : keywordPalette[keyword.rank % keywordPalette.length]}
                      fillOpacity={isActive ? 1 : 0.65}
                      style={{ cursor: 'pointer', transition: prefersReducedMotion ? 'none' : 'all 180ms ease' }}
                      onMouseEnter={() => setActiveKeyword(keyword)}
                      onClick={() => setActiveKeyword(keyword)}
                    >
                      {prettyKeyword(word.text)}
                    </text>
                  )
                })
              }
            </Wordcloud>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {keywordWords.slice(0, 8).map((keyword) => {
              const isActive = keywordFocus?.text === keyword.text
              const dotColor = keywordPalette[keyword.rank % keywordPalette.length]
              return (
                <button
                  key={keyword.text}
                  type="button"
                  onMouseEnter={() => setActiveKeyword(keyword)}
                  onClick={() => setActiveKeyword(keyword)}
                  style={{
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.3rem 0.7rem',
                    border: `1px solid ${isActive ? dotColor : 'var(--archive-color-rule)'}`,
                    borderRadius: '999px',
                    background: isActive ? `${dotColor}18` : 'var(--archive-color-bg)',
                    font: `${isActive ? '600' : '400'} 0.78rem/1 var(--archive-font-ui)`,
                    color: isActive ? 'var(--archive-color-ink)' : 'var(--archive-color-copy)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ width: '0.45rem', height: '0.45rem', borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                  {prettyKeyword(keyword.text)}
                  <span style={{ font: '400 0.72rem/1 var(--archive-font-ui)', color: 'var(--archive-color-muted)' }}>{keyword.count}</span>
                </button>
              )
            })}
          </div>
        </section>
      )}
    </article>
  )
}