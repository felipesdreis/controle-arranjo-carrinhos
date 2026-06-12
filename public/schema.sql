CREATE TABLE IF NOT EXISTS brothers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    phone       TEXT,
    notes       TEXT,
    active      INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS carts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    description TEXT,
    active      INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS locations (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    address     TEXT,
    notes       TEXT,
    active      INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS groups (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    responsible_id  INTEGER REFERENCES brothers(id),
    active          INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS slots (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    cart_id     INTEGER REFERENCES carts(id),
    group_id    INTEGER REFERENCES groups(id),
    day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
    start_time  TEXT    NOT NULL,
    end_time    TEXT    NOT NULL,
    capacity    INTEGER NOT NULL DEFAULT 2,
    active      INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS schedule_weeks (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    week_start      TEXT    NOT NULL UNIQUE,
    notes           TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS assignments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    week_id         INTEGER NOT NULL REFERENCES schedule_weeks(id) ON DELETE CASCADE,
    slot_id         INTEGER NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
    brother_id      INTEGER NOT NULL REFERENCES brothers(id),
    position        INTEGER NOT NULL DEFAULT 1 CHECK(position >= 1),
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(week_id, slot_id, position)
);

CREATE INDEX IF NOT EXISTS idx_slots_day        ON slots(day_of_week);
CREATE INDEX IF NOT EXISTS idx_slots_location   ON slots(location_id);
CREATE INDEX IF NOT EXISTS idx_assignments_week ON assignments(week_id);
CREATE INDEX IF NOT EXISTS idx_assignments_slot ON assignments(slot_id);
