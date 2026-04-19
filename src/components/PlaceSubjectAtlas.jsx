import { useState } from 'react'
import { photographUrl } from '../lib/photographs'

function prettyLabel(value) {
  return value.replace(/\b\w/g, (c) => c.toUpperCase())
}

const imageUrl = photographUrl

function intensity(count, maxCount) {
  const ratio = count / maxCount
  return `rgba(62,91,113,${0.08 + ratio * 0.82})`
}

export default function PlaceSubjectAtlas({ atlas }) {
  const maxCount = Math.max(...atlas.cells.map((c) => c.count), 1)
  const [activeKey, setActiveKey] = useState(null)

  const activeCell = atlas.cells.find((c) => `${c.place}::${c.subject}` === activeKey)
    ?? atlas.cells.find((c) => c.count > 0)
    ?? null

  return (
    <article style={{ display: 'grid', gap: '1rem', padding: '1.2rem', border: '1px solid var(--archive-color-rule)', borderRadius: '1.75rem', background: 'linear-gradient(180deg,rgba(255,255,255,0.84),rgba(247,244,237,0.9)),radial-gradient(circle at 14% 14%,rgba(62,91,113,0.08),transparent 34%)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'end', flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: '0 0 0.35rem', font: '600 0.72rem/1.2 var(--archive-font-ui)', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>Place × Subject Atlas</p>
          <h3 style={{ margin: 0, font: '500 1.55rem/1.08 var(--archive-font-display)', color: 'var(--archive-color-ink)', maxWidth: '34rem' }}>Heat signatures reveal which places are remembered through which subjects.</h3>
        </div>
        {activeCell && (
          <div style={{ display: 'grid', gap: '0.1rem', textAlign: 'right' }}>
            <p style={{ margin: 0, font: '600 1rem/1 var(--archive-font-ui)', color: 'var(--archive-color-ink)' }}>{prettyLabel(activeCell.subject)}</p>
            <p style={{ margin: 0, font: '0.82rem/1 var(--archive-font-ui)', color: 'var(--archive-color-muted)' }}>{activeCell.count} photographs in {activeCell.place}</p>
          </div>
        )}
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(15rem,18rem)', gap: '1rem' }}>
        <div style={{ overflowX: 'auto', paddingBottom: '0.2rem' }}>
          <div style={{ display: 'grid', gap: '0.2rem', alignItems: 'stretch', minWidth: '44rem', gridTemplateColumns: `11rem repeat(${atlas.subjects.length}, minmax(3.2rem,1fr))` }}>
            <div style={{ display: 'flex', alignItems: 'end', padding: '0.25rem 0.55rem', font: '600 0.76rem/1.25 var(--archive-font-ui)', color: 'var(--archive-color-copy)' }}>Place</div>
            {atlas.subjects.map((s) => (
              <div key={s.subject} title={s.subject} style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: '7.4rem', padding: '0.35rem 0.1rem', textAlign: 'left', overflow: 'hidden', font: '0.76rem/1.25 var(--archive-font-ui)', color: 'var(--archive-color-copy)' }}>
                {prettyLabel(s.subject)}
              </div>
            ))}

            {atlas.places.map((place) => (
              <div key={place.place} style={{ display: 'contents' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.7rem', alignItems: 'center', padding: '0 0.55rem', whiteSpace: 'nowrap', font: '0.76rem/1.25 var(--archive-font-ui)', color: 'var(--archive-color-copy)' }}>
                  <span>{place.place}</span>
                  <span>{place.total}</span>
                </div>
                {atlas.subjects.map((subject) => {
                  const cell = atlas.cells.find((c) => c.place === place.place && c.subject === subject.subject)
                  const count = cell?.count ?? 0
                  return (
                    <button key={subject.subject} type="button"
                      style={{ position: 'relative', display: 'grid', placeItems: 'center', minHeight: '3.35rem', border: 0, background: intensity(count, maxCount), color: 'white', font: '700 0.76rem/1 var(--archive-font-ui)', cursor: 'pointer', transition: 'transform 160ms ease,box-shadow 160ms ease', opacity: count === 0 ? 0.5 : 1 }}
                      aria-label={`${place.place}, ${prettyLabel(subject.subject)}, ${count} photographs`}
                      onMouseEnter={() => { if (cell) setActiveKey(`${cell.place}::${cell.subject}`) }}
                      onFocus={() => { if (cell) setActiveKey(`${cell.place}::${cell.subject}`) }}
                    >
                      <span style={{ color: count === 0 ? 'rgba(29,35,41,0.34)' : 'white' }}>{count}</span>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {activeCell && (
          <aside style={{ display: 'grid', gap: '0.85rem', padding: '0.95rem 1rem', borderRadius: '1.2rem', background: 'rgba(255,255,255,0.68)', boxShadow: 'inset 0 0 0 1px rgba(62,91,113,0.08)', alignContent: 'start' }}>
            {activeCell.exampleFilename && (
              <div style={{ aspectRatio: '4/3', borderRadius: '0.95rem', overflow: 'hidden', background: 'rgba(29,35,41,0.08)' }}>
                <img src={imageUrl(activeCell.exampleFilename)} alt={activeCell.exampleFilename} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            )}
            <div style={{ display: 'grid', gap: '0.28rem' }}>
              <p style={{ margin: 0, font: '600 0.68rem/1.2 var(--archive-font-ui)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>Reading</p>
              <p style={{ margin: 0, font: '500 1.1rem/1.08 var(--archive-font-display)', color: 'var(--archive-color-ink)' }}>{activeCell.place}</p>
              <p style={{ margin: 0, font: '0.84rem/1.5 var(--archive-font-ui)', color: 'var(--archive-color-copy)' }}>
                {prettyLabel(activeCell.subject)} appears in {activeCell.count} photographs here, equivalent to {activeCell.share}% of the place's archive slice.
              </p>
            </div>
          </aside>
        )}
      </div>
    </article>
  )
}
