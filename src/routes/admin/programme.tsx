import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getAdminProgrammeFn, createOrUpdateProgrammeFn, deleteProgrammeFn } from "@/fns/admin-programme";

export const Route = createFileRoute("/admin/programme")({
  component: AdminProgramme,
});

type SessionType = "CONFERENCE" | "KEYNOTE" | "PANEL" | "WORKSHOP" | "NETWORKING" | "BREAK" | "AFTER_PARTY" | "OTHER";

type Session = {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  sessionType: SessionType;
  displayOrder: number;
  active: boolean;
};

const SESSION_TYPES: SessionType[] = ["CONFERENCE", "KEYNOTE", "PANEL", "WORKSHOP", "NETWORKING", "BREAK", "AFTER_PARTY", "OTHER"];

const TYPE_BADGE: Record<SessionType, string> = {
  CONFERENCE: "bg-primary/10 text-primary",
  KEYNOTE: "bg-accent/10 text-accent",
  PANEL: "bg-secondary text-secondary-foreground",
  WORKSHOP: "bg-accent/10 text-accent",
  NETWORKING: "bg-primary/10 text-primary",
  BREAK: "bg-muted text-muted-foreground",
  AFTER_PARTY: "bg-destructive/10 text-destructive",
  OTHER: "bg-muted text-muted-foreground",
};

function AdminProgramme() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    sessionType: "CONFERENCE" as SessionType,
    displayOrder: "0",
    active: true,
  });

  const fetchSessions = async () => {
    try {
      const data = await getAdminProgrammeFn();
      setSessions(data as Session[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleSave = async () => {
    const payload = {
      ...(editing ? { id: editing } : {}),
      title: form.title,
      description: form.description,
      startTime: form.startTime,
      endTime: form.endTime,
      sessionType: form.sessionType,
      displayOrder: parseInt(form.displayOrder, 10) || 0,
      active: form.active,
    };

    await createOrUpdateProgrammeFn({ data: payload as any });

    setEditing(null);
    resetForm();
    fetchSessions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this session?")) return;
    await deleteProgrammeFn({ data: { id } });
    fetchSessions();
  };

  const startEdit = (s: Session) => {
    setEditing(s.id);
    setForm({
      title: s.title,
      description: s.description,
      startTime: s.startTime.slice(0, 16),
      endTime: s.endTime.slice(0, 16),
      sessionType: s.sessionType,
      displayOrder: String(s.displayOrder),
      active: s.active,
    });
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      startTime: "",
      endTime: "",
      sessionType: "CONFERENCE",
      displayOrder: "0",
      active: true,
    });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Programme</h1>
      <p className="mt-1 font-body text-sm text-muted-foreground">
        Manage conference sessions, talks, and events.
      </p>

      {/* Form */}
      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <p className="font-body text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {editing ? "Edit Session" : "Add Session"}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="rounded-lg border border-input bg-background px-4 py-2.5 font-body text-sm outline-none focus:border-accent"
          />
          <select
            value={form.sessionType}
            onChange={(e) => setForm({ ...form, sessionType: e.target.value as SessionType })}
            className="rounded-lg border border-input bg-background px-4 py-2.5 font-body text-sm outline-none"
          >
            {SESSION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="sm:col-span-2 rounded-lg border border-input bg-background px-4 py-2.5 font-body text-sm outline-none focus:border-accent"
          />
          <input
            type="datetime-local"
            placeholder="Start Time"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            className="rounded-lg border border-input bg-background px-4 py-2.5 font-body text-sm outline-none focus:border-accent"
          />
          <input
            type="datetime-local"
            placeholder="End Time"
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            className="rounded-lg border border-input bg-background px-4 py-2.5 font-body text-sm outline-none focus:border-accent"
          />
          <input
            type="number"
            placeholder="Display Order"
            value={form.displayOrder}
            onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
            className="rounded-lg border border-input bg-background px-4 py-2.5 font-body text-sm outline-none focus:border-accent"
          />
          <label className="flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2.5 font-body text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="size-4 accent-accent"
            />
            Active
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleSave}
            className="rounded-lg bg-accent px-4 py-2 font-body text-xs font-bold text-accent-foreground hover:bg-accent/90"
          >
            {editing ? "Update" : "Create"}
          </button>
          {editing && (
            <button
              onClick={() => {
                setEditing(null);
                resetForm();
              }}
              className="rounded-lg border border-border px-4 py-2 font-body text-xs font-bold"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
        ) : sessions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No sessions yet.</p>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${TYPE_BADGE[s.sessionType]}`}
                  >
                    {s.sessionType.replace(/_/g, " ")}
                  </span>
                  {!s.active && (
                    <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="mt-2 font-body text-sm font-bold">{s.title}</p>
                <p className="mt-0.5 font-body text-xs text-muted-foreground">
                  {formatTime(s.startTime)} — {formatTime(s.endTime)}
                </p>
                {s.description && (
                  <p className="mt-1 font-body text-xs text-muted-foreground line-clamp-2">
                    {s.description}
                  </p>
                )}
                <p className="mt-1 font-body text-[10px] text-muted-foreground">
                  Order: {s.displayOrder}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => startEdit(s)}
                  className="rounded bg-secondary px-3 py-1.5 text-[10px] font-bold text-secondary-foreground hover:bg-secondary/80"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="rounded bg-destructive/10 px-3 py-1.5 text-[10px] font-bold text-destructive hover:bg-destructive/20"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
