'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, Transition } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export type GlowEffectProps = {
  className?: string;
  style?: React.CSSProperties;
  colors?: string[];
  mode?: 'rotate' | 'pulse' | 'breathe' | 'colorShift' | 'flowHorizontal' | 'static';
  blur?: number | 'softest' | 'soft' | 'medium' | 'strong' | 'stronger' | 'strongest' | 'none';
  transition?: Transition;
  scale?: number;
  duration?: number;
};

export function GlowEffect({
  className,
  style,
  colors = ['#FF5733', '#33FF57', '#3357FF', '#F1C40F'],
  mode = 'rotate',
  blur = 'medium',
  transition,
  scale = 1,
  duration = 5,
}: GlowEffectProps) {
  const BASE_TRANSITION = {
    repeat: Infinity,
    duration: duration,
    ease: 'linear',
  };

  const animations = {
    rotate: {
      background: [
        `conic-gradient(from 0deg at 50% 50%, ${colors.join(', ')})`,
        `conic-gradient(from 360deg at 50% 50%, ${colors.join(', ')})`,
      ],
      transition: {
        ...(transition ?? BASE_TRANSITION),
      },
    },
    pulse: {
      background: colors.map(
        color => `radial-gradient(circle at 50% 50%, ${color} 0%, transparent 100%)`,
      ),
      scale: [1 * scale, 1.1 * scale, 1 * scale],
      opacity: [0.5, 0.8, 0.5],
      transition: {
        ...(transition ?? {
          ...BASE_TRANSITION,
          repeatType: 'mirror',
        }),
      },
    },
    breathe: {
      background: [
        ...colors.map(color => `radial-gradient(circle at 50% 50%, ${color} 0%, transparent 100%)`),
      ],
      scale: [1 * scale, 1.05 * scale, 1 * scale],
      transition: {
        ...(transition ?? {
          ...BASE_TRANSITION,
          repeatType: 'mirror',
        }),
      },
    },
    colorShift: {
      background: colors.map((color, index) => {
        const nextColor = colors[(index + 1) % colors.length];
        return `conic-gradient(from 0deg at 50% 50%, ${color} 0%, ${nextColor} 50%, ${color} 100%)`;
      }),
      transition: {
        ...(transition ?? {
          ...BASE_TRANSITION,
          repeatType: 'mirror',
        }),
      },
    },
    flowHorizontal: {
      background: colors.map(color => {
        const nextColor = colors[(colors.indexOf(color) + 1) % colors.length];
        return `linear-gradient(to right, ${color}, ${nextColor})`;
      }),
      transition: {
        ...(transition ?? {
          ...BASE_TRANSITION,
          repeatType: 'mirror',
        }),
      },
    },
    static: {
      background: `linear-gradient(to right, ${colors.join(', ')})`,
    },
  };

  const getBlurClass = (blur: GlowEffectProps['blur']) => {
    if (typeof blur === 'number') {
      return `blur-[${blur}px]`;
    }

    const presets = {
      softest: 'blur-sm',
      soft: 'blur',
      medium: 'blur-md',
      strong: 'blur-lg',
      stronger: 'blur-xl',
      strongest: 'blur-xl',
      none: 'blur-none',
    };

    return presets[blur as keyof typeof presets];
  };

  return (
    <motion.div
      style={
        {
          ...style,
          '--scale': scale,
          willChange: 'transform',
          backfaceVisibility: 'hidden',
        } as React.CSSProperties
      }
      animate={animations[mode]}
      className={cn(
        'pointer-events-none absolute inset-0 h-full w-full',
        'scale-[var(--scale)] transform-gpu',
        getBlurClass(blur),
        className,
      )}
    />
  );
}

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  glowColors?: string[];
  glowMode?: GlowEffectProps['mode'];
  glowBlur?: GlowEffectProps['blur'];
  glowScale?: number;
  glowDuration?: number;
  className?: string;
  icon?: React.ReactNode;
  showArrow?: boolean;
}

export function GlowButton({
  children,
  glowColors = ['#4263eb', '#3b5bdb', '#5c7cfa', '#748ffc'],
  glowMode = 'breathe',
  glowBlur = 'medium',
  glowScale = 1.2,
  glowDuration = 3,
  className,
  icon,
  showArrow = true,
  ...props
}: GlowButtonProps) {
  return (
    <div className='relative group overflow-hidden rounded-full'>
      <GlowEffect
        colors={glowColors}
        mode={glowMode}
        blur={glowBlur}
        scale={glowScale}
        duration={glowDuration}
      />
      <Button
        className={cn(
          'relative z-10 rounded-full px-5 py-2 text-white bg-black hover:bg-gray-800 border-none shadow-md flex items-center justify-center gap-2 group-hover:translate-y-[-1px] transition-transform hover:cursor-pointer',
          className,
        )}
        {...props}>
        <span className='flex items-center gap-2'>
          {children}
          {showArrow && (
            <ArrowRight
              size={16}
              className='group-hover:translate-x-0.5 transition-transform duration-300'
            />
          )}
        </span>
        {icon && (
          <span className='ml-1 group-hover:translate-x-0.5 transition-transform duration-300'>
            {icon}
          </span>
        )}
      </Button>
    </div>
  );
}
