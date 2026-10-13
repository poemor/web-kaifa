export interface EventItem {
  id: number;
  title: string;
  startTime: string;
  location?: string;
}
export function normalizeKeyword(value: string | undefined): string {
  return typeof value === "string" ? value.trim().toLocaleLowerCase() : "";
}
export function filterEvents(
  events: EventItem[],
  keyword: string,
): EventItem[] {
  const q = normalizeKeyword(keyword);
  return events.filter((event) => event.title.toLocaleLowerCase().includes(q));
}
export function parseEvents(value: unknown): EventItem[] {
  if (!Array.isArray(value)) throw new Error("活动数据应为数组");
  const seen = new Set<number>();
  return value.map((row: unknown, index): EventItem => {
    if (
      typeof row !== "object" ||
      row === null ||
      !("id" in row) ||
      !("title" in row) ||
      !("start_time" in row)
    ) {
      throw new Error(`第 ${index + 1} 条活动缺少字段`);
    }
    if (
      typeof row.id !== "number" ||
      !Number.isSafeInteger(row.id) ||
      row.id < 1 ||
      seen.has(row.id)
    ) {
      throw new Error(`第 ${index + 1} 条活动编号无效或重复`);
    }
    if (
      typeof row.title !== "string" ||
      !row.title.trim() ||
      typeof row.start_time !== "string" ||
      !row.start_time.trim()
    ) {
      throw new Error(`第 ${index + 1} 条活动标题或时间无效`);
    }
    if (
      "location" in row &&
      row.location !== null &&
      typeof row.location !== "string"
    ) {
      throw new Error(`第 ${index + 1} 条活动地点应为文字`);
    }
    seen.add(row.id);
    return {
      id: row.id,
      title: row.title.trim(),
      startTime: row.start_time,
      location:
        "location" in row &&
        typeof row.location === "string" &&
        row.location.trim()
          ? row.location.trim()
          : "待定",
    };
  });
}
