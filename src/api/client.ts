import type { components } from "./schema";

type Schemas = components["schemas"];

export type Status = Schemas["StatusOut"];
export type Summary = Schemas["SummaryOut"];
export type UsageFigures = Schemas["UsageFigures"];
export type ElectricityBucket = Schemas["ElectricityBucket"];
export type WaterBucket = Schemas["WaterBucket"];
export type Tariff = Schemas["TariffOut"];
export type ValveEvent = Schemas["ValveEventOut"];
export type Resource = "electricity" | "water";
export type Interval = "minute" | "hour" | "day";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export class ApiError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(BASE_URL + path, {
      ...init,
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    });
  } catch {
    throw new ApiError("Can't reach the backend");
  }
  // The dev proxy answers with these when the backend itself is down.
  if ([502, 503, 504].includes(response.status)) {
    throw new ApiError("Can't reach the backend");
  }
  if (!response.ok) {
    throw new ApiError(await errorMessage(response));
  }
  return response.json();
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const { detail } = await response.json();
    if (typeof detail === "string") return detail;
    // FastAPI validation errors arrive as a list.
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  } catch {
    // Not JSON, e.g. the dev proxy reporting that the backend is down.
  }
  return `The backend replied with an error (${response.status})`;
}

export const api = {
  status: () => request<Status>("/api/status"),
  summary: () => request<Summary>("/api/summary"),
  tariffs: () => request<Tariff[]>("/api/tariffs"),
  valveHistory: (limit: number) => request<ValveEvent[]>(`/api/valve/history?limit=${limit}`),

  history: <T>(resource: Resource, interval: Interval, start: Date, end: Date) => {
    const query = new URLSearchParams({
      interval,
      start: start.toISOString(),
      end: end.toISOString(),
    });
    return request<T[]>(`/api/${resource}/history?${query}`);
  },

  setValve: (open: boolean) =>
    request<ValveEvent>("/api/valve", { method: "POST", body: JSON.stringify({ open }) }),

  setTariff: (resource: Resource, pricePerUnit: number) =>
    request<Tariff>(`/api/tariffs/${resource}`, {
      method: "PUT",
      body: JSON.stringify({ price_per_unit: pricePerUnit }),
    }),
};
