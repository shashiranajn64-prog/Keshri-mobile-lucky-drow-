import React, { useEffect, useRef } from 'react';
import { WHEEL_SLICE_COLORS } from '../constants';
import { playTickSound } from '../utils/sound';

interface SpinWheelProps {
  prizes: string[];
  rotation: number;
  isSpinning: boolean;
  muted?: boolean;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  // 0 deg is at 12 o'clock (top)
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeSlice(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M',
    cx,
    cy,
    'L',
    start.x,
    start.y,
    'A',
    r,
    r,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
    'Z',
  ].join(' ');
}

function splitPrizeLabel(label: string): string[] {
  const words = label.trim().split(/\s+/);
  if (words.length <= 2 && label.length <= 14) return [label];
  if (words.length === 2) return words;
  const mid = Math.ceil(words.length / 2);
  const line1 = words.slice(0, mid).join(' ');
  const line2 = words.slice(mid).join(' ');
  return [line1, line2];
}

export const SpinWheel: React.FC<SpinWheelProps> = ({
  prizes,
  rotation,
  isSpinning,
  muted = false,
}) => {
  const safePrizes = prizes.length > 0 ? prizes : ['Free Gift'];
  const count = safePrizes.length;
  const sliceAngle = 360 / count;
  const wheelRef = useRef<HTMLDivElement>(null);
  const lastSliceIndexRef = useRef<number>(-1);

  // Track visual rotation during CSS transition for synchronized tick audio
  useEffect(() => {
    if (!isSpinning) {
      lastSliceIndexRef.current = -1;
      return;
    }

    let rafId = 0;
    const pollRotation = () => {
      if (wheelRef.current) {
        const style = window.getComputedStyle(wheelRef.current);
        const transform = style.transform;
        if (transform && transform !== 'none') {
          const match = transform.match(/matrix\(([^)]+)\)/);
          if (match) {
            const values = match[1].split(',').map(Number);
            const angleRad = Math.atan2(values[1], values[0]);
            const angleDeg = ((angleRad * 180) / Math.PI + 360) % 360;
            const currentSlice = Math.floor(angleDeg / sliceAngle);
            if (
              lastSliceIndexRef.current !== -1 &&
              currentSlice !== lastSliceIndexRef.current
            ) {
              playTickSound(muted);
            }
            lastSliceIndexRef.current = currentSlice;
          }
        }
      }
      rafId = requestAnimationFrame(pollRotation);
    };

    rafId = requestAnimationFrame(pollRotation);
    return () => cancelAnimationFrame(rafId);
  }, [isSpinning, sliceAngle, muted]);

  const size = 400;
  const center = size / 2;
  const outerRadius = 188;
  const innerRadius = 172;
  const bulbCount = 16;

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-full max-w-[360px] sm:max-w-[410px] mx-auto">
      {/* Top Pointer */}
      <div
        className="relative z-20 -mb-5 flex flex-col items-center pointer-events-none"
        aria-hidden="true"
      >
        <svg
          width="48"
          height="52"
          viewBox="0 0 48 52"
          fill="none"
          className="drop-shadow-[0_6px_12px_rgba(0,0,0,0.65)]"
        >
          <path
            d="M24 50L5 14C3.5 11 5.6 4 10 4H38C42.4 4 44.5 11 43 14L24 50Z"
            fill="url(#pointerGrad)"
            stroke="#FFFBEB"
            strokeWidth="2.5"
          />
          <circle cx="24" cy="14" r="5" fill="#060F24" />
          <defs>
            <linearGradient
              id="pointerGrad"
              x1="24"
              y1="4"
              x2="24"
              y2="50"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#FDE047" />
              <stop offset="0.55" stopColor="#F59E0B" />
              <stop offset="1" stopColor="#EA580C" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Wheel Container */}
      <div className="relative w-full aspect-square rounded-full p-2 bg-gradient-to-b from-amber-300 via-amber-500 to-orange-700 shadow-[0_18px_50px_rgba(0,0,0,0.65)]">
        <div
          ref={wheelRef}
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning
              ? 'transform 4500ms cubic-bezier(0.12, 0.85, 0.14, 1)'
              : 'none',
          }}
          className="w-full h-full rounded-full will-change-transform"
        >
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="w-full h-full overflow-visible"
            role="img"
            aria-label="Lucky Draw Spin Wheel"
          >
            <defs>
              <radialGradient id="rimGold" cx="50%" cy="50%" r="50%">
                <stop offset="82%" stopColor="#0B1A38" />
                <stop offset="93%" stopColor="#B45309" />
                <stop offset="100%" stopColor="#FBBF24" />
              </radialGradient>
              <radialGradient id="hubGrad" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
              </radialGradient>
            </defs>

            {/* Outer Rim */}
            <circle cx={center} cy={center} r={outerRadius + 10} fill="#08142E" />

            {/* Decorative Rim Studs */}
            {Array.from({ length: bulbCount }).map((_, idx) => {
              const angle = (idx * 360) / bulbCount;
              const pos = polarToCartesian(center, center, outerRadius - 2, angle);
              return (
                <circle
                  key={idx}
                  cx={pos.x}
                  cy={pos.y}
                  r={4.2}
                  fill={idx % 2 === 0 ? '#FEF08A' : '#F97316'}
                  stroke="#060F24"
                  strokeWidth="1"
                />
              );
            })}

            {/* Wheel Slices */}
            {safePrizes.map((prize, idx) => {
              const startAngle = idx * sliceAngle;
              const endAngle = (idx + 1) * sliceAngle;
              const midAngle = startAngle + sliceAngle / 2;
              const color = WHEEL_SLICE_COLORS[idx % WHEEL_SLICE_COLORS.length];
              const lines = splitPrizeLabel(prize);
              const fontSize =
                count >= 8 ? 11.5 : count >= 6 ? 12.5 : 14;

              return (
                <g key={`${idx}-${prize}`}>
                  <path
                    d={describeSlice(center, center, innerRadius, startAngle, endAngle)}
                    fill={color.bg}
                    stroke="#07122B"
                    strokeWidth="2.5"
                  />
                  {/* Radial Prize Text */}
                  <g
                    transform={`translate(${center}, ${center}) rotate(${midAngle - 90})`}
                  >
                    <text
                      x={innerRadius * 0.61}
                      y={0}
                      fill={color.text}
                      fontSize={fontSize}
                      fontWeight="700"
                      fontFamily="Outfit, Plus Jakarta Sans, sans-serif"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {lines.length === 1 ? (
                        <tspan x={innerRadius * 0.61} dy="0">
                          {lines[0]}
                        </tspan>
                      ) : (
                        <>
                          <tspan x={innerRadius * 0.62} dy="-0.55em">
                            {lines[0]}
                          </tspan>
                          <tspan x={innerRadius * 0.62} dy="1.15em">
                            {lines[1]}
                          </tspan>
                        </>
                      )}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Inner Ring Border */}
            <circle
              cx={center}
              cy={center}
              r={innerRadius}
              fill="none"
              stroke="#FBBF24"
              strokeWidth="3.5"
            />

            {/* Center Hub */}
            <circle
              cx={center}
              cy={center}
              r={36}
              fill="url(#hubGrad)"
              stroke="#07122B"
              strokeWidth="4"
            />
            <circle
              cx={center}
              cy={center}
              r={26}
              fill="#071530"
              stroke="#FDE047"
              strokeWidth="1.5"
            />
            <text
              x={center}
              y={center + 1}
              fill="#FBBF24"
              fontSize="11"
              fontWeight="800"
              fontFamily="Outfit, sans-serif"
              textAnchor="middle"
              dominantBaseline="central"
              letterSpacing="0.06em"
            >
              KESHRI
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
};
