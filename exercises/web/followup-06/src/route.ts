import { useEffect, useState } from "react";
export type Route =
  | { page: "home" | "events" | "resources" }
  | { page: "detail"; id: number }
  | { page: "missing" };
export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, "") || "/";
  if (path === "/") return { page: "home" };
  if (path === "/events") return { page: "events" };
  if (path === "/resources") return { page: "resources" };
  const match = /^\/events\/([1-9]\d*)$/.exec(path);
  if (match && Number.isSafeInteger(Number(match[1])))
    return { page: "detail", id: Number(match[1]) };
  return { page: "missing" };
}
export function useHashRoute() {
  const [route, setRoute] = useState(() => parseRoute(location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseRoute(location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}
