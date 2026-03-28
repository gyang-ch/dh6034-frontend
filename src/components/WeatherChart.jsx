import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import LogbookData from '../data/LogbookData.json';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';

const parseDate = (dateStr, timeStr) => {
  const match = dateStr.match(/(\d+)(?:st|nd|rd|th)?\s+([A-Za-z]+)/);
  if (!match) return new Date();
  const day = parseInt(match[1], 10);
  const month = match[2] === 'August' ? 7 : 8;
  
  let hours = 0;
  if (timeStr === '4 A.M.') hours = 4;
  else if (timeStr === '8 A.M.') hours = 8;
  else if (timeStr === '12 A.M.') hours = 12;
  else if (timeStr === '4 P.M.') hours = 16;
  else if (timeStr === '8 P.M.') hours = 20;
  else if (timeStr === '12 P.M.') hours = 24;
  
  return new Date(1864, month, day, hours, 0, 0);
};

const getWindRotation = (dirStr) => {
  if (!dirStr || dirStr.toLowerCase().includes('calm')) return null;
  const parts = dirStr.split(' ');
  const dir = parts[0];
  const map = {
    'N': 180, 'NNE': 202.5, 'NE': 225, 'ENE': 247.5,
    'E': 270, 'ESE': 292.5, 'SE': 315, 'SSE': 337.5,
    'S': 0, 'SSW': 22.5, 'SW': 45, 'WSW': 67.5,
    'W': 90, 'WNW': 112.5, 'NW': 135, 'NNW': 157.5,
  };
  return map[dir] !== undefined ? map[dir] : null;
};

