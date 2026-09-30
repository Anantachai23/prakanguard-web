import React, { useRef, useState, useEffect } from 'react';

/**
 * AutoMarquee: Smooth horizontal marquee that activates ONLY when text/content exceeds its container width.
 * When text fits within the container, it remains statically aligned.
 */
export default function AutoMarquee({ 
  children, 
  className = "", 
  speedSeconds = 18,
  gapPx = 32,
  force = false
}) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    let checkTimeout;
    const checkOverflow = () => {
      if (containerRef.current && contentRef.current) {
        const overflows = contentRef.current.scrollWidth > containerRef.current.clientWidth + 2;
        setIsOverflowing(overflows);
      }
    };

    checkOverflow();
    checkTimeout = setTimeout(checkOverflow, 200);

    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => checkOverflow()) : null;
    if (observer && containerRef.current) observer.observe(containerRef.current);
    if (observer && contentRef.current) observer.observe(contentRef.current);

    window.addEventListener('resize', checkOverflow);

    return () => {
      clearTimeout(checkTimeout);
      if (observer) observer.disconnect();
      window.removeEventListener('resize', checkOverflow);
    };
  }, [children]);

  const shouldAnimate = force || isOverflowing;

  return (
    <div 
      ref={containerRef} 
      className={`overflow-hidden relative max-w-full ${className}`}
      title={typeof children === 'string' ? children : undefined}
    >
      <div 
        className={shouldAnimate ? "inline-flex w-max animate-marquee-loop" : "flex items-center w-full min-w-0"}
        style={shouldAnimate ? { animationDuration: `${speedSeconds}s` } : undefined}
      >
        <div 
          ref={contentRef} 
          className={`inline-flex items-center shrink-0 ${shouldAnimate ? '' : 'w-full min-w-0'}`}
          style={shouldAnimate ? { paddingRight: `${gapPx}px` } : undefined}
        >
          {children}
        </div>
        
        {shouldAnimate && (
          <div 
            className="inline-flex items-center shrink-0"
            style={{ paddingRight: `${gapPx}px` }}
            aria-hidden="true"
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
