import { readFavorites, writeFavorites } from "./favorites";
import { PerformancePanel } from "./components/PerformancePanel";
import { useEffect, useRef, useState } from "react";
import { type Scenario } from "./api";
import { useEvents } from "./useEvents";
import { useHashRoute } from "./route";
import { StateView } from "./components/StateView";
import { EventResults } from "./components/EventResults";
import { RegistrationForm } from "./components/RegistrationForm";
export default function App() {
  const route = useHashRoute();
  const [initialFavorites] = useState(readFavorites);
  const [favorites, setFavorites] = useState(initialFavorites.ids);
  const [favoriteWarning, setFavoriteWarning] = useState(
    initialFavorites.warning,
  );
  function toggleFavorite(id: number) {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }
  useEffect(() => {
    if (initialFavorites.writeable && !writeFavorites(favorites))
      setFavoriteWarning("收藏无法保存，本次仅暂存，刷新会丢失。");
  }, [favorites, initialFavorites.writeable]);
  const [keyword, setKeyword] = useState("");
  const [scenario, setScenario] = useState<Scenario>("normal");
  const [attempt, setAttempt] = useState(0);
  const state = useEvents(scenario, attempt);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [route]);
  const detail =
    route.page === "detail" && state.status === "success"
      ? state.events.find((event) => event.id === route.id)
      : undefined;
  const title =
    route.page === "home"
      ? "社团活动首页"
      : route.page === "events"
        ? "活动列表"
        : route.page === "detail"
          ? "活动详情"
          : route.page === "resources"
            ? "学习资料"
            : "页面不存在";
  return (
    <>
      <a
        className="skip"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        跳到正文
      </a>
      <main id="main" tabIndex={-1}>
        <nav aria-label="主导航">
          <a href="#/">首页</a>
          <a href="#/events">活动列表</a>
          <a href="#/resources">学习资料</a>
        </nav>
        <h1 ref={heading} tabIndex={-1}>
          {title}
        </h1>
        <p className="muted">
          本地固定演示数据，不提供账号、报名或服务器保存。
        </p>
        <p>收藏保存在当前浏览器，不会上传或跨设备同步。</p>
        {favoriteWarning && <p role="alert">{favoriteWarning}</p>}
        <label>
          数据场景
          <select
            value={scenario}
            onChange={(event) => setScenario(event.target.value as Scenario)}
          >
            <option value="normal">正常</option>
            <option value="empty">空数据</option>
            <option value="invalid">字段错误</option>
            <option value="http">HTTP错误</option>
            <option value="broken">JSON错误</option>
            <option value="business">业务错误</option>
          </select>
        </label>
        {route.page === "home" && (
          <p>
            从<a href="#/events">活动列表</a>
            搜索活动，再打开详情。数据状态可在上方切换。
          </p>
        )}
        {(route.page === "home" ||
          route.page === "events" ||
          route.page === "detail") && (
          <StateView
            state={state}
            onRetry={() => {
              heading.current?.focus();
              setAttempt((value) => value + 1);
            }}
          />
        )}
        {(route.page === "home" || route.page === "events") &&
          state.status === "success" && (
            <EventResults
              events={state.events}
              keyword={keyword}
              onKeyword={setKeyword}
              favorites={favorites}
              onFavorite={toggleFavorite}
            />
          )}
        {route.page === "detail" &&
          state.status === "success" &&
          (detail ? (
            <section>
              <h2>{detail.title}</h2>
              <p>
                {detail.startTime} · {detail.location}
              </p>
              <a href="#/events">返回活动列表</a>
              <RegistrationForm />
            </section>
          ) : (
            <p role="status">
              找不到这项活动，请<a href="#/events">返回列表</a>。
            </p>
          ))}
        {route.page === "resources" && (
          <>
            <PerformancePanel />
            <section>
              <h2>学习资料入口</h2>
              <p>本站使用本地 fixtures JSON 演示接口，不展示实时用户数。</p>
              <a
                href="https://react.dev/learn"
                target="_blank"
                rel="noreferrer"
              >
                React 官方学习
              </a>
            </section>
          </>
        )}
        {route.page === "missing" && (
          <p>
            链接格式无法识别，请<a href="#/">返回首页</a>。
          </p>
        )}
      </main>
    </>
  );
}
