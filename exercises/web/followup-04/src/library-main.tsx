import { createRoot } from "react-dom/client";
import * as Dialog from "@radix-ui/react-dialog";
import "./style.css";
import "./dialog-demo.css";
const root = document.getElementById("library-app");
if (!root) throw new Error("缺少 library-app");
createRoot(root).render(
  <main>
    <h1>组件库对照实验</h1>
    <p>普通链接/按钮仍可自己写，复杂焦点行为可以借助经过核对的组件。</p>
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button type="button">查看活动说明</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title>活动说明</Dialog.Title>
          <Dialog.Description>
            本地演示活动；此处没有报名服务。
          </Dialog.Description>
          <label>
            备注
            <input placeholder="输入虚构备注" />
          </label>
          <Dialog.Close asChild>
            <button type="button">关闭说明</button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </main>,
);
