import { type FormEvent, useState } from "react";
import type { Tariff } from "../api/client";
import { useSetTariff, useTariffs } from "../api/queries";
import { BUTTON_CLASS, Card, Notice } from "./ui";

const LABELS: Record<Tariff["resource"], { name: string; unit: string }> = {
  electricity: { name: "Electricity", unit: "kWh" },
  water: { name: "Water", unit: "m³" },
};

function TariffForm({ tariff }: { tariff: Tariff }) {
  const setTariff = useSetTariff(tariff.resource);
  // Null means untouched, so the field shows the saved price.
  const [draft, setDraft] = useState<string | null>(null);

  const text = draft ?? tariff.price_per_unit?.toString() ?? "";
  const price = Number(text);
  const valid = text.trim() !== "" && Number.isFinite(price) && price >= 0;
  const { name, unit } = LABELS[tariff.resource];
  const inputId = `tariff-${tariff.resource}`;

  function submit(event: FormEvent) {
    event.preventDefault();
    setTariff.mutate(price, { onSuccess: () => setDraft(null) });
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor={inputId} className="text-sm text-ink-secondary">
        {name} ({tariff.currency} per {unit})
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id={inputId}
          type="number"
          min="0"
          step="any"
          value={text}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Not set"
          className="w-full min-w-0 rounded-lg border border-line bg-transparent px-3 py-2 text-sm tabular-nums"
        />
        <button type="submit" className={BUTTON_CLASS} disabled={!valid || draft === null || setTariff.isPending}>
          {setTariff.isPending ? "Saving…" : "Save"}
        </button>
      </div>
      {setTariff.isError && (
        <div className="mt-2">
          <Notice kind="critical">Price not saved: {setTariff.error.message}</Notice>
        </div>
      )}
    </form>
  );
}

export function Tariffs() {
  const { data } = useTariffs();

  return (
    <Card title="Prices">
      <div className="space-y-4">
        {data?.map((tariff) => <TariffForm key={tariff.resource} tariff={tariff} />)}
        {data?.some((tariff) => tariff.price_per_unit == null) && (
          <Notice kind="warning">Readings received while a price isn't set stay unpriced for good.</Notice>
        )}
        <p className="text-xs text-ink-muted">A new price applies to new readings. Past costs don't change.</p>
      </div>
    </Card>
  );
}
