# Architecture & case-study notes

## Requirements (summary)

Small team loses requests across chat/spreadsheets. Must: capture
(title, requester, category, priority, description), move through
open → in progress → resolved → closed, attach notes, filter/search,
and show counts by status/priority.

## Data model

```text
request(id, title, requester, category, priority, status, desc, created)
note(id, request_id, body, created)
```

Demo stores this as one JSON array in `localStorage` (key
`srt-requests-v1`). SQLite migration is 1:1:

```sql
CREATE TABLE request(id TEXT PRIMARY KEY, title TEXT NOT NULL,
  requester TEXT NOT NULL, category TEXT, priority TEXT, status TEXT,
  description TEXT, created TEXT);
CREATE TABLE note(id INTEGER PRIMARY KEY, request_id TEXT REFERENCES request(id),
  body TEXT, created TEXT);
```

## Test checklist

1. Add request → appears at top, status Open, dashboard open+1
2. Change status → dashboard counts move accordingly
3. Add note → note renders under the request, persists after reload
4. Search "odoo" → only matching rows; clear → all return
5. Status + priority filters combine correctly
6. Reset demo data → original 3 seeded rows return
7. Reload page → all state persists (localStorage)

## SQLite migration path

Replace `load()/save()` with `fetch()` calls to a tiny REST layer
(Flask/FastAPI + SQLite): `GET/POST /requests`, `PATCH /requests/:id`,
`POST /requests/:id/notes`. UI already treats storage as a module
boundary, so only those two functions change.
