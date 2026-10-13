import { expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegistrationForm } from "./RegistrationForm";
it("本地字段检查说明未提交，并在编辑后清除旧反馈", async () => {
  const user = userEvent.setup();
  render(<RegistrationForm />);
  await user.click(screen.getByRole("button", { name: "检查字段" }));
  expect(screen.getByRole("alert").textContent).toBe("请填写姓名");
  await user.type(screen.getByLabelText("姓名"), "测试同学");
  await user.type(screen.getByLabelText("邮箱"), "demo@example.com");
  await user.click(screen.getByRole("button", { name: "检查字段" }));
  expect(screen.getByRole("status").textContent).toContain("尚未提交");
  await user.type(screen.getByLabelText("姓名"), "A");
  expect(screen.getByRole("status").textContent).toBe("");
});
