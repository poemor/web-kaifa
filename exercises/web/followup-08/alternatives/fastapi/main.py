from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict, Field

app = FastAPI()
events = {1: {"id": 1, "title": "图论训练", "location": "教室 A"}}
next_id = 2

class EventInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(min_length=1, max_length=100)
    location: str = Field(default="", max_length=100)

@app.get("/api/events")
def list_events():
    return list(events.values())

@app.get("/api/events/{event_id}")
def get_event(event_id: int):
    if event_id < 1:
        raise HTTPException(400, "id须为正整数")
    if event_id not in events:
        raise HTTPException(404, "活动不存在")
    return events[event_id]

@app.post("/api/events", status_code=201)
def create_event(value: EventInput):
    global next_id
    if not value.title.strip():
        raise HTTPException(400, "标题不能只有空白")
    item = {"id": next_id, "title": value.title.strip(), "location": value.location.strip()}
    events[next_id] = item
    next_id += 1
    return item

@app.patch("/api/events/{event_id}")
def update_event(event_id: int, value: EventInput):
    get_event(event_id)
    if not value.title.strip():
        raise HTTPException(400, "标题不能只有空白")
    events[event_id] = {"id": event_id, "title": value.title.strip(), "location": value.location.strip()}
    return events[event_id]

@app.delete("/api/events/{event_id}", status_code=204)
def delete_event(event_id: int):
    get_event(event_id)
    del events[event_id]
