import { describe, expect, it } from "vitest";
import { filterEvents, normalizeKeyword, parseEvents } from "./events";
const events = parseEvents([
  { id: 1, title: "图论训练", start_time: "2026-11-01" },
  { id: 2, title: "Web 分享", start_time: "2026-11-02" },
]);
describe("筛选与数据边界", () => {
  it("搜索图论只返回编号1", () =>
    expect(filterEvents(events, " 图论 ").map((e) => e.id)).toEqual([1]));
  it("英文忽略大小写", () =>
    expect(filterEvents(events, "web").map((e) => e.id)).toEqual([2]));
  it("没有匹配返回空数组", () =>
    expect(filterEvents(events, "不存在")).toEqual([]));
  it("空关键字返回全部", () =>
    expect(filterEvents(events, "")).toHaveLength(2));
  it("undefined关键字安全收窄", () =>
    expect(normalizeKeyword(undefined)).toBe(""));
  it("缺少标题拒绝外部数据", () =>
    expect(() => parseEvents([{ id: 1, start_time: "2026" }])).toThrow(
      "缺少字段",
    ));
  it("重复编号拒绝", () =>
    expect(() =>
      parseEvents([
        { id: 1, title: "A", start_time: "1" },
        { id: 1, title: "B", start_time: "2" },
      ]),
    ).toThrow("重复"));
  it("缺失地点在适配层补待定", () => expect(events[0].location).toBe("待定"));
});
