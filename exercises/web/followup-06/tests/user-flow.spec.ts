import { test, expect } from "@playwright/test";
test("搜索→详情→刷新→返回", async ({ page }) => {
  await page.goto("/#/events");
  await page.getByRole("searchbox", { name: "搜索活动" }).fill("图论");
  await expect(
    page.getByRole("link", { name: "算法交流", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "图论训练", exact: true }).click();
  await expect(page).toHaveURL(/#\/events\/1$/);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "图论训练", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "返回活动列表" }).click();
  await expect(
    page.getByRole("heading", { name: "活动列表", exact: true }),
  ).toBeVisible();
});
test("失败→重试→正常；空数据独立文案", async ({ page }) => {
  await page.goto("/#/events");
  await page.getByLabel("数据场景").selectOption("http");
  await expect(page.getByRole("alert")).toContainText("HTTP 404");
  await page.getByLabel("数据场景").selectOption("normal");
  await expect(
    page.getByRole("link", { name: "图论训练", exact: true }),
  ).toBeVisible();
  await page.getByLabel("数据场景").selectOption("empty");
  await expect(page.getByText("暂时没有活动", { exact: true })).toBeVisible();
});
test("断网恢复、加载状态、旧请求不覆盖新结果", async ({ page, context }) => {
  await page.route("**/fixtures/normal.json", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.continue();
  });
  await page.goto("/#/events");
  await expect(page.getByText("正在加载…", { exact: true })).toBeVisible();
  await page.getByLabel("数据场景").selectOption("empty");
  await expect(page.getByText("暂时没有活动", { exact: true })).toBeVisible();
  await page.waitForTimeout(300);
  await expect(
    page.getByRole("link", { name: "图论训练", exact: true }),
  ).toHaveCount(0);
  await context.setOffline(true);
  await page.getByLabel("数据场景").selectOption("normal");
  await expect(page.getByRole("alert")).toContainText("网络连接失败");
  await context.setOffline(false);
  await page.getByRole("button", { name: "重新加载" }).click();
  await expect(
    page.getByRole("link", { name: "图论训练", exact: true }),
  ).toBeVisible();
});
for (const width of [360, 768, 1440]) {
  test(`宽度${width}不横向溢出且键盘可搜`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#/events");
    const search = page.getByRole("searchbox", { name: "搜索活动" });
    await search.focus();
    await page.keyboard.type("图论");
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: "图论训练", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/width-${width}.png`,
      fullPage: true,
    });
  });
}

test("优化图片保留尺寸且实际响应字节减少", async ({ page }) => {
  await page.goto("/#/resources");
  const original = await page.request.get("/banner-original.svg");
  const optimized = await page.request.get("/banner-optimized.svg");
  const before = (await original.body()).length;
  const after = (await optimized.body()).length;
  expect(before).toBeGreaterThan(190000);
  expect(after).toBeLessThan(300);
  await page.getByRole("button", { name: "切换优化资源" }).click();
  await expect(
    page.getByRole("img", { name: "蓝色圆形活动标识" }),
  ).toHaveAttribute("src", /banner-optimized\.svg$/);
  console.log(`Actual SVG response bytes: ${before} -> ${after}`);
});

test("分页、收藏保存、搜索从第1页开始", async ({ page }) => {
  await page.goto("/#/events");
  await page
    .getByRole("button", { name: "收藏：图论训练", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "取消收藏：图论训练", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "下一页", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Go 入门", exact: true }),
  ).toBeVisible();
  await page.getByRole("searchbox", { name: "搜索活动" }).fill("图论");
  await expect(page.getByText("第 1 / 1 页", { exact: true })).toBeVisible();
  await page.getByLabel("只看收藏").check();
  await expect(
    page.getByRole("link", { name: "图论训练", exact: true }),
  ).toBeVisible();
});
test("损坏收藏原文不会静默覆盖", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem("club-frontend-favorites-v1", "{broken"),
  );
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("原记录保留");
  await page
    .getByRole("button", { name: "收藏：图论训练", exact: true })
    .click();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("club-frontend-favorites-v1"),
    ),
  ).toBe("{broken");
});

test("只看收藏取消最后一项后键盘焦点保留在筛选入口", async ({ page }) => {
  await page.goto("/#/events");
  await page
    .getByRole("button", { name: "收藏：图论训练", exact: true })
    .click();
  const filter = page.getByLabel("只看收藏");
  await filter.check();
  await page
    .getByRole("button", { name: "取消收藏：图论训练", exact: true })
    .focus();
  await page.keyboard.press("Space");
  await expect(filter).toBeFocused();
  await expect(
    page.getByRole("button", { name: "取消收藏：图论训练", exact: true }),
  ).toHaveCount(0);
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("link", { name: "图论训练", exact: true }),
  ).toBeVisible();
});

test("键盘重试成功后焦点回到稳定页标题", async ({ page }) => {
  let broken = true;
  await page.route("**/fixtures/normal.json", (route) =>
    broken
      ? route.fulfill({
          status: 500,
          contentType: "application/json",
          body: "{}",
        })
      : route.continue(),
  );
  await page.goto("/#/events");
  await expect(page.getByRole("alert")).toContainText("HTTP 500");
  broken = false;
  await page.getByRole("button", { name: "重新加载" }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("link", { name: "图论训练", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "活动列表", exact: true }),
  ).toBeFocused();
});
