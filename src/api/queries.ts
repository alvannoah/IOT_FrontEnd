import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { RangePreset } from "../lib/ranges";
import { api, type Resource } from "./client";

export function useStatus() {
  return useQuery({ queryKey: ["status"], queryFn: api.status, refetchInterval: 5_000 });
}

/** Queries poll at different speeds and some not at all, so refresh them all once the backend is back. */
export function useRefetchOnReconnect() {
  const client = useQueryClient();
  const { isError } = useStatus();
  const wasDown = useRef(false);

  useEffect(() => {
    if (isError) {
      wasDown.current = true;
    } else if (wasDown.current) {
      wasDown.current = false;
      client.invalidateQueries();
    }
  }, [isError, client]);
}

export function useSummary() {
  return useQuery({ queryKey: ["summary"], queryFn: api.summary, refetchInterval: 30_000 });
}

export function useTariffs() {
  return useQuery({ queryKey: ["tariffs"], queryFn: api.tariffs });
}

export function useValveHistory(limit: number) {
  return useQuery({
    queryKey: ["valve-history", limit],
    queryFn: () => api.valveHistory(limit),
    refetchInterval: 30_000,
  });
}

export function useHistory<T>(resource: Resource, preset: RangePreset) {
  return useQuery({
    queryKey: ["history", resource, preset.id],
    queryFn: async () => {
      const end = new Date();
      const start = new Date(end.getTime() - preset.durationMs);
      const buckets = await api.history<T>(resource, preset.interval, start, end);
      return { start, end, interval: preset.interval, buckets };
    },
    refetchInterval: preset.interval === "minute" ? 20_000 : 60_000,
    // Keep the current chart on screen while another range loads.
    placeholderData: keepPreviousData,
  });
}

export function useSetValve() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.setValve,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["status"] });
      client.invalidateQueries({ queryKey: ["valve-history"] });
    },
  });
}

export function useSetTariff(resource: Resource) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (pricePerUnit: number) => api.setTariff(resource, pricePerUnit),
    onSuccess: () => client.invalidateQueries({ queryKey: ["tariffs"] }),
  });
}
