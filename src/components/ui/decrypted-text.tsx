/**
 * DecryptedText - Efeito de texto descriptografado
 * Estilo dossiê secreto da Ordo Realitas
 */

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface DecryptedTextProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
  sequential?: boolean;
  encryptedClassName?: string;
  onComplete?: () => void;
}

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/~';

export function DecryptedText({
  text,
  className,
  speed = 50,
  delay = 0,
  sequential = true,
  encryptedClassName,
  onComplete,
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true);
          setTimeout(() => {
            setIsDecrypting(true);
          }, delay);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [delay, hasStarted]);

  useEffect(() => {
    if (!isDecrypting) return;

    if (sequential) {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex <= text.length) {
          const decrypted = text.slice(0, currentIndex);
          const encrypted = text.slice(currentIndex).split('').map(() => 
            characters[Math.floor(Math.random() * characters.length)]
          ).join('');
          setDisplayText(decrypted + encrypted);
          currentIndex++;
        } else {
          clearInterval(interval);
          onComplete?.();
        }
      }, speed);

      return () => clearInterval(interval);
    } else {
      // Random reveal
      const revealed = new Set<number>();
      const interval = setInterval(() => {
        if (revealed.size >= text.length) {
          clearInterval(interval);
          setDisplayText(text);
          onComplete?.();
          return;
        }

        // Reveal a random unrevealed character
        let index;
        do {
          index = Math.floor(Math.random() * text.length);
        } while (revealed.has(index));
        revealed.add(index);

        const result = text.split('').map((char, i) => {
          if (revealed.has(i)) return char;
          return characters[Math.floor(Math.random() * characters.length)];
        }).join('');
        setDisplayText(result);
      }, speed);

      return () => clearInterval(interval);
    }
  }, [isDecrypting, text, speed, sequential, onComplete]);

  // Initialize with encrypted text
  useEffect(() => {
    if (!hasStarted) {
      setDisplayText(text.split('').map(() => 
        characters[Math.floor(Math.random() * characters.length)]
      ).join(''));
    }
  }, [text, hasStarted]);

  return (
    <span 
      ref={elementRef}
      className={cn(
        'font-mono',
        !hasStarted && encryptedClassName,
        className
      )}
    >
      {displayText}
    </span>
  );
}
