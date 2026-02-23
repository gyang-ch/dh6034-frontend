import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function useGlassEffect(ref, { prefersReducedMotion }) {
  useEffect(() => {
    if (prefersReducedMotion || !ref.current) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const parallaxTween = gsap.fromTo(
      ref.current,
      {
        backgroundPosition: '50% 50%',
      },
      {
        backgroundPosition: '50% 100%',
        ease: 'none',
        scrollTrigger: {
          trigger: ref.current,
          scrub: 1.5,
          start: 'top bottom',
          end: 'bottom top',
        },
      }
    );

    return () => {
      parallaxTween.kill();
      ScrollTrigger.getById('glass-parallax')?.kill();
    };
  }, [ref, prefersReducedMotion]);
}