export default function WeatherChart() {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;
    
    // Process Data
    const data = LogbookData.logEntries.map(d => ({
      date: parseDate(d.date, d.time),
      temp: parseFloat(d.tempAir),
      barom: parseFloat(d.barom),
      windForce: parseInt(d.windForce, 10) || 0,
      windDir: d.windDir,
      windRot: getWindRotation(d.windDir),
      original: d
    }));

    // Clear previous
    d3.select(chartRef.current).selectAll("*").remove();

    // Dimensions
    const margin = { top: 50, right: 60, bottom: 80, left: 60 };
    const width = 1000 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(chartRef.current)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Valid data for domains
    const validTempData = data.filter(d => !isNaN(d.temp));
    const validBaromData = data.filter(d => !isNaN(d.barom));

    // Scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date))
      .range([0, width]);

    const yTempScale = d3.scaleLinear()
      .domain([d3.min(validTempData, d => d.temp) - 2, d3.max(validTempData, d => d.temp) + 2])
      .range([height, 0]);

    const yBaromScale = d3.scaleLinear()
      .domain([d3.min(validBaromData, d => d.barom) - 0.05, d3.max(validBaromData, d => d.barom) + 0.05])
      .range([height, 0]);

    // Gridlines (Tableau Style - subtle and background)
    svg.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(yTempScale)
        .ticks(5)
        .tickSize(-width)
        .tickFormat("")
      )
      .selectAll("line")
      .attr("stroke", "rgba(255,255,255,0.05)")
      .attr("stroke-dasharray", "3,3");

    // Axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(d3.timeHour.every(12))
      .tickFormat(d3.timeFormat("%b %d, %I %p"));

    const yAxisTemp = d3.axisLeft(yTempScale).ticks(5);
    const yAxisBarom = d3.axisRight(yBaromScale).ticks(5).tickFormat(d3.format(".2f"));

    // Add Axes
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .attr("class", "x-axis")
      .call(xAxis)
      .selectAll("text")
      .attr("fill", "#94a3b8")
      .attr("font-family", "serif")
      .attr("font-size", "12px")
      .attr("dy", "1em");

    svg.append("g")
      .attr("class", "y-axis-temp")
      .call(yAxisTemp)
      .selectAll("text")
      .attr("fill", "#fb923c")
      .attr("font-family", "serif")
      .attr("font-size", "12px");

    svg.append("g")
      .attr("transform", `translate(${width},0)`)
      .attr("class", "y-axis-barom")
      .call(yAxisBarom)
      .selectAll("text")
      .attr("fill", "#00E5FF")
      .attr("font-family", "serif")
      .attr("font-size", "12px");

    // Clean up axis lines (Removing solid domain lines for a cleaner look)
    svg.selectAll(".domain").attr("stroke", "none");
    svg.selectAll(".tick line").attr("stroke", "rgba(255,255,255,0.1)");

    // Reference Line: Average Temperature
    const avgTemp = d3.mean(validTempData, d => d.temp);
    
    const refLineGroup = svg.append("g").attr("class", "reference-line");
    
    refLineGroup.append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", yTempScale(avgTemp))
      .attr("y2", yTempScale(avgTemp))
      .attr("stroke", "#fb923c")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4,4")
      .attr("opacity", 0.6);

    refLineGroup.append("text")
      .attr("x", width - 10)
      .attr("y", yTempScale(avgTemp) - 6)
      .attr("fill", "#fb923c")
      .attr("font-family", "serif")
      .attr("font-size", "11px")
      .attr("opacity", 0.8)
      .attr("text-anchor", "end")
      .text(`Avg Temp: ${avgTemp.toFixed(1)}°F`);

    // Legends
    // Legend for Air Temp
    svg.append("line").attr("x1", 0).attr("y1", -35).attr("x2", 20).attr("y2", -35).attr("stroke", "url(#tempGradientLegend)").attr("stroke-width", 3);
    svg.append("circle").attr("cx", 10).attr("cy", -35).attr("r", 4).attr("fill", "#ea580c").attr("stroke", "#0f172a").attr("stroke-width", 2);
    svg.append("text")
      .attr("x", 28)
      .attr("y", -31)
      .attr("fill", "#fb923c")
      .attr("font-family", "serif")
      .attr("font-size", "13px")
      .attr("font-weight", "bold")
      .text("Air Temp (°F)");

    // Legend for Barometer
    svg.append("line").attr("x1", width - 130).attr("y1", -35).attr("x2", width - 110).attr("y2", -35).attr("stroke", "#00E5FF").attr("stroke-width", 2.5).attr("stroke-dasharray", "5,5");
    svg.append("circle").attr("cx", width - 120).attr("cy", -35).attr("r", 4).attr("fill", "#00E5FF").attr("stroke", "#0f172a").attr("stroke-width", 2);
    svg.append("text")
      .attr("x", width - 102)
      .attr("y", -31)
      .attr("fill", "#00E5FF")
      .attr("font-family", "serif")
      .attr("font-size", "13px")
      .attr("font-weight", "bold")
      .text("Barometer (inHg)");

    // Lines and Areas
    const lineTemp = d3.line()
      .defined(d => !isNaN(d.temp))
      .x(d => xScale(d.date))
      .y(d => yTempScale(d.temp))
      .curve(d3.curveMonotoneX);

    const areaTemp = d3.area()
      .defined(d => !isNaN(d.temp))
      .x(d => xScale(d.date))
      .y0(height) // anchor to bottom
      .y1(d => yTempScale(d.temp))
      .curve(d3.curveMonotoneX);

    const lineBarom = d3.line()
      .defined(d => !isNaN(d.barom))
      .x(d => xScale(d.date))
      .y(d => yBaromScale(d.barom))
      .curve(d3.curveMonotoneX);

    // Gradients & Filters
    const defs = svg.append("defs");
    
    const gradient = defs.append("linearGradient")
      .attr("id", "tempGradient")
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "100%").attr("y2", "0%");
    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#fca5a5");
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#ea580c");

    // "Music Mountains" style Area Fill
    const areaGradient = defs.append("linearGradient")
      .attr("id", "tempAreaGradient")
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "0%").attr("y2", "100%");
    areaGradient.append("stop").attr("offset", "0%").attr("stop-color", "#ea580c").attr("stop-opacity", 0.45);
    areaGradient.append("stop").attr("offset", "100%").attr("stop-color", "#ea580c").attr("stop-opacity", 0.0);

    const gradientLegend = defs.append("linearGradient")
      .attr("id", "tempGradientLegend")
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "100%").attr("y2", "0%");
    gradientLegend.append("stop").attr("offset", "0%").attr("stop-color", "#fca5a5");
    gradientLegend.append("stop").attr("offset", "100%").attr("stop-color", "#ea580c");

    const glowFilter = defs.append("filter").attr("id", "glow");
    glowFilter.append("feGaussianBlur")
      .attr("stdDeviation", "2.5") // Slightly reduced spread for a tighter, crisper look
      .attr("result", "coloredBlur");
    const feMerge = glowFilter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Draw Temp Area
    svg.append("path")
      .datum(data)
      .attr("fill", "url(#tempAreaGradient)")
      .attr("stroke", "none")
      .attr("d", areaTemp);

    // Draw Barometer Line
    const baromPath = svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#00E5FF")
      .attr("stroke-width", 2.5)
      .attr("filter", "url(#glow)")
      .attr("d", lineBarom);

    // Draw Temp Line
    const tempPath = svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "url(#tempGradient)")
      .attr("stroke-width", 3)
      .attr("filter", "url(#glow)")
      .attr("d", lineTemp);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const totalLengthTemp = tempPath.node()?.getTotalLength() || 0;
    const totalLengthBarom = baromPath.node()?.getTotalLength() || 0;
    let hasAnimatedLines = false;

    const playLineAnimation = () => {
      if (hasAnimatedLines) return;
      hasAnimatedLines = true;

      tempPath
        .transition()
        .duration(2000)
        .ease(d3.easeCubicOut)
        .attr("stroke-dashoffset", 0);

      baromPath
        .transition()
        .duration(2000)
        .ease(d3.easeCubicOut)
        .attr("stroke-dashoffset", 0)
        .on("end", function() {
          d3.select(this).attr("stroke-dasharray", "5,5");
        });
    };

    if (prefersReducedMotion) {
      tempPath
        .attr("stroke-dasharray", "none")
        .attr("stroke-dashoffset", 0);
      baromPath
        .attr("stroke-dasharray", "5,5")
        .attr("stroke-dashoffset", 0);
      hasAnimatedLines = true;
    } else {
      tempPath
        .attr("stroke-dasharray", `${totalLengthTemp} ${totalLengthTemp}`)
        .attr("stroke-dashoffset", totalLengthTemp);
      baromPath
        .attr("stroke-dasharray", `${totalLengthBarom} ${totalLengthBarom}`)
        .attr("stroke-dashoffset", totalLengthBarom);
    }

    const tippyInstances = [];

    // Dots for Temp
    const tempDots = svg.selectAll(".dot-temp")
      .data(validTempData)
      .enter().append("circle")
      .attr("class", "dot-temp cursor-pointer")
      .attr("cx", d => xScale(d.date))
      .attr("cy", d => yTempScale(d.temp))
      .attr("r", 5)
      .attr("fill", "#ea580c")
      .attr("stroke", "#0f172a")
      .attr("stroke-width", 1.5)
      .on('mouseenter', function() {
        d3.select(this)
          .transition().duration(200)
          .attr('r', 8)
          .style('filter', 'drop-shadow(0 0 6px #ea580c)');
      })
      .on('mouseleave', function() {
        d3.select(this)
          .transition().duration(200)
          .attr('r', 5)
          .style('filter', 'none');
      });

    tempDots.each(function(d) {
      const instance = tippy(this, {
        content: `
          <div class="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-0.5">${d3.timeFormat("%b %d, %I %p")(d.date)}</div>
          <div class="text-sm font-bold text-orange-400">Temp: ${d.temp}°F</div>
        `,
        allowHTML: true,
        theme: 'seadragon',
        placement: 'top',
        animation: 'scale',
      });
      tippyInstances.push(instance);
    });

    // Dots for Barom
    const baromDots = svg.selectAll(".dot-barom")
      .data(validBaromData)
      .enter().append("circle")
      .attr("class", "dot-barom cursor-pointer")
      .attr("cx", d => xScale(d.date))
      .attr("cy", d => yBaromScale(d.barom))
      .attr("r", 5)
      .attr("fill", "#00E5FF")
      .attr("stroke", "#0f172a")
      .attr("stroke-width", 1.5)
      .on('mouseenter', function() {
        d3.select(this)
          .transition().duration(200)
          .attr('r', 8)
          .style('filter', 'drop-shadow(0 0 6px #00E5FF)');
      })
      .on('mouseleave', function() {
        d3.select(this)
          .transition().duration(200)
          .attr('r', 5)
          .style('filter', 'none');
      });

    baromDots.each(function(d) {
      const instance = tippy(this, {
        content: `
          <div class="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-0.5">${d3.timeFormat("%b %d, %I %p")(d.date)}</div>
          <div class="text-sm font-bold text-cyan-400">Barom: ${d.barom} inHg</div>
        `,
        allowHTML: true,
        theme: 'seadragon',
        placement: 'top',
        animation: 'scale',
      });
      tippyInstances.push(instance);
    });

    // Wind Quiver Plot
    const windY = height + 45; // below the x-axis tick labels
    
    const windGroup = svg.append("g")
      .attr("class", "wind-quiver");

    data.forEach(d => {
      const x = xScale(d.date);
      if (d.windForce === 0 || d.windRot === null) {
        // Calm - draw a dot
        windGroup.append("circle")
          .attr("cx", x)
          .attr("cy", windY)
          .attr("r", 3)
          .attr("fill", "#94a3b8");
      } else {
        // Arrow
        const len = 12 + d.windForce * 4; // scale length by force
        const thickness = 1.5 + d.windForce * 0.5;
        
        const g = windGroup.append("g")
          .attr("transform", `translate(${x}, ${windY}) rotate(${d.windRot})`);

        // Line
        g.append("line")
          .attr("x1", 0)
          .attr("y1", len/2)
          .attr("x2", 0)
          .attr("y2", -len/2)
          .attr("stroke", "#cbd5e1")
          .attr("stroke-width", thickness)
          .attr("stroke-linecap", "round");

        // Arrowhead (pointing UP originally, which is -y)
        g.append("path")
          .attr("d", `M -4 ${-len/2 + 4} L 0 ${-len/2} L 4 ${-len/2 + 4}`)
          .attr("fill", "none")
          .attr("stroke", "#cbd5e1")
          .attr("stroke-width", thickness)
          .attr("stroke-linecap", "round")
          .attr("stroke-linejoin", "round");
      }
    });

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", windY + 25)
      .attr("text-anchor", "middle")
      .attr("fill", "#94a3b8")
      .attr("font-family", "serif")
      .attr("font-size", "12px")
      .attr("font-style", "italic")
      .text("Wind Direction & Force");

    let observer;
    if (!prefersReducedMotion && chartRef.current && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              playLineAnimation();
              observer.disconnect();
            }
          });
        },
        { threshold: 0.35 }
      );
      observer.observe(chartRef.current);
    } else if (!prefersReducedMotion) {
      playLineAnimation();
    }

    return () => {
      if (observer) observer.disconnect();
      tippyInstances.forEach(instance => instance.destroy());
    };
  }, []);

  return (
    <article className="bg-[#0f172a]/95 backdrop-blur-[2px] rounded-lg border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden mt-8 p-6">
      <div className="text-center mb-6">
        <h3 className="font-header-serif text-lg font-bold text-slate-100 tracking-tight">
          Multi-Metric Meteorological Timeline
        </h3>
        <p className="font-header-serif text-[0.7rem] text-slate-400 mt-1 italic uppercase tracking-wider">
          Barometric Pressure, Air Temperature & Wind Conditions
        </p>
      </div>
      <div className="w-full h-[400px]" ref={chartRef}></div>
    </article>
  );
}