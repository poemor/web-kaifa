export interface EventItem { id: number; title: string; location: string }
export type EventInput = Omit<EventItem,'id'>;
export type LoadState = {kind:'loading'} | {kind:'error';message:string} | {kind:'ready';items:EventItem[]};
