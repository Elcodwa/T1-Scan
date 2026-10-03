import { METRIC_DEFINITIONS } from "./definitions";
import type { MetricDefinition } from "./types";

export const metricsForView = (view: "front" | "profile"): MetricDefinition[] => METRIC_DEFINITIONS.filter((m) => m.view === view);
export const getMetric = (id: string): MetricDefinition | undefined => METRIC_DEFINITIONS.find((m) => m.id === id);
export { METRIC_DEFINITIONS };
