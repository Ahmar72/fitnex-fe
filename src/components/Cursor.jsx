import { useEffect } from 'react';

/**
 * Cursor Manager
 * Manages clean standard arrow cursor with customizable color (black, white, orange)
 * configured in Profile settings, completely removing bulky animated circles.
 */
export default function Cursor() {
  useEffect(() => {
    const savedColor = localStorage.getItem('fx:cursor-color') || 'black';
    document.documentElement.setAttribute('data-cursor-color', savedColor);
  }, []);

  return null;
}
