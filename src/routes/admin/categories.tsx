import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getAdminCategoriesFn, createOrUpdateCategoryFn } from "@/fns/admin-categories";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategories,
});

type Category = {
  id: string;
  name: string;
  description: string;
  price: number | null;
  currency: string;
  active: boolean;
  _count?: { attendees: number };
};

function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", currency: "NGN", active: true });

  const fetchCategories = async () => {
    try {
      const data = await getAdminCategoriesFn();
      setCategories(data as Category[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSave = async () => {
    const payload = {
      ...(editing ? { id: editing } : {}),
      name: form.name,
      description: form.description,
      price: form.price ? parseFloat(form.price) : 0,
      currency: form.currency,
      active: form.active,
    };

    await createOrUpdateCategoryFn({ data: payload as any });

    setEditing(null);
    setForm({ name: "", description: "", price: "", currency: "NGN", active: true });
    fetchCategories();
  };

  const startEdit = (cat: Category) => {
    setEditing(cat.id);
    setForm({
      name: cat.name,
      description: cat.description,
      price: cat.price?.toString() || "",
      currency: cat.currency,
      active: cat.active,
    });
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Categories</h1>

      {/* Form */}
      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <p className="font-body text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {editing ? "Edit Category" : "Add Category"}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-lg border border-input bg-background px-4 py-2.5 font-body text-sm outline-none focus:border-accent"
          />
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="rounded-lg border border-input bg-background px-4 py-2.5 font-body text-sm outline-none focus:border-accent"
          />
          <input
            placeholder="Price in Naira (0 for free)"
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="rounded-lg border border-input bg-background px-4 py-2.5 font-body text-sm outline-none focus:border-accent"
          />
          <input
            placeholder="Currency"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            className="rounded-lg border border-input bg-background px-4 py-2.5 font-body text-sm outline-none focus:border-accent"
          />
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
              onClick={() => { setEditing(null); setForm({ name: "", description: "", price: "", currency: "NGN", active: true }); }}
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
        ) : categories.map((cat) => (
          <div key={cat.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <div>
              <p className="font-body text-sm font-bold">{cat.name}</p>
              <p className="font-body text-xs text-muted-foreground">{cat.description}</p>
              <p className="mt-1 font-body text-xs text-muted-foreground">
                {cat.price !== null && cat.price !== undefined ? cat.price === 0 ? "Free" : `₦${cat.price.toLocaleString()}` : "Price TBC"} · {cat.active ? "Active" : "Inactive"} · {cat._count?.attendees ?? 0} registered
              </p>
            </div>
            <button
              onClick={() => startEdit(cat)}
              className="rounded bg-secondary px-3 py-1.5 text-[10px] font-bold text-secondary-foreground hover:bg-secondary/80"
            >
              Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
