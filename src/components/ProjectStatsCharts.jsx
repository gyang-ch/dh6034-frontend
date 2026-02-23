import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import gsap from 'gsap'
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion'

const topStats = [
  { label: 'Launch Date', value: 'Nov-05-2024' },
  { label: 'Registered Volunteers', value: '2,811' },
]

const workflowStats = [
  { name: 'Navigation', retired: 9731, total: 9731, pct: 100, etc: '0 days' },
  { name: 'Barometer', retired: 9731, total: 9731, pct: 100, etc: '0 days' },
  { name: 'Wind Direction', retired: 5397, total: 9731, pct: 55, etc: '41 days' },
  { name: 'Wind Force', retired: 9731, total: 9731, pct: 100, etc: '0 days' },
  { name: 'Sea Temperature', retired: 9731, total: 9731, pct: 100, etc: '0 days' },
  { name: 'Air Temperature', retired: 9731, total: 9731, pct: 100, etc: '0 days' },
]

const classificationByMonth = [
  { month: 'Oct-24', value: 1328 },
  { month: 'Nov-24', value: 29184 },
  { month: 'Dec-24', value: 20830 },
  { month: 'Jan-25', value: 17990 },
  { month: 'Feb-25', value: 6791 },
  { month: 'Mar-25', value: 15090 },
  { month: 'Apr-25', value: 19444 },
  { month: 'May-25', value: 24879 },
  { month: 'Jun-25', value: 18582 },
  { month: 'Jul-25', value: 22477 },
  { month: 'Aug-25', value: 18965 },
  { month: 'Sep-25', value: 13893 },
  { month: 'Oct-25', value: 8155 },
  { month: 'Nov-25', value: 5367 },
  { month: 'Dec-25', value: 2895 },
  { month: 'Jan-26', value: 6302 },
  { month: 'Feb-26', value: 2303 },
]

const talkByMonth = [
  { month: 'Oct-24', value: 152 },
  { month: 'Nov-24', value: 1479 },
  { month: 'Dec-24', value: 864 },
  { month: 'Jan-25', value: 930 },
  { month: 'Feb-25', value: 405 },
  { month: 'Mar-25', value: 826 },
  { month: 'Apr-25', value: 605 },
  { month: 'May-25', value: 661 },
  { month: 'Jun-25', value: 1086 },
  { month: 'Jul-25', value: 873 },
  { month: 'Aug-25', value: 693 },
  { month: 'Sep-25', value: 524 },
  { month: 'Oct-25', value: 223 },
  { month: 'Nov-25', value: 157 },
  { month: 'Dec-25', value: 180 },
  { month: 'Jan-26', value: 98 },
  { month: 'Feb-26', value: 55 },
]

function WorkflowDonut({ item, reducedMotion }) {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) {
      return
    }

    const size = 174
    const radius = 71
    const thickness = 11
    const pct = Math.max(0, Math.min(item.pct, 100))
    const endAngle = (Math.PI * 2 * pct) / 100

    const svg = d3
      .select(mount)
      .html('')
      .append('svg')
      .attr('width', size)
      .attr('height', size)
      .attr('viewBox', `0 0 ${size} ${size}`)
      .attr('role', 'img')
      .attr('aria-label', `${item.name} ${item.pct}% complete`)

    // Add a drop shadow filter for the donut
    const defs = svg.append('defs')
    const filter = defs.append('filter').attr('id', 'glow')
    filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur')
    const feMerge = filter.append('feMerge')
    feMerge.append('feMergeNode').attr('in', 'coloredBlur')
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    const group = svg.append('g').attr('transform', `translate(${size / 2}, ${size / 2})`)

    const arc = d3
      .arc()
      .innerRadius(radius - thickness / 2)
      .outerRadius(radius + thickness / 2)
      .cornerRadius(thickness / 2) // Rounded tips for a modern look

    // Background track
    group
      .append('path')
      .datum({ startAngle: 0, endAngle: Math.PI * 2 })
      .attr('d', arc)
      .attr('fill', '#e2e8f0') // Lighter slate for background

    // Progress path
    const progressPath = group.append('path').attr('fill', '#0ea5e9') // Sky blue 500
    const arcState = { endAngle: 0 }

    if (reducedMotion) {
      progressPath.datum({ startAngle: 0, endAngle }).attr('d', arc)
    } else {
      gsap.fromTo(
        arcState,
        { endAngle: 0 },
        {
          endAngle,
          duration: 1.2,
          ease: 'power3.out',
          onUpdate: () => {
            progressPath.datum({ startAngle: 0, endAngle: arcState.endAngle }).attr('d', arc)
          },
        },
      )
    }

    // Text labels
    svg
      .append('text')
      .attr('x', size / 2)
      .attr('y', size / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#0f172a')
      .style('font-size', '20px')
      .style('font-weight', '700')
      .text(`${item.pct}%`)

    svg
      .append('text')
      .attr('x', size / 2)
      .attr('y', size / 2 + 20)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#64748b')
      .style('font-size', '10px')
      .style('font-weight', '500')
      .style('letter-spacing', '0.08em')
      .text('COMPLETE')

    // Hover interactions
    const onEnter = () => {
      // Add glow and brighten color
      gsap.to(progressPath.node(), {
        attr: { fill: '#38bdf8' },
        duration: 0.3,
        ease: 'power2.out',
      })
      gsap.to(svg.node(), { scale: 1.05, transformOrigin: '50% 50%', duration: 0.3, ease: 'back.out(1.7)' })
    }

    const onLeave = () => {
      gsap.to(progressPath.node(), {
        attr: { fill: '#0ea5e9' },
        duration: 0.3,
        ease: 'power2.out',
      })
      gsap.to(svg.node(), { scale: 1, transformOrigin: '50% 50%', duration: 0.3, ease: 'power2.out' })
    }

    mount.addEventListener('pointerenter', onEnter)
    mount.addEventListener('pointerleave', onLeave)

    return () => {
      mount.removeEventListener('pointerenter', onEnter)
      mount.removeEventListener('pointerleave', onLeave)
      gsap.killTweensOf(arcState)
      if (svg.node()) gsap.killTweensOf(svg.node())
      if (progressPath.node()) gsap.killTweensOf(progressPath.node())
    }
  }, [item, reducedMotion])

  return (
    <article className="px-2 py-2">
      <h3 className="font-major subhead-spaced text-[0.68rem] font-bold text-slate-700">{item.name}</h3>
      <p className="mt-1 text-xs text-slate-500">
        Images retired: {item.retired.toLocaleString()} / {item.total.toLocaleString()} · ETC ~{item.etc}
      </p>
      <div className="mt-2 flex justify-center" ref={mountRef} />
    </article>
  )
}

