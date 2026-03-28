import React, { useMemo, useEffect, useRef, useState } from 'react'
import LogbookData from '../data/LogbookData.json'
import WeatherChart from './WeatherChart'
import tippy from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import 'tippy.js/animations/scale.css'

const weatherTooltips = {
  'bc': 'Blue sky with detached clouds.',
  'bcp': 'Blue sky, detached clouds, and passing showers.',
  'oc': 'Overcast with detached clouds.',
  'ocp': 'Overcast with passing showers.'
};

const WeatherCell = ({ weather, isRowHovered, onMouseEnter, onMouseLeave }) => {
  const cellRef = useRef(null);

  useEffect(() => {
    const weatherCode = weather?.toLowerCase().trim();
    const content = weatherTooltips[weatherCode];
    
    if (cellRef.current && content) {
      const instance = tippy(cellRef.current, {
        content: `<div class="font-header-serif w-28 min-h-[4rem] flex items-center justify-center text-center px-2 py-1.5 text-[0.8rem] leading-[1.3] text-teal-50/90 italic">${content}</div>`,
        allowHTML: true,
        theme: 'seadragon',
        animation: 'scale',
        placement: 'right',
      });
      return () => instance.destroy();
    }
  }, [weather]);

  const hasTooltip = !!weatherTooltips[weather?.toLowerCase().trim()];

  return (
    <td 
      ref={cellRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`px-1 py-px leading-tight text-center italic text-[0.66rem] transition-colors ${
        isRowHovered ? 'bg-white/10' : 'bg-transparent'
      } ${
        hasTooltip 
          ? 'text-cyan-400 cursor-help underline decoration-dotted decoration-cyan-700 underline-offset-2'
          : 'text-slate-400'
      }`}
    >
      {weather}
    </td>
  );
};

