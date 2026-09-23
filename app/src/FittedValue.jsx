import { useLayoutEffect, useRef } from 'react';

// Preserve every digit when a currency prefix makes a summary too wide.
export default function FittedValue({ children, ...props }) {
  const container = useRef(null);
  const text = useRef(null);
  useLayoutEffect(() => {
    let disposed = false;
    let lastWidth;
    const fit = () => {
      if (disposed) return;
      const available = container.current.clientWidth;
      text.current.style.fontSize = '1em';
      const range = document.createRange();
      range.selectNodeContents(text.current);
      // Font shaping/rounding can change with size; check the rendered result.
      let scale = 1;
      for (let attempt = 0; available > 0 && attempt < 4; attempt++) {
        const width = range.getBoundingClientRect().width;
        if (width <= available) break;
        scale *= (available - 0.5) / width;
        text.current.style.fontSize = `${scale * 100}%`;
      }
    };
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width !== lastWidth) {
        lastWidth = entry.contentRect.width;
        fit();
      }
    });
    observer.observe(container.current);
    fit();
    document.fonts.ready.then(fit);
    return () => { disposed = true; observer.disconnect(); };
  }, [children]);
  return <div {...props} ref={container} className="fitted-value"><span ref={text}>{children}</span></div>;
}
