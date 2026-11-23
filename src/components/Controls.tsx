import type { UseMutationResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useLedHistory, useSetLed, useSetValve, useStatus, useValveHistory } from "../api/queries";
import { formatDateTime } from "../lib/format";
import { useNow } from "../lib/useNow";
import { BUTTON_CLASS, Card, Notice } from "./ui";

/** The firmware stops the pump by itself this long after the water is turned on. */
const PUMP_LIMIT_MS = 60_000;

function ToggleCard({
  title,
  isOn,
  thing,
  mutation,
  notices,
}: {
  title: string;
  isOn: boolean;
  /** Names what the button switches, e.g. "Turn water off". */
  thing: string;
  mutation: UseMutationResult<unknown, Error, boolean>;
  notices?: ReactNode;
}) {
  const status = useStatus();
  const data = status.data!;
  const deviceOffline = !data.electricity.online && !data.water.online;

  return (
    <Card title={title}>
      <div className="text-3xl font-semibold">{isOn ? "On" : "Off"}</div>
      <p className="mt-1 text-sm text-ink-muted">
        {status.isRefetchError ? "Last known state." : "The Arduino applies this the next time it checks in."}
      </p>

      <button
        type="button"
        className={`${BUTTON_CLASS} mt-4 w-full`}
        disabled={mutation.isPending || status.isRefetchError}
        onClick={() => mutation.mutate(!isOn)}
      >
        {mutation.isPending ? "Sending…" : `Turn ${thing} ${isOn ? "off" : "on"}`}
      </button>

      <div className="mt-3 space-y-2 empty:hidden">
        {deviceOffline && (
          <Notice kind="warning">The device looks offline, so a change waits until it reconnects.</Notice>
        )}
        {notices}
        {mutation.isError && (
          <Notice kind="critical">
            {title} not changed: {mutation.error.message}
          </Notice>
        )}
      </div>
    </Card>
  );
}

export function WaterControl() {
  const { data } = useStatus();
  const setValve = useSetValve();
  const latest = useValveHistory(8).data?.[0];
  const now = useNow(5_000);
  if (!data) return <Card title="Water">{null}</Card>;

  // The backend can't see the pump's safety stop and keeps reporting the water as on.
  const pumpStopped =
    data.valve_open && latest?.is_open && now - Date.parse(latest.changed_at) > PUMP_LIMIT_MS;

  return (
    <ToggleCard
      title="Water"
      isOn={data.valve_open}
      thing="water"
      mutation={setValve}
      notices={
        pumpStopped ? (
          <Notice kind="warning">
            The pump has probably stopped: it switches itself off after 60 seconds. Turn the water off and on to
            run it again.
          </Notice>
        ) : (
          data.valve_open && <p className="text-xs text-ink-muted">The pump stops by itself after 60 seconds.</p>
        )
      }
    />
  );
}

export function LedControl() {
  const { data } = useStatus();
  const setLed = useSetLed();
  if (!data) return <Card title="LED strip">{null}</Card>;

  return <ToggleCard title="LED strip" isOn={data.led_on} thing="LED strip" mutation={setLed} />;
}

export function ChangeLog() {
  const water = useValveHistory(8).data ?? [];
  const led = useLedHistory(8).data ?? [];
  const changes = [
    ...water.map((event) => ({ at: event.changed_at, label: event.is_open ? "Water on" : "Water off" })),
    ...led.map((event) => ({ at: event.changed_at, label: event.is_on ? "LED strip on" : "LED strip off" })),
  ]
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, 8);

  return (
    <Card title="Recent changes">
      {changes.length ? (
        <ul className="divide-y divide-line text-sm">
          {changes.map((change, index) => (
            <li key={`${change.at}-${change.label}-${index}`} className="flex justify-between gap-4 py-2">
              <span>{change.label}</span>
              <span className="text-ink-muted tabular-nums">{formatDateTime(change.at)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">No changes yet.</p>
      )}
    </Card>
  );
}
