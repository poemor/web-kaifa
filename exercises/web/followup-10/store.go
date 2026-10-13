package main

import (
	"context"
	"errors"
	"sort"
	"strings"
	"sync"
	"unicode/utf8"
)

var ErrMissing = errors.New("record not found")
var ErrConflict = errors.New("record conflicts")

type Event struct {
	ID       int64  `json:"id"`
	Title    string `json:"title"`
	Location string `json:"location"`
}

type EventInput struct {
	Title    string `json:"title"`
	Location string `json:"location"`
}

// HTTP 层与存储层只约定方法，不约定内存或 SQL 的内部结构。
type Store interface {
	List(context.Context, string, int, int) ([]Event, error)
	Get(context.Context, int64) (Event, error)
	Create(context.Context, EventInput) (Event, error)
	Update(context.Context, int64, EventInput) (Event, error)
	Delete(context.Context, int64) error
	Ping(context.Context) error
}

func NormalizeInput(in EventInput) (EventInput, error) {
	in.Title = strings.TrimSpace(in.Title)
	in.Location = strings.TrimSpace(in.Location)
	if n := utf8.RuneCountInString(in.Title); n < 1 || n > 100 {
		return in, errors.New("标题须为 1–100 个字符")
	}
	if utf8.RuneCountInString(in.Location) > 100 {
		return in, errors.New("地点不能超过 100 个字符")
	}
	return in, nil
}

type MemoryStore struct {
	mu    sync.Mutex
	next  int64
	items map[int64]Event
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{next: 2, items: map[int64]Event{1: {ID: 1, Title: "图论训练", Location: "教室 A"}}}
}
func (s *MemoryStore) Ping(context.Context) error { return nil }
func (s *MemoryStore) List(_ context.Context, q string, limit, offset int) ([]Event, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	all := []Event{}
	for _, e := range s.items {
		if strings.Contains(strings.ToLower(e.Title), strings.ToLower(q)) {
			all = append(all, e)
		}
	}
	sort.Slice(all, func(i, j int) bool { return all[i].ID < all[j].ID })
	if offset >= len(all) {
		return []Event{}, nil
	}
	end := offset + limit
	if end > len(all) {
		end = len(all)
	}
	return all[offset:end], nil
}
func (s *MemoryStore) Get(_ context.Context, id int64) (Event, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	e, ok := s.items[id]
	if !ok {
		return e, ErrMissing
	}
	return e, nil
}
func (s *MemoryStore) Create(_ context.Context, in EventInput) (Event, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	e := Event{ID: s.next, Title: in.Title, Location: in.Location}
	s.next++
	s.items[e.ID] = e
	return e, nil
}
func (s *MemoryStore) Update(_ context.Context, id int64, in EventInput) (Event, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.items[id]; !ok {
		return Event{}, ErrMissing
	}
	e := Event{ID: id, Title: in.Title, Location: in.Location}
	s.items[id] = e
	return e, nil
}
func (s *MemoryStore) Delete(_ context.Context, id int64) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.items[id]; !ok {
		return ErrMissing
	}
	delete(s.items, id)
	return nil
}
