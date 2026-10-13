package main

import (
	"context"
	"database/sql"
	"errors"
	"github.com/jackc/pgx/v5/pgconn"
)

type SQLStore struct{ db *sql.DB }

func databaseError(err error) error {
	if errors.Is(err, sql.ErrNoRows) {
		return ErrMissing
	}
	var pg *pgconn.PgError
	if errors.As(err, &pg) && (pg.Code == "23505" || pg.Code == "23503") {
		return ErrConflict
	}
	return err
}
func scanEvent(row interface{ Scan(...any) error }) (Event, error) {
	var e Event
	err := row.Scan(&e.ID, &e.Title, &e.Location)
	return e, databaseError(err)
}
func (s *SQLStore) Ping(ctx context.Context) error { return s.db.PingContext(ctx) }
func (s *SQLStore) List(ctx context.Context, q string, limit, offset int) ([]Event, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT id,title,location FROM events WHERE strpos(lower(title),lower($1))>0 ORDER BY id LIMIT $2 OFFSET $3`, q, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []Event{}
	for rows.Next() {
		e, err := scanEvent(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, e)
	}
	return items, rows.Err()
}
func (s *SQLStore) Get(ctx context.Context, id int64) (Event, error) {
	return scanEvent(s.db.QueryRowContext(ctx, `SELECT id,title,location FROM events WHERE id=$1`, id))
}
func (s *SQLStore) Create(ctx context.Context, in EventInput) (Event, error) {
	return scanEvent(s.db.QueryRowContext(ctx, `INSERT INTO events(title,location) VALUES($1,$2) RETURNING id,title,location`, in.Title, in.Location))
}
func (s *SQLStore) Update(ctx context.Context, id int64, in EventInput) (Event, error) {
	return scanEvent(s.db.QueryRowContext(ctx, `UPDATE events SET title=$1,location=$2 WHERE id=$3 RETURNING id,title,location`, in.Title, in.Location, id))
}
func (s *SQLStore) Delete(ctx context.Context, id int64) error {
	r, err := s.db.ExecContext(ctx, `DELETE FROM events WHERE id=$1`, id)
	if err != nil {
		return databaseError(err)
	}
	n, err := r.RowsAffected()
	if err == nil && n == 0 {
		return ErrMissing
	}
	return err
}
