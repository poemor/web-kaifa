package main

import (
	"context"
	"sync"
)

type Member struct {
	ID       int64  `json:"id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	Hash     string `json:"-"`
}
type Registration struct {
	ID       int64 `json:"id"`
	EventID  int64 `json:"eventId"`
	MemberID int64 `json:"memberId"`
}
type SecureStore interface {
	Store
	FindMember(context.Context, string) (Member, error)
	MemberByID(context.Context, int64) (Member, error)
	CreateMember(context.Context, string, string, string) (Member, error)
	ListRegistrations(context.Context, int64) ([]Registration, error)
	Register(context.Context, int64, int64) (Registration, error)
	CancelRegistration(context.Context, int64, int64) error
}
type MemorySecureStore struct {
	*MemoryStore
	identityMu        sync.Mutex
	users             map[int64]Member
	regs              map[int64]Registration
	nextUser, nextReg int64
}

func NewMemorySecureStore() *MemorySecureStore {
	return &MemorySecureStore{MemoryStore: NewMemoryStore(), users: map[int64]Member{}, regs: map[int64]Registration{}, nextUser: 1, nextReg: 1}
}
func (s *MemorySecureStore) FindMember(_ context.Context, name string) (Member, error) {
	s.identityMu.Lock()
	defer s.identityMu.Unlock()
	for _, u := range s.users {
		if u.Username == name {
			return u, nil
		}
	}
	return Member{}, ErrMissing
}
func (s *MemorySecureStore) MemberByID(_ context.Context, id int64) (Member, error) {
	s.identityMu.Lock()
	defer s.identityMu.Unlock()
	u, ok := s.users[id]
	if !ok {
		return u, ErrMissing
	}
	return u, nil
}
func (s *MemorySecureStore) CreateMember(_ context.Context, name, hash, role string) (Member, error) {
	s.identityMu.Lock()
	defer s.identityMu.Unlock()
	for _, u := range s.users {
		if u.Username == name {
			return Member{}, ErrConflict
		}
	}
	u := Member{ID: s.nextUser, Username: name, Hash: hash, Role: role}
	s.nextUser++
	s.users[u.ID] = u
	return u, nil
}
func (s *MemorySecureStore) ListRegistrations(_ context.Context, memberID int64) ([]Registration, error) {
	s.identityMu.Lock()
	defer s.identityMu.Unlock()
	out := []Registration{}
	for _, r := range s.regs {
		if r.MemberID == memberID {
			out = append(out, r)
		}
	}
	return out, nil
}
func (s *MemorySecureStore) Register(_ context.Context, memberID, eventID int64) (Registration, error) {
	s.MemoryStore.mu.Lock()
	defer s.MemoryStore.mu.Unlock()
	s.identityMu.Lock()
	defer s.identityMu.Unlock()
	if _, ok := s.items[eventID]; !ok {
		return Registration{}, ErrMissing
	}
	if _, ok := s.users[memberID]; !ok {
		return Registration{}, ErrMissing
	}
	for _, r := range s.regs {
		if r.MemberID == memberID && r.EventID == eventID {
			return Registration{}, ErrConflict
		}
	}
	r := Registration{ID: s.nextReg, EventID: eventID, MemberID: memberID}
	s.nextReg++
	s.regs[r.ID] = r
	return r, nil
}
func (s *MemorySecureStore) Delete(_ context.Context, id int64) error {
	s.MemoryStore.mu.Lock()
	defer s.MemoryStore.mu.Unlock()
	s.identityMu.Lock()
	defer s.identityMu.Unlock()
	if _, ok := s.items[id]; !ok {
		return ErrMissing
	}
	delete(s.items, id)
	for key, r := range s.regs {
		if r.EventID == id {
			delete(s.regs, key)
		}
	}
	return nil
}
func (s *MemorySecureStore) CancelRegistration(_ context.Context, id, memberID int64) error {
	s.identityMu.Lock()
	defer s.identityMu.Unlock()
	r, ok := s.regs[id]
	if !ok || r.MemberID != memberID {
		return ErrMissing
	}
	delete(s.regs, id)
	return nil
}

type SQLSecureStore struct{ *SQLStore }

func scanMember(row interface{ Scan(...any) error }) (Member, error) {
	var u Member
	err := row.Scan(&u.ID, &u.Username, &u.Hash, &u.Role)
	return u, databaseError(err)
}
func (s *SQLSecureStore) FindMember(ctx context.Context, name string) (Member, error) {
	return scanMember(s.db.QueryRowContext(ctx, "SELECT id,username,coalesce(password_hash,''),role FROM members WHERE username=$1", name))
}
func (s *SQLSecureStore) MemberByID(ctx context.Context, id int64) (Member, error) {
	return scanMember(s.db.QueryRowContext(ctx, "SELECT id,username,coalesce(password_hash,''),role FROM members WHERE id=$1", id))
}
func (s *SQLSecureStore) CreateMember(ctx context.Context, name, hash, role string) (Member, error) {
	return scanMember(s.db.QueryRowContext(ctx, "INSERT INTO members(username,password_hash,role)VALUES($1,$2,$3)RETURNING id,username,password_hash,role", name, hash, role))
}
func (s *SQLSecureStore) ListRegistrations(ctx context.Context, memberID int64) ([]Registration, error) {
	rows, err := s.db.QueryContext(ctx, "SELECT id,event_id,member_id FROM registrations WHERE member_id=$1 ORDER BY id", memberID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Registration{}
	for rows.Next() {
		var r Registration
		if err = rows.Scan(&r.ID, &r.EventID, &r.MemberID); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}
func (s *SQLSecureStore) Register(ctx context.Context, memberID, eventID int64) (Registration, error) {
	var r Registration
	err := s.db.QueryRowContext(ctx, "INSERT INTO registrations(event_id,member_id)VALUES($1,$2)RETURNING id,event_id,member_id", eventID, memberID).Scan(&r.ID, &r.EventID, &r.MemberID)
	return r, databaseError(err)
}
func (s *SQLSecureStore) CancelRegistration(ctx context.Context, id, memberID int64) error {
	result, err := s.db.ExecContext(ctx, "DELETE FROM registrations WHERE id=$1 AND member_id=$2", id, memberID)
	if err != nil {
		return err
	}
	count, err := result.RowsAffected()
	if err == nil && count == 0 {
		return ErrMissing
	}
	return err
}
