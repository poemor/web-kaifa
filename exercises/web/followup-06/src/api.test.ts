import { afterEach, expect, it, vi } from "vitest";
import { loadEvents } from "./api";
afterEach(() => vi.unstubAllGlobals());
it("404 不会被当成成功JSON", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("{}", { status: 404 })),
  );
  await expect(loadEvents()).rejects.toMatchObject({ kind: "http" });
});
it("网络拒绝与HTTP错误可区分", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
  await expect(loadEvents()).rejects.toMatchObject({ kind: "network" });
});
it("合法JSON但业务失败可区分", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response('{"ok":false}')),
  );
  await expect(loadEvents()).rejects.toMatchObject({ kind: "business" });
});
it("数据缺字段不能靠类型断言蒙混", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('[{"id":1}]')));
  await expect(loadEvents()).rejects.toMatchObject({ kind: "data" });
});
