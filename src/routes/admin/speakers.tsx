import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getAdminSpeakersFn, createOrUpdateSpeakerFn, deleteSpeakerFn } from "@/fns/admin-speakers";

type SpeakerRole = "KEYNOTE" | "SPEAKER" | "PANELIST";

interface Speaker {
  id: string;
  name: string;
  title: string;
  organisation: string;
  biography: string;
  role: SpeakerRole;
  displayOrder: number;
  imageUrl: string;
  active: boolean;
}

const emptySpeaker: Omit<Speaker, "id"> = {
  name: "",
  title: "",
  organisation: "",
  biography: "",
  role: "SPEAKER",
  displayOrder: 0,
  imageUrl: "",
  active: true,
};

const roleBadgeClass: Record<SpeakerRole, string> = {
  KEYNOTE: "bg-accent text-white",
  SPEAKER: "bg-primary text-white",
  PANELIST: "bg-secondary text-white",
};

export const Route = createFileRoute("/admin/speakers")({
  component: AdminSpeakers,
});

function AdminSpeakers() {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [form, setForm] = useState(emptySpeaker);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSpeakers = async () => {
    try {
      setLoading(true);
      const data = await getAdminSpeakersFn();
      setSpeakers(data as Speaker[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpeakers();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "displayOrder" ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createOrUpdateSpeakerFn({
        data: {
          ...(editingId ? { id: editingId } : {}),
          name: form.name,
          title: form.title,
          organisation: form.organisation,
          biography: form.biography,
          imageUrl: form.imageUrl,
          role: form.role,
          displayOrder: form.displayOrder,
          active: form.active,
        } as any,
      });
      setForm(emptySpeaker);
      setEditingId(null);
      fetchSpeakers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleEdit = (speaker: Speaker) => {
    setEditingId(speaker.id);
    setForm({
      name: speaker.name,
      title: speaker.title,
      organisation: speaker.organisation,
      biography: speaker.biography,
      role: speaker.role,
      displayOrder: speaker.displayOrder,
      imageUrl: speaker.imageUrl ?? "",
      active: speaker.active ?? true,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this speaker?")) return;
    try {
      await deleteSpeakerFn({ data: { id } });
      fetchSpeakers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(emptySpeaker);
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-display mb-2 text-3xl font-bold text-primary">
          Speaker Management
        </h1>
        <p className="mb-8 text-sm text-muted">
          Create, edit, and manage conference speakers.
        </p>

        {error && (
          <div className="mb-6 rounded border border-border bg-card p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mb-10 space-y-4 rounded-lg border border-border bg-card p-6"
        >
          <h2 className="font-display mb-4 text-lg font-semibold text-primary">
            {editingId ? "Edit Speaker" : "Add New Speaker"}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-primary">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-primary">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-primary">
                Organisation
              </label>
              <input
                type="text"
                name="organisation"
                value={form.organisation}
                onChange={handleChange}
                required
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-primary">
                Role
              </label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="KEYNOTE">Keynote</option>
                <option value="SPEAKER">Speaker</option>
                <option value="PANELIST">Panelist</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-primary">
                Display Order
              </label>
              <input
                type="number"
                name="displayOrder"
                value={form.displayOrder}
                onChange={handleChange}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-primary">
              Biography
            </label>
            <textarea
              name="biography"
              value={form.biography}
              onChange={handleChange}
              rows={4}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="rounded bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accent/90"
            >
              {editingId ? "Update Speaker" : "Add Speaker"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="rounded border border-border bg-background px-5 py-2 text-sm font-medium text-primary transition hover:bg-muted"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div>
          <h2 className="font-display mb-4 text-lg font-semibold text-primary">
            Speakers ({speakers.length})
          </h2>

          {loading && (
            <p className="text-sm text-muted">Loading speakers...</p>
          )}

          {!loading && speakers.length === 0 && (
            <p className="text-sm text-muted">
              No speakers found. Add one above.
            </p>
          )}

          <div className="space-y-4">
            {speakers.map((speaker) => (
              <div
                key={speaker.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${roleBadgeClass[speaker.role]}`}
                    >
                      {speaker.role}
                    </span>
                    <span className="text-xs text-muted">
                      Order: {speaker.displayOrder}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-primary">
                    {speaker.name}
                  </h3>
                  <p className="text-sm text-accent">{speaker.title}</p>
                  <p className="text-sm text-muted">
                    {speaker.organisation}
                  </p>
                  {speaker.biography && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted">
                      {speaker.biography}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 sm:flex-col">
                  <button
                    onClick={() => handleEdit(speaker)}
                    className="rounded border border-border bg-background px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-muted"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(speaker.id)}
                    className="rounded border border-red-200 bg-background px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
