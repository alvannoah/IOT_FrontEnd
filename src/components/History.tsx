import type { ReactNode } from "react";
import type { ElectricityBucket, Interval, WaterBucket } from "../api/client";
import { useHistory, useSummary } from "../api/queries";
import { formatBucket, formatMoney, formatNumber } from "../lib/format";
import { fillGaps, type RangePreset } from "../lib/ranges";
import { BucketBars, BucketLines, ChartBlock, LineLegend, type TooltipRow } from "./Charts";
import { Card, Notice } from "./ui";

const ELECTRICITY = "var(--electricity)";
const WATER = "var(--water)";
const PEAK = "var(--peak)";

interface Column<T> {
  label: string;
  value: (row: T) => string;
}

function DataTable<T extends { timestamp: string }>({
  rows,
  columns,
  interval,
}: {
  rows: T[];
  columns: Column<T>[];
  interval: Interval;
}) {
  return (
    <details className="mt-4">
      <summary className="cursor-pointer text-sm text-ink-secondary">View as a table</summary>
      <div className="mt-2 max-h-80 overflow-auto rounded-lg border border-line">
        <table className="w-full text-right text-sm tabular-nums">
          <thead className="sticky top-0 bg-surface text-xs text-ink-muted">
            <tr>
              <th scope="col" className="px-3 py-2 text-left font-medium">
                Period
              </th>
              {columns.map((column) => (
                <th key={column.label} scope="col" className="px-3 py-2 font-medium whitespace-nowrap">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {[...rows].reverse().map((row) => (
              <tr key={row.timestamp}>
                <th scope="row" className="px-3 py-1.5 text-left font-normal whitespace-nowrap">
                  {formatBucket(Date.parse(row.timestamp), interval)}
                </th>
                {columns.map((column) => (
                  <td key={column.label} className="px-3 py-1.5 whitespace-nowrap">
                    {column.value(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function HistoryCard({
  title,
  isEmpty,
  isStale,
  error,
  children,
}: {
  title: string;
  isEmpty: boolean;
  isStale: boolean;
  error: Error | null;
  children: ReactNode;
}) {
  return (
    <Card title={title}>
      {error && (
        <div className="mb-3">
          <Notice kind="critical">Graphs not updated: {error.message}</Notice>
        </div>
      )}
      {isEmpty ? (
        <p className="py-10 text-center text-sm text-ink-muted">No readings in this period.</p>
      ) : (
        <div className={`transition-opacity ${isStale ? "opacity-50" : ""}`}>{children}</div>
      )}
    </Card>
  );
}

function sum<T>(rows: T[], value: (row: T) => number): number {
  return rows.reduce((total, row) => total + value(row), 0);
}

export function ElectricityHistory({ preset }: { preset: RangePreset }) {
  const query = useHistory<ElectricityBucket>("electricity", preset);
  const currency = useSummary().data?.currency;
  const history = query.data;
  const rows = history?.buckets ?? [];
  const interval = history?.interval ?? preset.interval;
  const data = history ? fillGaps(rows, history.start, history.end, interval) : [];
  const peak = rows.length ? Math.max(...rows.map((row) => row.max_power)) : null;

  const energyRows = (row: (typeof data)[number]): TooltipRow[] =>
    row.energy_kwh == null
      ? []
      : [
          { label: "kWh", value: formatNumber(row.energy_kwh, 3), color: ELECTRICITY },
          { label: "cost", value: formatMoney(row.cost, currency) },
        ];
  const powerRows = (row: (typeof data)[number]): TooltipRow[] =>
    row.avg_power == null
      ? []
      : [
          { label: "W average", value: formatNumber(row.avg_power, 1), color: ELECTRICITY },
          { label: "W peak", value: formatNumber(row.max_power, 1), color: PEAK },
        ];

  return (
    <HistoryCard
      title="Electricity history"
      isEmpty={query.isSuccess && rows.length === 0}
      isStale={query.isPlaceholderData}
      error={query.error}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartBlock title="Energy used" headline={`${formatNumber(sum(rows, (row) => row.energy_kwh))} kWh in this period`}>
          <BucketBars data={data} dataKey="energy_kwh" color={ELECTRICITY} interval={interval} tooltip={energyRows} />
        </ChartBlock>
        <ChartBlock
          title="Power (W)"
          headline={peak == null ? undefined : `Peak ${formatNumber(peak, 1)} W`}
          legend={
            <LineLegend
              items={[
                { label: "Average", color: ELECTRICITY },
                { label: "Peak", color: PEAK },
              ]}
            />
          }
        >
          <BucketLines
            data={data}
            interval={interval}
            tooltip={powerRows}
            series={[
              { dataKey: "max_power", label: "Peak", color: PEAK },
              { dataKey: "avg_power", label: "Average", color: ELECTRICITY },
            ]}
          />
        </ChartBlock>
      </div>
      <DataTable
        rows={rows}
        interval={interval}
        columns={[
          { label: "kWh", value: (row) => formatNumber(row.energy_kwh, 3) },
          { label: "Cost", value: (row) => formatMoney(row.cost, currency) },
          { label: "Avg W", value: (row) => formatNumber(row.avg_power, 1) },
          { label: "Peak W", value: (row) => formatNumber(row.max_power, 1) },
          { label: "Avg V", value: (row) => formatNumber(row.avg_voltage, 1) },
          { label: "Avg A", value: (row) => formatNumber(row.avg_current) },
          { label: "Avg Hz", value: (row) => formatNumber(row.avg_frequency, 1) },
          { label: "Avg PF", value: (row) => formatNumber(row.avg_power_factor) },
        ]}
      />
    </HistoryCard>
  );
}

export function WaterHistory({ preset }: { preset: RangePreset }) {
  const query = useHistory<WaterBucket>("water", preset);
  const currency = useSummary().data?.currency;
  const history = query.data;
  const rows = history?.buckets ?? [];
  const interval = history?.interval ?? preset.interval;
  const data = history ? fillGaps(rows, history.start, history.end, interval) : [];
  const peak = rows.length ? Math.max(...rows.map((row) => row.max_flow_rate)) : null;

  const volumeRows = (row: (typeof data)[number]): TooltipRow[] =>
    row.volume_litres == null
      ? []
      : [
          { label: "L", value: formatNumber(row.volume_litres, 1), color: WATER },
          { label: "cost", value: formatMoney(row.cost, currency) },
        ];
  const flowRows = (row: (typeof data)[number]): TooltipRow[] =>
    row.avg_flow_rate == null
      ? []
      : [
          { label: "L/min average", value: formatNumber(row.avg_flow_rate), color: WATER },
          { label: "L/min peak", value: formatNumber(row.max_flow_rate), color: PEAK },
        ];

  return (
    <HistoryCard
      title="Water history"
      isEmpty={query.isSuccess && rows.length === 0}
      isStale={query.isPlaceholderData}
      error={query.error}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartBlock title="Water used" headline={`${formatNumber(sum(rows, (row) => row.volume_litres), 1)} L in this period`}>
          <BucketBars data={data} dataKey="volume_litres" color={WATER} interval={interval} tooltip={volumeRows} />
        </ChartBlock>
        <ChartBlock
          title="Flow rate (L/min)"
          headline={peak == null ? undefined : `Peak ${formatNumber(peak)} L/min`}
          legend={
            <LineLegend
              items={[
                { label: "Average", color: WATER },
                { label: "Peak", color: PEAK },
              ]}
            />
          }
        >
          <BucketLines
            data={data}
            interval={interval}
            tooltip={flowRows}
            series={[
              { dataKey: "max_flow_rate", label: "Peak", color: PEAK },
              { dataKey: "avg_flow_rate", label: "Average", color: WATER },
            ]}
          />
        </ChartBlock>
      </div>
      <DataTable
        rows={rows}
        interval={interval}
        columns={[
          { label: "Litres", value: (row) => formatNumber(row.volume_litres, 1) },
          { label: "Cost", value: (row) => formatMoney(row.cost, currency) },
          { label: "Avg L/min", value: (row) => formatNumber(row.avg_flow_rate) },
          { label: "Peak L/min", value: (row) => formatNumber(row.max_flow_rate) },
        ]}
      />
    </HistoryCard>
  );
}
