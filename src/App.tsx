import { useState } from "react";
import { useRefetchOnReconnect, useStatus } from "./api/queries";
import { ElectricityHistory, WaterHistory } from "./components/History";
import { LiveReadings } from "./components/LiveReadings";
import { KpiRow, MonthCard } from "./components/Summary";
import { Tariffs } from "./components/Tariffs";
import { Notice } from "./components/ui";
import { ChangeLog, LedControl, WaterControl } from "./components/Controls";
import { RANGE_PRESETS } from "./lib/ranges";

function ConnectionNotice() {
  const { error, data, dataUpdatedAt } = useStatus();
  if (!error) return null;

  return (
    <Notice kind="critical">
      {error.message}.{" "}
      {data
        ? `Showing the last data received at ${new Date(dataUpdatedAt).toLocaleTimeString()}.`
        : "Check that the FastAPI server is running on port 8000."}
    </Notice>
  );
}

function RangeFilter({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div role="group" aria-label="Time range for graphs" className="flex flex-wrap gap-1">
      {RANGE_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          aria-pressed={preset.id === value}
          onClick={() => onChange(preset.id)}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            preset.id === value ? "bg-wash font-semibold text-ink" : "text-ink-secondary hover:bg-wash"
          }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}

export function App() {
  useRefetchOnReconnect();
  const [rangeId, setRangeId] = useState("24h");
  const preset = RANGE_PRESETS.find((option) => option.id === rangeId) ?? RANGE_PRESETS[1];

  return (
    <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      <header>
        <h1 className="text-xl font-semibold">Electricity &amp; water monitor</h1>
        <p className="text-sm text-ink-muted">Group 4 IoT project</p>
      </header>

      <ConnectionNotice />

      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="grid content-start gap-4">
          <MonthCard />
          <KpiRow />
        </div>
        <div className="grid content-start gap-4">
          <WaterControl />
          <LedControl />
        </div>
      </div>
      <LiveReadings />

      <div className="pt-4">
        <h2 className="mb-2 text-base font-semibold">History</h2>
        <RangeFilter value={rangeId} onChange={setRangeId} />
      </div>
      <ElectricityHistory preset={preset} />
      <WaterHistory preset={preset} />

      <div className="grid gap-4 md:grid-cols-2">
        <Tariffs />
        <ChangeLog />
      </div>
    </main>
  );
}
