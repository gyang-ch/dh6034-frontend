import React, { useEffect, useRef, useState } from 'react';
import OpenSeadragon from 'openseadragon';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import windDirectionOverlays from '../data/windDirectionOverlays';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';

const ArchiveViewer = ({ items, activeIndex, setActiveIndex }) => {
  const osdRef = useRef(null);
  const viewerElementRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const containerRef = useRef(null);
  const overlayElementsRef = useRef([]);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(true);
  const containerId = "osd-viewer-comparison";

  const syncViewerLayout = () => {
    const viewer = osdRef.current;
    if (!viewer) {
      return;
    }

    requestAnimationFrame(() => {
      viewer.forceRedraw();
      viewer.viewport?.goHome(true);
      viewer.viewport?.applyConstraints();
    });
  };

  const createPointRect = (x, y) => ({
    width: 0,
    height: 0,
    top: y,
    bottom: y,
    left: x,
    right: x,
    x,
    y,
    toJSON: () => ({ x, y, top: y, bottom: y, left: x, right: x, width: 0, height: 0 }),
  });

  const getEdgeAnchorProps = (markerRect, viewerRect, edge) => {
    const visibleTop = Math.max(markerRect.top, viewerRect.top);
    const visibleBottom = Math.min(markerRect.bottom, viewerRect.bottom);
    const hasVisibleVerticalSegment = visibleBottom > visibleTop;
    if (!hasVisibleVerticalSegment) {
      return null;
    }

    const centerY = (visibleTop + visibleBottom) / 2;
    const isRightEdge = edge === 'right';
    const edgeX = isRightEdge ? markerRect.right : markerRect.left;
    const edgeInsideViewer = edgeX >= viewerRect.left && edgeX <= viewerRect.right;
    if (!edgeInsideViewer) {
      return null;
    }

    return {
      placement: isRightEdge ? 'right' : 'left',
      getReferenceClientRect: () => createPointRect(edgeX, centerY),
    };
  };

  const isTooltipOutOfViewer = (tooltipRect, viewerRect) =>
    tooltipRect.top < viewerRect.top ||
    tooltipRect.bottom > viewerRect.bottom ||
    tooltipRect.left < viewerRect.left ||
    tooltipRect.right > viewerRect.right;

  const getTooltipPlacementDecision = (marker) => {
    const viewerRect = viewerElementRef.current?.getBoundingClientRect();
    const markerRect = marker.getBoundingClientRect();

    if (!viewerRect) {
      return { props: { placement: 'top', getReferenceClientRect: undefined }, allowLeftFallback: false };
    }

    const topOut = markerRect.top < viewerRect.top;
    const bottomIn = markerRect.bottom > viewerRect.top && markerRect.bottom <= viewerRect.bottom;
    const bottomOut = markerRect.bottom > viewerRect.bottom;

    // 1) Default top; 2) if top is out but bottom is in, use bottom.
    if (topOut && bottomIn) {
      return { props: { placement: 'bottom', getReferenceClientRect: undefined }, allowLeftFallback: false };
    }
    if (!(topOut && bottomOut)) {
      return { props: { placement: 'top', getReferenceClientRect: undefined }, allowLeftFallback: false };
    }

    // 3) If both top and bottom are out, anchor to center of visible segment on right edge.
    const rightEdgeProps = getEdgeAnchorProps(markerRect, viewerRect, 'right');
    if (rightEdgeProps) {
      return { props: rightEdgeProps, allowLeftFallback: true };
    }

    // 4) If right-edge anchor is not available, use left edge visible segment center.
    const leftEdgeProps = getEdgeAnchorProps(markerRect, viewerRect, 'left');
    if (leftEdgeProps) {
      return { props: leftEdgeProps, allowLeftFallback: false };
    }

    // Safety fallback.
    return { props: { placement: 'top', getReferenceClientRect: undefined }, allowLeftFallback: false };
  };

  const clearOverlays = () => {
    if (!osdRef.current) {
      return;
    }

    overlayElementsRef.current.forEach((element) => {
      if (element._tippy) {
        element._tippy.destroy();
      }
      osdRef.current.removeOverlay(element);
    });
    overlayElementsRef.current = [];
  };

  const drawOverlaysForItem = (item) => {
    if (!osdRef.current || !item) {
      return;
    }

    const tiledImage = osdRef.current.world.getItemAt(0);
    if (!tiledImage) {
      return;
    }

    clearOverlays();

    const imageName = decodeURIComponent(item.src.split('/').pop().split('?')[0]);
    const boxes = windDirectionOverlays[imageName] || [];

    boxes.forEach((box) => {
      const marker = document.createElement('div');
      marker.className = 'osd-wind-overlay absolute cursor-pointer rounded-sm border-[2px] border-teal-900/80 bg-teal-950/20';
      marker.setAttribute('aria-hidden', 'true');

      tippy(marker, {
        content: 'Wind direction column',
        theme: 'seadragon',
        placement: 'top',
        animation: 'scale',
        onShow(instance) {
          const decision = getTooltipPlacementDecision(marker);
          instance.setProps(decision.props);

          if (!decision.allowLeftFallback) {
            return;
          }

          requestAnimationFrame(() => {
            const viewerRect = viewerElementRef.current?.getBoundingClientRect();
            const markerRect = marker.getBoundingClientRect();
            const tooltipRect = instance.popper?.getBoundingClientRect();
            if (!viewerRect || !tooltipRect) {
              return;
            }

            if (!isTooltipOutOfViewer(tooltipRect, viewerRect)) {
              return;
            }

            const leftEdgeProps = getEdgeAnchorProps(markerRect, viewerRect, 'left');
            if (!leftEdgeProps) {
              return;
            }

            instance.setProps(leftEdgeProps);
            instance.popperInstance?.update();
          });
        },
      });

      marker.addEventListener('mouseenter', () => {
        marker.classList.remove('border-teal-900/80', 'bg-teal-950/20');
        marker.classList.add('border-teal-400', 'bg-teal-950/10', 'shadow-[0_0_12px_2px_rgba(45,212,191,0.6)]');

        const hint = document.getElementById('wind-direction-hint');
        if (hint) {
          hint.classList.remove('text-slate-300');
          hint.classList.add('text-teal-400', 'drop-shadow-[0_0_8px_rgba(45,212,191,0.8)]');
        }
      });

      marker.addEventListener('mouseleave', () => {
        marker.classList.add('border-teal-900/80', 'bg-teal-950/20');
        marker.classList.remove('border-teal-400', 'bg-teal-950/10', 'shadow-[0_0_12px_2px_rgba(45,212,191,0.6)]');

        const hint = document.getElementById('wind-direction-hint');
        if (hint) {
          hint.classList.add('text-slate-300');
          hint.classList.remove('text-teal-400', 'drop-shadow-[0_0_8px_rgba(45,212,191,0.8)]');
        }
      });

      const location = tiledImage.imageToViewportRectangle(
        box.x,
        box.y,
        box.width,
        box.height,
      );

      osdRef.current.addOverlay({
        element: marker,
        location,
        checkResize: false,
      });

      overlayElementsRef.current.push(marker);
    });
  };

  // 1. Initialize OpenSeadragon and GSAP ScrollTrigger
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    let thumbHintTween = null;
    const initialSource = items?.[activeIndex]?.src;
    const viewerElement = viewerElementRef.current;

    if (!initialSource || !viewerElement) {
      return undefined;
    }

    viewerElement.innerHTML = '';
    const viewerOptions = {
      element: viewerElement,
      showNavigationControl: false,
      showNavigator: true,
      navigatorPosition: 'BOTTOM_RIGHT',
      navigatorSizeRatio: 0.2,
      navigatorMaintainSizeRatio: true,
      navigatorAutoFade: true,
      navigatorBackground: '#0f172a',
      navigatorBorderColor: '#334155',
      navigatorDisplayRegionColor: '#14b8a6',
      tileSources: {
        type: 'image',
        url: initialSource,
      },
      gestureSettingsMouse: {
        scrollToZoom: true,
        clickToZoom: true,
        dblClickToZoom: true,
      },
      animationTime: 0.8,
      springStiffness: 12,
      stopScrollViaMouseWheel: true,
    };

    try {
      osdRef.current = OpenSeadragon(viewerOptions);
    } catch (error) {
      console.error('OpenSeadragon failed to initialize. Falling back to viewer only.', error);
      viewerElement.innerHTML = '';
      osdRef.current = OpenSeadragon({
        ...viewerOptions,
        showNavigator: false,
      });
    }

    osdRef.current?.addHandler('open', syncViewerLayout);

    // Lightweight thumbnail hint: transform-only and motion-safe.
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (scrollContainerRef.current && !prefersReducedMotion) {
      thumbHintTween = gsap.fromTo(
        scrollContainerRef.current,
        { y: 0 },
        {
          y: -18,
          duration: 0.45,
          ease: 'power1.inOut',
          yoyo: true,
          repeat: 1,
          scrollTrigger: {
            trigger: scrollContainerRef.current,
            start: 'top 88%',
            toggleActions: 'play none none none',
            once: true,
          },
          onComplete: () => {
            if (scrollContainerRef.current) {
              gsap.set(scrollContainerRef.current, { clearProps: 'transform' });
            }
          },
        },
      );
    }

    return () => {
      if (thumbHintTween) {
        thumbHintTween.kill();
      }
      if (osdRef.current) {
        clearOverlays();
        osdRef.current.destroy();
        osdRef.current = null;
      }
      viewerElement.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Update image on thumbnail click & scroll thumbnail into view
  useEffect(() => {
    if (osdRef.current && items[activeIndex]) {
      const currentItem = items[activeIndex];
      clearOverlays();
      osdRef.current.addOnceHandler('open', () => {
        syncViewerLayout();
        drawOverlaysForItem(currentItem);
      });
      osdRef.current.open({
        type: 'image',
        url: currentItem.src,
      });
    }

    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeThumb = container.children[activeIndex];
      if (activeThumb) {
        const containerHeight = container.offsetHeight;
        const thumbHeight = activeThumb.offsetHeight;
        const thumbTop = activeThumb.offsetTop;
        
        container.scrollTo({
          top: thumbTop - (containerHeight / 2) + (thumbHeight / 2),
          behavior: 'smooth'
        });
      }
    }
  }, [activeIndex, items]);

  // 3. Add Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setActiveIndex((prev) => (prev + 1) % items.length);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setActiveIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items.length, setActiveIndex]);

  // 4. Handle Scroll Visibility for Fades
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      setShowTopFade(scrollTop > 10);
      setShowBottomFade(scrollTop < scrollHeight - clientHeight - 10);
    }
  };

  useEffect(() => {
    const timer = setTimeout(handleScroll, 100);
    window.addEventListener('resize', handleScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleScroll);
    };
  }, [items]);

  const handleZoomIn = () => osdRef.current?.viewport?.zoomBy(1.2);
  const handleZoomOut = () => osdRef.current?.viewport?.zoomBy(0.8);
  const handleHome = () => osdRef.current?.viewport?.goHome();

  return (
    <div
      ref={containerRef}
      data-lenis-prevent
      data-lenis-prevent-wheel
      className="media-card relative left-1/2 -translate-x-1/2 w-[90vw] md:w-[84vw] max-w-[1060px] mb-24 border border-slate-600/80 bg-slate-800/90 p-4 md:p-6 shadow-[0_0_40px_-10px_rgba(0,0,0,0.3)] backdrop-blur-xl"
    >
      
      {/* Viewer Header */}
      <div className="mb-4 md:mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-major text-xs font-bold uppercase tracking-[0.25em] text-teal-400">
            Weather Logbook Gallery
          </h2>
          <p className="mt-1.5 text-[0.7rem] font-medium tracking-wide text-slate-300">
            Highlighted boxes are the <span id="wind-direction-hint" className="transition-all duration-300 text-slate-300">wind direction columns</span>
          </p>
        </div>
        <div className="h-px flex-grow ml-4 bg-slate-700/60" />
      </div>

      <div className="flex flex-row gap-4 h-[600px]">
        
        {/* Synchronized Thumbnails (Left Panel) */}
        <div className="relative w-24 md:w-32 flex-shrink-0 h-full bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden flex flex-col items-center">
          <div className={`absolute top-0 left-0 right-0 z-10 h-6 bg-gradient-to-b from-slate-900 to-transparent transition-opacity duration-300 pointer-events-none ${showTopFade ? 'opacity-100' : 'opacity-0'}`} />
          <div className={`absolute bottom-0 left-0 right-0 z-10 h-6 bg-gradient-to-t from-slate-900 to-transparent transition-opacity duration-300 pointer-events-none ${showBottomFade ? 'opacity-100' : 'opacity-0'}`} />

          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            data-lenis-prevent
            className="flex flex-col gap-3 overflow-y-auto w-full h-full p-2 custom-scrollbar scroll-smooth"
          >
            {items.map((item, idx) => (
              <button
                key={`osd-thumb-${idx}`}
                onClick={() => setActiveIndex(idx)}
                className={`archive-thumb group relative h-20 md:h-24 w-full flex-shrink-0 cursor-pointer overflow-hidden rounded transition-all duration-300 ${
                  idx === activeIndex 
                    ? 'ring-2 ring-teal-500 ring-offset-1 ring-offset-slate-50 scale-105 z-10 shadow-md' 
                    : 'opacity-75 hover:opacity-100 hover:scale-[1.02]'
                }`}
              >
                <img src={item.src} className="h-full w-full object-cover" alt="" />
                <div className={`absolute inset-0 bg-teal-500/10 transition-opacity duration-300 ${idx === activeIndex ? 'opacity-100' : 'opacity-0'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Main Viewer Container with Deep Shadow (Right Panel) */}
        <div className="relative overflow-hidden rounded-lg border border-slate-700/80 bg-slate-950/90 backdrop-blur-xl group shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] flex-grow">
          
          {/* Custom Floating Toolbar */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-3 transition-all duration-300">
            <button 
              onClick={handleZoomIn} 
              title="Zoom In"
              className="group/btn relative h-10 w-10 cursor-pointer transition-all duration-200 hover:scale-111 active:scale-95"
            >
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-teal-400 to-cyan-500 opacity-0 blur transition duration-200 group-hover/btn:opacity-100"></div>
              <div className="relative flex h-full w-full items-center justify-center rounded-lg border border-slate-200 bg-white/95 text-slate-700 shadow-sm transition-all duration-200 group-hover/btn:bg-teal-600 group-hover/btn:text-white group-hover/btn:border-teal-500">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </div>
            </button>

            <button 
              onClick={handleZoomOut} 
              title="Zoom Out"
              className="group/btn relative h-10 w-10 cursor-pointer transition-all duration-200 hover:scale-111 active:scale-95"
            >
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-teal-400 to-cyan-500 opacity-0 blur transition duration-200 group-hover/btn:opacity-100"></div>
              <div className="relative flex h-full w-full items-center justify-center rounded-lg border border-slate-200 bg-white/95 text-slate-700 shadow-sm transition-all duration-200 group-hover/btn:bg-teal-600 group-hover/btn:text-white group-hover/btn:border-teal-500">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </div>
            </button>

            <button 
              onClick={handleHome} 
              title="Reset View"
              className="group/btn relative h-10 w-10 cursor-pointer transition-all duration-200 hover:scale-111 active:scale-95"
            >
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-teal-400 to-cyan-500 opacity-0 blur transition duration-200 group-hover/btn:opacity-100"></div>
              <div className="relative flex h-full w-full items-center justify-center rounded-lg border border-slate-200 bg-white/95 text-slate-700 shadow-sm transition-all duration-200 group-hover/btn:bg-teal-600 group-hover/btn:text-white group-hover/btn:border-teal-500">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
              </div>
            </button>
          </div>

          <div
            ref={viewerElementRef}
            id={containerId}
            data-lenis-prevent
            data-lenis-prevent-wheel
            className="w-full h-full"
          />

        </div>

      </div>
    </div>
  );
};

export default ArchiveViewer;
