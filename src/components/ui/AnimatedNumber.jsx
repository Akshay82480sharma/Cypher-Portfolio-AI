import { useState, useEffect, useRef } from 'react';

/**
 * Animated number counter hook
 */
export function useAnimatedNumber(target, duration = 800) {
  const [current, setCurrent] = useState(0);
  const frameRef = useRef(null);
  const startRef = useRef(null);
  const prevRef = useRef(0);
  
  useEffect(() => {
    const from = prevRef.current;
    const to = target;
    prevRef.current = target;
    
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    
    const animate = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = from + (to - from) * eased;
      
      setCurrent(value);
      
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    
    startRef.current = null;
    frameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);
  
  return current;
}

/**
 * Animated count-up component
 */
export default function AnimatedNumber({ value, formatter, className = '' }) {
  const animatedValue = useAnimatedNumber(value);
  
  const displayValue = formatter 
    ? formatter(animatedValue) 
    : animatedValue.toFixed(2);
  
  return (
    <span className={className}>
      {displayValue}
    </span>
  );
}
