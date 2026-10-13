import { filterEvents, type EventItem } from "../events";
import { EventCard } from "./EventCard";
import { SearchBox } from "./SearchBox";
export function EventResults({
  events,
  keyword,
  onKeyword,
}: {
  events: EventItem[];
  keyword: string;
  onKeyword: (value: string) => void;
}) {
  const found = filterEvents(events, keyword);
  return (
    <section>
      <SearchBox value={keyword} onChange={onKeyword} />
      <p role="status">
        {events.length === 0
          ? "暂时没有活动"
          : found.length === 0
            ? "没有匹配活动，请修改关键词"
            : `找到 ${found.length} 个活动`}
      </p>
      <ul className="cards">
        {found.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </ul>
    </section>
  );
}
