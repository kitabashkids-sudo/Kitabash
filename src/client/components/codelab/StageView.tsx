// Draws the Code Lab stage (480×360, Scratch coordinates) from the VM state.
import type { PointerEvent } from 'react';
import { BACKDROPS, type VM } from '../../../lib/scratch/vm.ts';

function Backdrop({ name }: { name: string }) {
  switch (name) {
    case 'grid':
      return (
        <g>
          <rect x={-240} y={-180} width={480} height={360} fill="#ffffff" />
          {Array.from({ length: 19 }, (_, i) => -225 + i * 25).map((x) => (
            <line key={'v' + x} x1={x} y1={-180} x2={x} y2={180} stroke={x % 100 === 0 ? '#c9d2e3' : '#eef1f7'} strokeWidth={1} />
          ))}
          {Array.from({ length: 15 }, (_, i) => -175 + i * 25).map((y) => (
            <line key={'h' + y} x1={-240} y1={y} x2={240} y2={y} stroke={y % 100 === 0 ? '#c9d2e3' : '#eef1f7'} strokeWidth={1} />
          ))}
          <line x1={-240} y1={0} x2={240} y2={0} stroke="#8b97b0" strokeWidth={1.5} />
          <line x1={0} y1={-180} x2={0} y2={180} stroke="#8b97b0" strokeWidth={1.5} />
          {[-200, -100, 100, 200].map((x) => (
            <text key={'tx' + x} x={x} y={14} fontSize={10} fill="#6b7280" textAnchor="middle">
              x {x}
            </text>
          ))}
          {[-100, 100].map((y) => (
            <text key={'ty' + y} x={6} y={-y + 4} fontSize={10} fill="#6b7280">
              y {y}
            </text>
          ))}
          <text x={6} y={-6} fontSize={10} fill="#6b7280">
            (0, 0)
          </text>
        </g>
      );
    case 'space':
      return (
        <g>
          <rect x={-240} y={-180} width={480} height={360} fill="#141a33" />
          {Array.from({ length: 40 }, (_, i) => (
            <circle key={i} cx={((i * 97) % 480) - 240} cy={((i * 53) % 360) - 180} r={(i % 3) * 0.6 + 0.6} fill="#fff" opacity={0.8} />
          ))}
          <circle cx={170} cy={-120} r={30} fill="#f5c84c" opacity={0.9} />
        </g>
      );
    case 'grass':
      return (
        <g>
          <rect x={-240} y={-180} width={480} height={360} fill="#bde4ff" />
          <rect x={-240} y={60} width={480} height={120} fill="#7bcf6b" />
          <circle cx={-180} cy={-120} r={26} fill="#ffd54a" />
        </g>
      );
    case 'party':
      return (
        <g>
          <defs>
            <linearGradient id="kb-party" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#5b2a86" />
              <stop offset="1" stopColor="#c2185b" />
            </linearGradient>
          </defs>
          <rect x={-240} y={-180} width={480} height={360} fill="url(#kb-party)" />
          {Array.from({ length: 30 }, (_, i) => (
            <rect key={i} x={((i * 71) % 480) - 240} y={((i * 37) % 300) - 170} width={6} height={6} rx={1} fill={['#ffd54a', '#4dd0e1', '#ff8a65', '#aed581'][i % 4]} transform={`rotate(${i * 23} ${((i * 71) % 480) - 237} ${((i * 37) % 300) - 167})`} />
          ))}
          <rect x={-240} y={140} width={480} height={40} fill="#2b1846" />
        </g>
      );
    case 'sea':
      return (
        <g>
          <defs>
            <linearGradient id="kb-sea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#4fc3f7" />
              <stop offset="1" stopColor="#01579b" />
            </linearGradient>
          </defs>
          <rect x={-240} y={-180} width={480} height={360} fill="url(#kb-sea)" />
          <rect x={-240} y={150} width={480} height={30} fill="#e6c98f" />
        </g>
      );
    default:
      return <rect x={-240} y={-180} width={480} height={360} fill="#ffffff" />;
  }
}

