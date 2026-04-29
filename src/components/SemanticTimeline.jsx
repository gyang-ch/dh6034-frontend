import { useMemo, useState } from 'react'
import { ResponsiveBar } from '@nivo/bar'
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion'

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
          <h3 style={{ margin: 0, font: '500 1.85rem/1.15 var(--archive-font-display)', color: 'var(--archive-color-ink)', maxWidth: '40rem' }}>
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
            margin={{ top: 10, right: 14, bottom: 40, left: 52 }}
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
            axisBottom={{ tickSize: 5, tickPadding: 6 }}
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
    </article>
  )
}
