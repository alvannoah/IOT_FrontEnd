import { useSetValve, useStatus, useValveHistory } from "../api/queries";
import { formatDateTime } from "../lib/format";
import { BUTTON_CLASS, Card, Notice } from "./ui";

export function ValveControl() {
  const status = useStatus();
  const setValve = useSetValve();
  const data = status.data;

  if (!data) return <Card title="Water valve">{null}</Card>;

  const isOpen = data.valve_open;
  const deviceOffline = !data.electricity.online && !data.water.online;

  return (
    <Card title="Water valve">
      <div className="text-3xl font-semibold">{isOpen ? "Open" : "Closed"}</div>
      <p className="mt-1 text-sm text-ink-muted">
        {status.isRefetchError ? "Last known state." : "The Arduino applies this the next time it checks in."}
      </p>

      <button
        type="button"
        className={`${BUTTON_CLASS} mt-4 w-full`}
        disabled={setValve.isPending || status.isRefetchError}
        onClick={() => setValve.mutate(!isOpen)}
      >
        {setValve.isPending ? "Sending…" : isOpen ? "Close valve" : "Open valve"}
      </button>

      <div className="mt-3 space-y-2 empty:hidden">
        {deviceOffline && (
          <Notice kind="warning">The device looks offline, so a change waits until it reconnects.</Notice>
        )}
        {setValve.isError && <Notice kind="critical">Valve not changed: {setValve.error.message}</Notice>}
      </div>
    </Card>
  );
}

export function ValveLog() {
  const { data } = useValveHistory(8);

  return (
    <Card title="Recent valve changes">
      {data?.length ? (
        <ul className="divide-y divide-line text-sm">
          {data.map((event) => (
            <li key={event.changed_at + event.is_open} className="flex justify-between gap-4 py-2">
              <span>{event.is_open ? "Opened" : "Closed"}</span>
              <span className="text-ink-muted tabular-nums">{formatDateTime(event.changed_at)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">No changes yet.</p>
      )}
    </Card>
  );
}
