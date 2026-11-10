import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

/**
 * useMobile hook adapted from human-atlas architecture.
 * Determines if the current viewport width is below the mobile breakpoint (768px).
 */
export function useMobile(breakpoint = MOBILE_BREAKPOINT): boolean {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoint;
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < breakpoint);

    return () => mql.removeEventListener('change', onChange);
  }, [breakpoint]);

  return isMobile;
}
