import { useRef, useState } from "react";
import { filterEvents, type EventItem } from "../events";
import { EventCard } from "./EventCard";
import { SearchBox } from "./SearchBox";
type Props = {
  events: EventItem[];
  keyword: string;
  onKeyword: (value: string) => void;
  favorites: number[];
  onFavorite: (id: number) => void;
};
export function EventResults({
  events,
  keyword,
  onKeyword,
  favorites,
  onFavorite,
}: Props) {
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const favoriteFilter = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const found = filterEvents(events, keyword).filter(
    (event) => !onlyFavorites || favorites.includes(event.id),
  );
  const pageSize = 2;
  const totalPages = Math.max(1, Math.ceil(found.length / pageSize));
  const activePage = Math.min(page, totalPages);
  const visible = found.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize,
  );
  return (
    <section>
      <SearchBox
        value={keyword}
        onChange={(value) => {
          onKeyword(value);
          setPage(1);
        }}
      />
      <label>
        <input
          type="checkbox"
          ref={favoriteFilter}
          checked={onlyFavorites}
          onChange={(event) => {
            setOnlyFavorites(event.target.checked);
            setPage(1);
          }}
        />
        只看收藏
      </label>
      <p role="status">
        {events.length === 0
          ? "暂时没有活动"
          : found.length === 0
            ? "没有匹配活动，请修改关键词或关闭只看收藏"
            : `找到 ${found.length} 个活动`}
      </p>
      <ul className="cards">
        {visible.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            favorite={favorites.includes(event.id)}
            onFavorite={(id) => {
              // 在过滤视图取消收藏会移除当前按钮，先将焦点交给仍存在的筛选入口。
              if (onlyFavorites) favoriteFilter.current?.focus();
              onFavorite(id);
            }}
          />
        ))}
      </ul>
      {found.length > 0 && (
        <nav className="paging" aria-label="列表分页">
          <button
            type="button"
            disabled={activePage === 1}
            onClick={() => setPage(activePage - 1)}
          >
            上一页
          </button>
          <span>
            第 {activePage} / {totalPages} 页
          </span>
          <button
            type="button"
            disabled={activePage === totalPages}
            onClick={() => setPage(activePage + 1)}
          >
            下一页
          </button>
        </nav>
      )}
    </section>
  );
}
