import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Interval } from "../api/client";
import { formatAxisNumber, formatBucket, formatTick } from "../lib/format";

const HEIGHT = 220;
const TICK = { fill: "var(--axis-text)", fontSize: 12 };
const MARGIN = { top: 8, right: 8, bottom: 0, left: 0 };

export interface TooltipRow {
  label: string;
  value: string;
  color?: string;
}

type Datum = { time: number } & Record<string, unknown>;

interface ChartProps<T extends Datum> {
  data: T[];
  interval: Interval;
  tooltip: (datum: T) => TooltipRow[];
}

function ChartTooltip<T extends Datum>({
  active,
  datum,
  interval,
  rows,
}: {
  active?: boolean;
  datum?: T;
  interval: Interval;
  rows: (datum: T) => TooltipRow[];
}) {
  if (!active || !datum) return null;
  const items = rows(datum);

  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-sm shadow-md">
      <div className="mb-1 text-xs text-ink-muted">{formatBucket(datum.time, interval)}</div>
      {items.length === 0 && <div className="text-ink-secondary">No readings</div>}
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          {item.color && <span aria-hidden className="h-0.5 w-3 rounded" style={{ background: item.color }} />}
          <span className="font-semibold tabular-nums">{item.value}</span>
          <span className="text-ink-secondary">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function renderTooltip<T extends Datum>(interval: Interval, rows: (datum: T) => TooltipRow[]) {
  return ({ active, payload }: { active?: boolean; payload?: readonly { payload?: unknown }[] }) => (
    <ChartTooltip active={active} datum={payload?.[0]?.payload as T | undefined} interval={interval} rows={rows} />
  );
}

function axes(interval: Interval) {
  return [
    <CartesianGrid key="grid" vertical={false} stroke="var(--grid)" />,
    <XAxis
      key="x"
      dataKey="time"
      tick={TICK}
      tickLine={false}
      axisLine={{ stroke: "var(--axis)" }}
      minTickGap={32}
      tickFormatter={(time: number) => formatTick(time, interval)}
    />,
    <YAxis
      key="y"
      tick={TICK}
      tickLine={false}
      axisLine={false}
      width={48}
      domain={[0, "auto"]}
      tickFormatter={formatAxisNumber}
    />,
  ];
}

export function BucketBars<T extends Datum>({
  data,
  dataKey,
  color,
  interval,
  tooltip,
}: ChartProps<T> & { dataKey: keyof T & string; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={HEIGHT}>
      <BarChart data={data} margin={MARGIN}>
        {axes(interval)}
        <Tooltip
          cursor={{ fill: "var(--wash)" }}
          filterNull={false}
          isAnimationActive={false}
          content={renderTooltip(interval, tooltip)}
        />
        <Bar dataKey={dataKey as string} fill={color} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export interface LineSeries<T> {
  dataKey: keyof T & string;
  label: string;
  color: string;
}

export function BucketLines<T extends Datum>({
  data,
  series,
  interval,
  tooltip,
}: ChartProps<T> & { series: LineSeries<T>[] }) {
  return (
    <ResponsiveContainer width="100%" height={HEIGHT}>
      <LineChart data={data} margin={MARGIN}>
        {axes(interval)}
        <Tooltip
          cursor={{ stroke: "var(--axis)" }}
          filterNull={false}
          isAnimationActive={false}
          content={renderTooltip(interval, tooltip)}
        />
        {series.map(({ dataKey, label, color }) => (
          <Line
            key={dataKey}
            dataKey={dataKey}
            name={label}
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            connectNulls={false}
            isAnimationActive={false}
            activeDot={{ r: 4, fill: color, stroke: "var(--surface)", strokeWidth: 2 }}
            dot={(props: { cx?: number; cy?: number; index: number }) => (
              <IsolatedDot key={props.index} {...props} data={data} dataKey={dataKey} color={color} />
            )}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/** A reading with empty buckets on both sides has no line to sit on, so it needs its own dot. */
function IsolatedDot<T>({
  cx,
  cy,
  index,
  data,
  dataKey,
  color,
}: {
  cx?: number;
  cy?: number;
  index: number;
  data: T[];
  dataKey: keyof T;
  color: string;
}) {
  const isolated = data[index - 1]?.[dataKey] == null && data[index + 1]?.[dataKey] == null;
  if (!isolated || cx == null || cy == null) return null;
  return <circle cx={cx} cy={cy} r={4} fill={color} stroke="var(--surface)" strokeWidth={2} />;
}

export function LineLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-ink-secondary">
      {items.map(({ label, color }) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-0.5 w-4 rounded" style={{ background: color }} />
          {label}
        </span>
      ))}
    </div>
  );
}

export function ChartBlock({
  title,
  headline,
  legend,
  children,
}: {
  title: string;
  headline?: string;
  legend?: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure className="min-w-0">
      <figcaption className="mb-2">
        <div className="text-sm font-medium">{title}</div>
        {headline && <div className="text-xs text-ink-muted">{headline}</div>}
        {legend && <div className="mt-1">{legend}</div>}
      </figcaption>
      {children}
    </figure>
  );
}
