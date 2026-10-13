import { parseEvents, type EventItem } from "./events";
export type Scenario =
  "normal" | "empty" | "invalid" | "business" | "http" | "broken";
export class RequestError extends Error {
  constructor(
    public kind: "network" | "http" | "data" | "business",
    message: string,
  ) {
    super(message);
  }
}
export async function loadEvents(
  scenario: Scenario = "normal",
  signal?: AbortSignal,
): Promise<EventItem[]> {
  const base = import.meta.env.VITE_API_BASE || "fixtures/";
  const filename = scenario === "http" ? "missing.json" : scenario + ".json";
  const url = new URL(
    base + filename,
    new URL(import.meta.env.BASE_URL, document.baseURI),
  );
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (error: unknown) {
    if (signal?.aborted) throw error;
    throw new RequestError("network", "网络连接失败，请检查网络后重试");
  }
  if (!response.ok)
    throw new RequestError("http", `HTTP ${response.status}：请求未成功`);
  try {
    const value: unknown = await response.json();
    if (
      typeof value === "object" &&
      value !== null &&
      "ok" in value &&
      value.ok === false
    ) {
      throw new RequestError("business", "演示服务暂停，请稍后重试");
    }
    return parseEvents(value);
  } catch (error: unknown) {
    if (error instanceof RequestError) throw error;
    throw new RequestError(
      "data",
      error instanceof SyntaxError
        ? "响应不是可读取的 JSON，请检查接口地址或文件内容"
        : error instanceof Error
          ? error.message
          : "数据无法读取",
    );
  }
}
