import type { EventItem } from "../events";
type Props = {
  event: EventItem;
  favorite?: boolean;
  onFavorite?: (id: number) => void;
};
export function EventCard({ event, favorite, onFavorite }: Props) {
  return (
    <li className="card">
      <h2>
        <a href={`#/events/${event.id}`}>{event.title}</a>
      </h2>
      <p>
        {event.startTime} · {event.location}
      </p>
      {onFavorite && (
        <button
          type="button"
          aria-pressed={favorite}
          onClick={() => onFavorite(event.id)}
        >
          {favorite ? "取消收藏" : "收藏"}：{event.title}
        </button>
      )}
    </li>
  );
}