function VerticalBarChart({ title, subtitle, data, reducedMotion }) {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) {
      return
    }

    const width = 1160
    const height = 248
    const margin = { top: 20, right: 12, bottom: 40, left: 46 }
    const plotWidth = width - margin.left - margin.right
    const plotHeight = height - margin.top - margin.bottom

    const root = d3.select(mount).html('').style('position', 'relative')

    // 1. Modern Glassmorphism Tooltip
    const tooltip = root
      .append('div')
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('opacity', '0')
      .style('z-index', '10')
      .style('padding', '8px 12px')
      .style('background', 'rgba(255, 255, 255, 0.95)')
      .style('backdrop-filter', 'blur(4px)')
      .style('border-radius', '8px')
      .style('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)')
      .style('border', '1px solid rgba(226, 232, 240, 0.8)')
      .style('transform', 'translate(0, -100%)')
      .style('transition', 'transform 0.1s ease-out')

    const svg = root
      .append('svg')
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'none')
      .attr('class', 'block w-full')
      .attr('role', 'img')
      .attr('aria-label', `${title} monthly values`)

    // 2. Define Gradient for Bars
    const gradientId = `bar-gradient-${title.replace(/\s/g, '')}`
    const defs = svg.append('defs')
    const gradient = defs
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%')

    // Light Sky Blue (Top)
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#38bdf8').attr('stop-opacity', 1)
    // Deep Sky Blue (Bottom)
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#0284c7').attr('stop-opacity', 1)

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.month))
      .range([margin.left, width - margin.right])
      .paddingInner(0.6)
      .paddingOuter(0.3)

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value) || 1])
      .nice(4)
      .range([margin.top + plotHeight, margin.top])

    // 3. Cleaner Grid Lines
    const tickValues = y.ticks(4)
    svg
      .append('g')
      .selectAll('line')
      .data(tickValues)
      .join('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', (d) => y(d))
      .attr('y2', (d) => y(d))
      .attr('stroke', '#e2e8f0') // Very light slate
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4 6') // Softer dashes

    // Y-Axis Text
    svg
      .append('g')
      .selectAll('text')
      .data(tickValues)
      .join('text')
      .attr('x', margin.left - 10)
      .attr('y', (d) => y(d) + 4)
      .attr('text-anchor', 'end')
      .attr('fill', '#94a3b8')
      .style('font-size', '10px')
      .style('font-family', 'sans-serif')
      .text((d) => d.toLocaleString())

    // 4. Bars with Rounded Corners and Gradient
    const bars = svg
      .append('g')
      .selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', (d) => x(d.month))
      .attr('width', x.bandwidth())
      .attr('rx', 4) // Rounded top corners
      .attr('fill', `url(#${gradientId})`) // Apply gradient
      .style('cursor', 'pointer')

    if (reducedMotion) {
      bars.attr('y', (d) => y(d.value)).attr('height', (d) => margin.top + plotHeight - y(d.value))
    } else {
      bars.attr('y', margin.top + plotHeight).attr('height', 0)
      bars.each(function animateBar(d, index) {
        gsap.to(this, {
          attr: {
            y: y(d.value),
            height: margin.top + plotHeight - y(d.value),
          },
          duration: 0.8,
          delay: index * 0.03,
          ease: 'power3.out',
        })
      })
    }

    const showTooltip = (event, d, node) => {
      const [cursorX, cursorY] = d3.pointer(event, root.node())
      const left = cursorX + 12
      const top = cursorY - 8

      tooltip
        .style('left', `${left}px`)
        .style('top', `${top}px`)
        .html(`
          <div class="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-0.5">${d.month}</div>
          <div class="text-sm font-bold text-slate-800">${Number(d.value).toLocaleString()}</div>
        `)

      gsap.to(tooltip.node(), { opacity: 1, y: -5, duration: 0.2, ease: 'power2.out' })
      
      // Hover Effect: Brighten and slightly expand
      gsap.to(node, {
        attr: {
          x: (x(d.month) || 0) - 2,
          width: x.bandwidth() + 4,
          fill: '#38bdf8', // Solid bright color on hover
        },
        filter: 'drop-shadow(0px 4px 8px rgba(56, 189, 248, 0.5))', // Glow
        duration: 0.2,
        ease: 'power2.out',
      })
    }

    const hideTooltip = (d, node) => {
      gsap.to(tooltip.node(), { opacity: 0, y: 0, duration: 0.15, ease: 'power2.inOut' })
      
      gsap.to(node, {
        attr: {
          x: x(d.month) || 0,
          width: x.bandwidth(),
          fill: `url(#${gradientId})`, // Return to gradient
        },
        filter: 'none',
        duration: 0.2,
        ease: 'power2.out',
      })
    }

    bars
      .on('pointerenter', function (event, d) {
        showTooltip(event, d, this)
      })
      .on('pointermove', function (event, d) {
        showTooltip(event, d, this)
      })
      .on('pointerleave', function (_, d) {
        hideTooltip(d, this)
      })

    // X-Axis Labels (Rotated 45 degrees for better readability)
    svg
      .append('g')
      .selectAll('text')
      .data(data)
      .join('text')
      .attr('text-anchor', 'start')
      .attr('fill', '#64748b')
      .style('font-size', '10px')
      .style('font-weight', '500')
      // Rotate 45 degrees
      .attr('transform', (d) => `translate(${(x(d.month) || 0) + x.bandwidth() / 2 - 4}, ${margin.top + plotHeight + 16}) rotate(45)`)
      .text((d) => d.month)

    return () => {
      bars.on('pointerenter', null).on('pointermove', null).on('pointerleave', null)
      bars.each(function killBarTweens() {
        gsap.killTweensOf(this)
      })
      if (tooltip.node()) {
        gsap.killTweensOf(tooltip.node())
      }
    }
  }, [data, title, reducedMotion])

  return (
    <section className="pt-2">
      <h3 className="font-major subhead-spaced text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest">{subtitle}</h3>
      <p className="font-subtitle mt-1 text-[clamp(1.2rem,2.2vw,1.6rem)] leading-tight font-semibold text-slate-900">{title}</p>
      <div className="mt-4 pb-1" ref={mountRef} />
    </section>
  )
}

