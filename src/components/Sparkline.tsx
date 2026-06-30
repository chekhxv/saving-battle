import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';
import type { SparkPoint } from '../types.ts';

interface SparklineProps {
  data: SparkPoint[];
  color: string;
  height?: number;
}

export default function Sparkline({ data, color, height = 56 }: SparklineProps) {
  const id = `spark-${color.replace('#', '')}`;
  if (!data || data.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-xs text-white/30"
        style={{ height }}
      >
        график появится, когда наберётся история
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.5} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis hide domain={['dataMin', 'dataMax']} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${id})`}
          isAnimationActive
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
