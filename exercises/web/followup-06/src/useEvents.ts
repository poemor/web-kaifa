import { useEffect, useState } from "react";
import { loadEvents, type Scenario } from "./api";
import type { EventItem } from "./events";
export type LoadState =
  | { status: "loading" }
  | { status: "success"; events: EventItem[] }
  | { status: "error"; message: string };
export function useEvents(scenario: Scenario, attempt: number) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    loadEvents(scenario, controller.signal).then(
      (events) => {
        if (!controller.signal.aborted) setState({ status: "success", events });
      },
      (error: unknown) => {
        if (!controller.signal.aborted)
          setState({
            status: "error",
            message:
              error instanceof Error ? error.message : "未知错误，请重试",
          });
      },
    );
    return () => controller.abort();
  }, [scenario, attempt]);
  return state;
}
