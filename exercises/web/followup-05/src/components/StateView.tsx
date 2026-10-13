import type { LoadState } from "../useEvents";
export function StateView({
  state,
  onRetry,
}: {
  state: LoadState;
  onRetry: () => void;
}) {
  if (state.status === "loading") return <p role="status">正在加载…</p>;
  if (state.status === "error")
    return (
      <section>
        <p role="alert" className="error">
          {state.message}
        </p>
        <button type="button" onClick={onRetry}>
          重新加载
        </button>
      </section>
    );
  if (state.events.length === 0)
    return <p role="status">暂时没有活动，请稍后再来。</p>;
  return null;
}
