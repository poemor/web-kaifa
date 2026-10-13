import { useState } from "react";
export function PerformancePanel() {
  const [optimized, setOptimized] = useState(false);
  const file = optimized ? "banner-optimized.svg" : "banner-original.svg";
  return (
    <section>
      <h2>资源体积测量实验</h2>
      <p>
        同一幅自制图形；原版故意保留大量无用注释，只用于对照传输体积，不代表真实线上性能基准。
      </p>
      <button type="button" onClick={() => setOptimized((value) => !value)}>
        {optimized ? "查看原版资源" : "切换优化资源"}
      </button>
      <p role="status">
        当前：{optimized ? "优化版" : "原版"}；在 Network 查看 SVG 大小。
      </p>
      <img
        className="banner"
        src={import.meta.env.BASE_URL + file}
        width="640"
        height="180"
        alt="蓝色圆形活动标识"
        loading="lazy"
      />
    </section>
  );
}