export default function TranscriptionView() {
  const [hoveredRowKey, setHoveredRowKey] = useState(null)

  const { uniqueDates, groupedEntries } = useMemo(() => {
    const dates = []
    const grouped = LogbookData.logEntries.reduce((acc, entry) => {
      if (!acc[entry.date]) {
        acc[entry.date] = []
        dates.push(entry.date)
      }
      acc[entry.date].push(entry)
      return acc
    }, {})

    return { uniqueDates: dates, groupedEntries: grouped }
  }, [])

  const leftPageDates = uniqueDates.slice(0, 2)
  const rightPageDates = uniqueDates.slice(2, 4)

  const renderRowsForDates = (dates) => {
    return dates.map((date) => {
      const entries = groupedEntries[date] || []
      return (
        <React.Fragment key={date}>
          {entries.map((entry, idx) => (
            <tr key={entry.id} className="border-b border-white/5 bg-transparent">
              {idx === 0 && (
                <td
                  rowSpan={entries.length}
                  className="px-1 py-1 border-r border-white/10 align-top font-header-serif text-slate-200 bg-white/5 leading-tight transition-colors hover:bg-white/10"
                >
                  <div className="max-w-[5ch] leading-tight font-semibold">
                    {date.split(' ').map((word, i) => <div key={i}>{word}</div>)}
                  </div>
                </td>
              )}
              <td
                onMouseEnter={() => setHoveredRowKey(entry.id)}
                onMouseLeave={() => setHoveredRowKey(null)}
                className={`px-1 py-px leading-tight border-r border-white/5 text-center text-[0.62rem] font-data text-slate-500 whitespace-nowrap transition-colors ${
                  hoveredRowKey === entry.id ? 'bg-white/10' : 'bg-transparent'
                }`}
              >
                {entry.time}
              </td>
              <td
                onMouseEnter={() => setHoveredRowKey(entry.id)}
                onMouseLeave={() => setHoveredRowKey(null)}
                className={`px-1 py-px leading-tight border-r border-white/5 text-center font-data text-[0.66rem] text-slate-200 transition-colors ${
                  hoveredRowKey === entry.id ? 'bg-white/10' : 'bg-transparent'
                }`}
              >
                {entry.barom}
              </td>
              <td
                onMouseEnter={() => setHoveredRowKey(entry.id)}
                onMouseLeave={() => setHoveredRowKey(null)}
                className={`px-1 py-px leading-tight border-r border-white/5 text-center font-data text-[0.66rem] text-slate-200 transition-colors ${
                  hoveredRowKey === entry.id ? 'bg-white/10' : 'bg-transparent'
                }`}
              >
                {entry.tempAir}
              </td>
              <td
                onMouseEnter={() => setHoveredRowKey(entry.id)}
                onMouseLeave={() => setHoveredRowKey(null)}
                className={`px-1 py-px leading-tight border-r border-white/5 text-center font-data text-stone-400 text-[0.66rem] transition-colors ${
                  hoveredRowKey === entry.id ? 'bg-white/10' : 'bg-transparent'
                }`}
              >
                —
              </td>
              <td
                onMouseEnter={() => setHoveredRowKey(entry.id)}
                onMouseLeave={() => setHoveredRowKey(null)}
                className={`px-1 py-px leading-tight border-r border-white/5 text-center font-data font-bold text-cyan-400 text-[0.66rem] transition-colors ${
                  hoveredRowKey === entry.id ? 'bg-white/10' : 'bg-transparent'
                }`}
              >
                {entry.windDir}
              </td>
              <td
                onMouseEnter={() => setHoveredRowKey(entry.id)}
                onMouseLeave={() => setHoveredRowKey(null)}
                className={`px-1 py-px leading-tight border-r border-white/5 text-center font-data text-[0.66rem] text-slate-200 transition-colors ${
                  hoveredRowKey === entry.id ? 'bg-white/10' : 'bg-transparent'
                }`}
              >
                {entry.windForce}
              </td>
              <WeatherCell
                weather={entry.weather}
                isRowHovered={hoveredRowKey === entry.id}
                onMouseEnter={() => setHoveredRowKey(entry.id)}
                onMouseLeave={() => setHoveredRowKey(null)}
              />
            </tr>
          ))}
        </React.Fragment>
      )
    })
  }

  const renderPage = (title, dates, remarks) => (
    <article className="bg-[#0f172a] rounded-lg border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col h-full">
      <div className="text-center py-3 border-b border-white/10 bg-white/5">
        <h3 className="font-header-serif text-lg font-bold text-slate-100 tracking-tight">
          {title}
        </h3>
        <p className="font-header-serif text-[0.7rem] text-slate-400 mt-1 italic uppercase tracking-wider">
          {LogbookData.metadata.ship} — On Passage from {LogbookData.metadata.location}
        </p>
      </div>
      <div className="overflow-x-auto bg-white/5 backdrop-blur-[10px]">
        <table className="w-full table-fixed text-left border-collapse text-[0.66rem] border-b border-white/10">
          <colgroup>
            <col className="w-[14%]" />
            <col className="w-[13%]" />
            <col className="w-[13%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[14%]" />
          </colgroup>
          <thead className="bg-white/10 text-slate-200 text-[0.6rem] border-b-2 border-cyan-500/30 shadow-[0_1px_10px_rgba(6,182,212,0.1)]">
            <tr className="font-header-serif uppercase tracking-wider">
              <th rowSpan={2} className="px-1 py-1 border-r border-white/10 font-bold">Date</th>
              <th rowSpan={2} className="px-1 py-1 border-r border-white/10 font-bold text-center">Time</th>
              <th rowSpan={2} className="px-1 py-1 border-r border-white/10 font-bold text-center">Barom</th>
              <th colSpan={2} className="px-1 py-1 border-b border-r border-white/10 font-bold text-center">Temperature</th>
              <th colSpan={2} className="px-1 py-1 border-b border-r border-white/10 font-bold text-center">Wind</th>
              <th rowSpan={2} className="px-1 py-1 font-bold text-center">Weather</th>
            </tr>
            <tr className="bg-white/5 font-header-serif text-[0.55rem]">
              <th className="px-1 py-0.5 border-r border-white/10 font-semibold text-center">Air</th>
              <th className="px-1 py-0.5 border-r border-white/10 font-semibold text-center">Sea</th>
              <th className="px-1 py-0.5 border-r border-white/10 font-semibold text-center">Direction</th>
              <th className="px-1 py-0.5 border-r border-white/10 font-semibold text-center">Force</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {renderRowsForDates(dates)}
          </tbody>
        </table>
      </div>

      <div className="flex-1 bg-white/5 p-6 flex flex-col">
        <div className="text-[0.6rem] font-header-serif font-bold text-cyan-400 uppercase tracking-[0.2em] mb-3 border-b border-white/10 pb-2">
          Remarks, &c.
        </div>
        <p className="font-header-serif text-[0.95rem] leading-relaxed text-slate-300 m-0 first-letter:text-2xl first-letter:font-bold first-letter:text-cyan-400 first-letter:mr-0.5">
          {remarks}
        </p>
      </div>
    </article>
  )

  return (
    <section className="transcription-entrance my-16 relative left-1/2 -translate-x-1/2 w-[min(128ch,calc(100vw-6rem))]">
      <div className="mt-20">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-px flex-grow bg-slate-700" />
          <h2 className="font-header-serif text-sm uppercase tracking-[0.3em] text-slate-400 font-bold">
            Digital reconstruction & data visualisation
          </h2>
          <div className="h-px flex-grow bg-slate-700" />
        </div>
        <div className="overflow-x-auto pb-4">
          <div className="grid grid-cols-2 gap-6 items-stretch min-w-[58rem]">
            {renderPage('Left Page', leftPageDates, LogbookData.metadata.remarksLeftPage)}
            {renderPage('Right Page', rightPageDates, LogbookData.metadata.remarksRightPage)}
          </div>
        </div>
        <WeatherChart />
      </div>
    </section>
  )
}