export default function ProjectStatsCharts() {
  const reducedMotion = usePrefersReducedMotion()

  return (
    <section
      className="mb-12 border-t border-b border-slate-200 py-10 bg-slate-50/50"
      aria-label="Estimated project statistics"
    >
      <div className="px-2">
        <h2 className="font-subtitle mt-2 text-[clamp(1.35rem,2.4vw,2rem)] leading-tight font-bold text-slate-900">
          Project Statistics <span className="text-slate-400 font-normal text-lg">(as of 19 Feb)</span>
        </h2>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {topStats.map((stat) => (
            <article key={stat.label} className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
              <p className="font-subtitle text-4xl font-bold text-slate-800">{stat.value}</p>
              <p className="font-major subhead-spaced mt-2 text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 pt-6">
          <p className="font-subtitle text-xl font-semibold text-slate-800 mb-6">Live Workflows</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {workflowStats.map((item) => (
              <div key={item.name} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                <WorkflowDonut item={item} reducedMotion={!!reducedMotion} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 pt-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <VerticalBarChart
              title="Classification Stats"
              subtitle="Classifications per month"
              data={classificationByMonth}
              reducedMotion={!!reducedMotion}
            />
            <VerticalBarChart
              title="Talk Stats"
              subtitle="Comments per month"
              data={talkByMonth}
              reducedMotion={!!reducedMotion}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
