/**
 * GlitchText - Texto com efeito de glitch paranormal
 * Para elementos do Outro Lado
 */

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface GlitchTextProps {
  text: string;
  className?: string;
  variant?: 'subtle' | 'intense' | 'paranormal';
}

export function GlitchText({
  text,
  className,
  variant = 'subtle',
}: GlitchTextProps) {
  if (variant === 'paranormal') {
    return (
      <motion.span
        className={cn('relative inline-block', className)}
        animate={{
          textShadow: [
            '0 0 0 transparent',
            '2px 2px 0 rgba(139, 0, 0, 0.5), -2px -2px 0 rgba(0, 100, 139, 0.3)',
            '0 0 0 transparent',
            '-1px 1px 0 rgba(139, 0, 0, 0.3), 1px -1px 0 rgba(0, 100, 139, 0.5)',
            '0 0 0 transparent',
          ],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatDelay: 5,
        }}
      >
        {text}
      </motion.span>
    );
  }

  if (variant === 'intense') {
    return (
      <span className={cn('glitch-intense relative inline-block', className)} data-text={text}>
        {text}
        <style>{`
          .glitch-intense {
            animation: glitch-skew 1s infinite linear alternate-reverse;
          }
          .glitch-intense::before,
          .glitch-intense::after {
            content: attr(data-text);
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
          }
          .glitch-intense::before {
            left: 2px;
            text-shadow: -2px 0 #8B0000;
            clip: rect(44px, 450px, 56px, 0);
            animation: glitch-anim 5s infinite linear alternate-reverse;
          }
          .glitch-intense::after {
            left: -2px;
            text-shadow: -2px 0 #00648B;
            clip: rect(44px, 450px, 56px, 0);
            animation: glitch-anim2 5s infinite linear alternate-reverse;
          }
          @keyframes glitch-anim {
            0% { clip: rect(31px, 9999px, 94px, 0); transform: skew(0.15deg); }
            5% { clip: rect(70px, 9999px, 71px, 0); transform: skew(0.55deg); }
            10% { clip: rect(29px, 9999px, 24px, 0); transform: skew(0.75deg); }
            15% { clip: rect(95px, 9999px, 15px, 0); transform: skew(0.25deg); }
            20% { clip: rect(40px, 9999px, 64px, 0); transform: skew(0.95deg); }
            25% { clip: rect(58px, 9999px, 98px, 0); transform: skew(0.05deg); }
            30% { clip: rect(29px, 9999px, 5px, 0); transform: skew(0.65deg); }
            35% { clip: rect(9px, 9999px, 100px, 0); transform: skew(0.85deg); }
            40% { clip: rect(23px, 9999px, 47px, 0); transform: skew(0.35deg); }
            45% { clip: rect(100px, 9999px, 50px, 0); transform: skew(0.45deg); }
            50% { clip: rect(47px, 9999px, 82px, 0); transform: skew(0.15deg); }
            55% { clip: rect(7px, 9999px, 18px, 0); transform: skew(0.95deg); }
            60% { clip: rect(76px, 9999px, 65px, 0); transform: skew(0.25deg); }
            65% { clip: rect(88px, 9999px, 37px, 0); transform: skew(0.55deg); }
            70% { clip: rect(54px, 9999px, 91px, 0); transform: skew(0.75deg); }
            75% { clip: rect(16px, 9999px, 43px, 0); transform: skew(0.05deg); }
            80% { clip: rect(62px, 9999px, 22px, 0); transform: skew(0.65deg); }
            85% { clip: rect(35px, 9999px, 78px, 0); transform: skew(0.85deg); }
            90% { clip: rect(81px, 9999px, 14px, 0); transform: skew(0.35deg); }
            95% { clip: rect(3px, 9999px, 59px, 0); transform: skew(0.45deg); }
            100% { clip: rect(49px, 9999px, 86px, 0); transform: skew(0.15deg); }
          }
          @keyframes glitch-anim2 {
            0% { clip: rect(65px, 9999px, 100px, 0); transform: skew(0.55deg); }
            5% { clip: rect(52px, 9999px, 74px, 0); transform: skew(0.25deg); }
            10% { clip: rect(79px, 9999px, 85px, 0); transform: skew(0.65deg); }
            15% { clip: rect(26px, 9999px, 29px, 0); transform: skew(0.95deg); }
            20% { clip: rect(97px, 9999px, 38px, 0); transform: skew(0.15deg); }
            25% { clip: rect(33px, 9999px, 67px, 0); transform: skew(0.75deg); }
            30% { clip: rect(45px, 9999px, 12px, 0); transform: skew(0.45deg); }
            35% { clip: rect(86px, 9999px, 95px, 0); transform: skew(0.05deg); }
            40% { clip: rect(14px, 9999px, 56px, 0); transform: skew(0.85deg); }
            45% { clip: rect(71px, 9999px, 23px, 0); transform: skew(0.35deg); }
            50% { clip: rect(59px, 9999px, 41px, 0); transform: skew(0.55deg); }
            55% { clip: rect(8px, 9999px, 88px, 0); transform: skew(0.25deg); }
            60% { clip: rect(42px, 9999px, 9px, 0); transform: skew(0.95deg); }
            65% { clip: rect(93px, 9999px, 61px, 0); transform: skew(0.15deg); }
            70% { clip: rect(21px, 9999px, 77px, 0); transform: skew(0.65deg); }
            75% { clip: rect(68px, 9999px, 34px, 0); transform: skew(0.05deg); }
            80% { clip: rect(37px, 9999px, 99px, 0); transform: skew(0.45deg); }
            85% { clip: rect(84px, 9999px, 46px, 0); transform: skew(0.75deg); }
            90% { clip: rect(19px, 9999px, 72px, 0); transform: skew(0.35deg); }
            95% { clip: rect(56px, 9999px, 17px, 0); transform: skew(0.85deg); }
            100% { clip: rect(91px, 9999px, 53px, 0); transform: skew(0.55deg); }
          }
          @keyframes glitch-skew {
            0% { transform: skew(0deg); }
            10% { transform: skew(0.5deg); }
            20% { transform: skew(-0.5deg); }
            30% { transform: skew(0.3deg); }
            40% { transform: skew(-0.3deg); }
            50% { transform: skew(0deg); }
            60% { transform: skew(0.2deg); }
            70% { transform: skew(-0.2deg); }
            80% { transform: skew(0.1deg); }
            90% { transform: skew(-0.1deg); }
            100% { transform: skew(0deg); }
          }
        `}</style>
      </span>
    );
  }

  // Subtle variant
  return (
    <span className={cn('animate-text-glitch', className)}>
      {text}
    </span>
  );
}