export function StageView({ vm, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, dragging }: { vm: VM; onPointerDown?: (e: PointerEvent<SVGSVGElement>) => void; onPointerMove?: (e: PointerEvent<SVGSVGElement>) => void; onPointerUp?: (e: PointerEvent<SVGSVGElement>) => void; onPointerCancel?: (e: PointerEvent<SVGSVGElement>) => void; dragging?: boolean }) {
  const vars = Object.entries(vm.vars);
  const desc = vm.sprites.map((s) => `${s.name} at x ${Math.round(s.x)}, y ${Math.round(s.y)}${s.say ? ` saying “${s.say}”` : ''}${s.visible ? '' : ' (hidden)'}`).join('; ');
  return (
    <svg
      viewBox="-240 -180 480 360"
      className={`block h-auto w-full touch-none rounded-xl border border-line bg-white select-none ${dragging ? 'cursor-grabbing' : ''}`}
      role="img"
      aria-label={`Stage: ${desc}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <Backdrop name={BACKDROPS[vm.backdrop] || 'plain'} />
      {vm.pen.map((l, i) => (
        <line key={i} x1={l.x1} y1={-l.y1} x2={l.x2} y2={-l.y2} stroke={l.color} strokeWidth={l.size} strokeLinecap="round" />
      ))}
      {vm.sprites.map((s, i) => {
        if (!s.visible) return null;
        const size = (48 * s.size) / 100;
        const rot = s.rotation === 'all around' ? s.dir - 90 : 0;
        const flip = s.rotation === 'left-right' && s.dir < 0 ? -1 : 1;
        const costume = s.costumes[s.costume] || '🤖';
        const isText = !/\p{Extended_Pictographic}/u.test(costume);
        return (
          <g key={i} transform={`translate(${s.x} ${-s.y}) rotate(${rot}) scale(${flip} 1)`} style={{ opacity: 1 - s.effects.ghost / 100, filter: s.effects.color ? `hue-rotate(${(s.effects.color * 1.8) % 360}deg)` : undefined }}>
            <text fontSize={size} textAnchor="middle" dominantBaseline="central" fontWeight={isText ? 900 : 400} fill={isText ? s.color || '#9966FF' : undefined} stroke={isText ? '#fff' : undefined} strokeWidth={isText ? size / 30 : undefined} paintOrder="stroke" style={{ fontFamily: isText ? 'system-ui, sans-serif' : undefined }}>
              {costume}
            </text>
          </g>
        );
      })}
      {vm.sprites.map((s, i) => {
        if (!s.visible || !s.say) return null;
        const w = Math.min(220, Math.max(50, s.say.length * 7.5 + 20));
        const bx = Math.max(-238, Math.min(238 - w, s.x + 14));
        const by = Math.max(-178, -s.y - (24 * s.size) / 100 - 40);
        return (
          <g key={'say' + i}>
            <rect x={bx} y={by} width={w} height={30} rx={12} fill="#fff" stroke="#9aa3b8" strokeWidth={1.5} />
            <text x={bx + 10} y={by + 19} fontSize={13} fill="#1d2230">
              {s.say.length > 28 ? s.say.slice(0, 27) + '…' : s.say}
            </text>
          </g>
        );
      })}
      {vars.map(([k, v], i) => (
        <g key={k} transform={`translate(-234 ${-174 + i * 26})`}>
          <rect width={Math.max(80, k.length * 7 + 50)} height={22} rx={5} fill="#e9eef2" stroke="#c4ccd6" />
          <text x={6} y={15} fontSize={11} fill="#575E75">
            {k}
          </text>
          <rect x={Math.max(80, k.length * 7 + 50) - 40} y={3} width={36} height={16} rx={8} fill="#FF8C1A" />
          <text x={Math.max(80, k.length * 7 + 50) - 22} y={15} fontSize={11} fill="#fff" textAnchor="middle" fontWeight={700}>
            {String(typeof v === 'number' ? Math.round(v * 100) / 100 : v).slice(0, 6)}
          </text>
        </g>
      ))}
    </svg>
  );
}
