import type { UsageFigures } from "../api/client";
import { useSummary } from "../api/queries";
import { formatMoney, formatNumber } from "../lib/format";
import { Card, Stat } from "./ui";

/** Total cost only adds up the priced resource when the other has no tariff, so say so. */
function costNote(figures: UsageFigures): string | undefined {
  if (figures.total_cost == null) return undefined;
  if (figures.electricity_cost == null) return "Water only, electricity is unpriced";
  if (figures.water_cost == null) return "Electricity only, water is unpriced";
  return undefined;
}

export function MonthCard() {
  const { data } = useSummary();
  if (!data) return <Card title="This month so far">{null}</Card>;

  const { month, currency } = data;
  const priced = month.total_cost != null;

  return (
    <Card title="This month so far">
      <div className={priced ? "text-5xl font-semibold" : "text-3xl font-semibold"}>
        {formatMoney(month.total_cost, currency)}
      </div>
      <p className="mt-1 text-sm text-ink-muted">
        {costNote(month) ?? (priced ? "Total cost" : "Set prices below to see costs for new readings")}
      </p>
      <dl className="mt-5 grid grid-cols-2 gap-4">
        <Stat
          label="Electricity"
          value={`${formatNumber(month.energy_kwh)} kWh`}
          note={formatMoney(month.electricity_cost, currency)}
        />
        <Stat
          label="Water"
          value={`${formatNumber(month.water_litres)} L`}
          note={formatMoney(month.water_cost, currency)}
        />
      </dl>
    </Card>
  );
}

export function KpiRow() {
  const { data } = useSummary();
  if (!data) return null;

  const { today, projected_month: projected, currency } = data;

  return (
    <Card>
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <Stat label="Cost today" value={formatMoney(today.total_cost, currency)} note={costNote(today)} />
        <Stat label="Electricity today" value={`${formatNumber(today.energy_kwh)} kWh`} />
        <Stat label="Water today" value={`${formatNumber(today.water_litres)} L`} />
        <Stat
          label="Projected this month"
          value={projected ? formatMoney(projected.total_cost, currency) : "—"}
          note={
            projected
              ? `${formatNumber(projected.energy_kwh, 1)} kWh and ${formatNumber(projected.water_litres, 0)} L at this rate`
              : undefined
          }
        />
      </div>
    </Card>
  );
}
