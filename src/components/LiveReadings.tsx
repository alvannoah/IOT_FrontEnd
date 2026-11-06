import type { ReactNode } from "react";
import type { Status } from "../api/client";
import { useStatus } from "../api/queries";
import { formatNumber, timeAgo } from "../lib/format";
import { Card, Stat, StatusBadge } from "./ui";

function SensorBadge({ sensor, stale }: { sensor: Status["water"]; stale: boolean }) {
  // Online was true when the backend last replied, which says nothing about now.
  if (stale) return <StatusBadge kind="warning">Status unknown</StatusBadge>;
  if (!sensor.last_seen) return <StatusBadge kind="warning">No data yet</StatusBadge>;
  if (!sensor.online) return <StatusBadge kind="critical">Offline, last seen {timeAgo(sensor.last_seen)}</StatusBadge>;
  return <StatusBadge kind="good">Online, {timeAgo(sensor.last_seen)}</StatusBadge>;
}

/** Old values are dimmed when a sensor is offline so they can't be mistaken for live ones. */
function Readings({ online, children }: { online: boolean; children: ReactNode }) {
  return <div className={`grid grid-cols-2 gap-4 sm:grid-cols-3 ${online ? "" : "opacity-50"}`}>{children}</div>;
}

export function LiveReadings() {
  const { data, isRefetchError: stale } = useStatus();
  if (!data) return null;

  const { electricity, water, latest_electricity: power, latest_water: flow } = data;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Electricity now" aside={<SensorBadge sensor={electricity} stale={stale} />}>
        {power ? (
          <Readings online={electricity.online && !stale}>
            <Stat label="Power" value={`${formatNumber(power.power, 1)} W`} />
            <Stat label="Voltage" value={`${formatNumber(power.voltage, 1)} V`} />
            <Stat label="Current" value={`${formatNumber(power.current)} A`} />
            <Stat label="Frequency" value={`${formatNumber(power.frequency, 1)} Hz`} />
            <Stat label="Power factor" value={formatNumber(power.power_factor)} />
            <Stat label="Meter total" value={`${formatNumber(power.energy)} kWh`} />
          </Readings>
        ) : (
          <p className="text-sm text-ink-muted">Waiting for the first reading from the PZEM meter.</p>
        )}
      </Card>
      <Card title="Water now" aside={<SensorBadge sensor={water} stale={stale} />}>
        {flow ? (
          <Readings online={water.online && !stale}>
            <Stat label="Flow rate" value={`${formatNumber(flow.flow_rate)} L/min`} />
            <Stat label="Meter total" value={`${formatNumber(flow.total_volume, 1)} L`} />
          </Readings>
        ) : (
          <p className="text-sm text-ink-muted">Waiting for the first reading from the YF-S201 meter.</p>
        )}
      </Card>
    </div>
  );
}
