package main

import "testing"

func TestTotalMinutes(t *testing.T) {
	for _, test := range []struct{ minutes, days, want int }{
		{20, 3, 60}, {30, 2, 60}, {0, 5, 0}, {20, 0, 0},
	} {
		if got := TotalMinutes(test.minutes, test.days); got != test.want {
			t.Fatalf("TotalMinutes(%d,%d)=%d, want %d", test.minutes, test.days, got, test.want)
		}
	}
}
