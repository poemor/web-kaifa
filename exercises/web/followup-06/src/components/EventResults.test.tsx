import { expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { EventResults } from "./EventResults";
const events = [
  { id: 1, title: "图论训练", startTime: "2026-11-01" },
  { id: 2, title: "算法交流", startTime: "2026-11-02" },
];
function Harness() {
  const [keyword, setKeyword] = useState("");
  return (
    <EventResults
      events={events}
      keyword={keyword}
      onKeyword={setKeyword}
      favorites={[]}
      onFavorite={() => {}}
    />
  );
}
it("输入后改变真实列表，并处理空搜索结果", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await user.type(screen.getByRole("searchbox", { name: "搜索活动" }), "图论");
  expect(screen.getByRole("link", { name: "图论训练" })).toBeTruthy();
  expect(screen.queryByRole("link", { name: "算法交流" })).toBeNull();
  await user.clear(screen.getByRole("searchbox", { name: "搜索活动" }));
  await user.type(
    screen.getByRole("searchbox", { name: "搜索活动" }),
    "不存在",
  );
  expect(screen.getByRole("status").textContent).toContain("没有匹配活动");
});
