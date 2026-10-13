const key = "club-frontend-favorites-v1";
export function readFavorites(): {
  ids: number[];
  warning: string;
  writeable: boolean;
} {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return { ids: [], warning: "", writeable: true };
    const value: unknown = JSON.parse(raw);
    if (
      !Array.isArray(value) ||
      value.some(
        (id: unknown) =>
          typeof id !== "number" || !Number.isSafeInteger(id) || id < 1,
      )
    )
      throw new Error("收藏数据格式异常");
    return { ids: [...new Set<number>(value)], warning: "", writeable: true };
  } catch {
    return {
      ids: [],
      warning:
        "收藏记录无法读取，原记录保留；本次收藏仅暂存，刷新会丢失。请先在浏览器开发工具保存原记录后再处理。",
      writeable: false,
    };
  }
}
export function writeFavorites(ids: number[]): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
    return true;
  } catch {
    return false;
  }
}
