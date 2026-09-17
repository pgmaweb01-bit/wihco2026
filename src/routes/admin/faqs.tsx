import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getAdminFaqsFn, createOrUpdateFaqFn, deleteFaqFn } from "@/fns/admin-faqs";

export const Route = createFileRoute("/admin/faqs")({
  component: AdminFaqs,
});

interface Faq {
  id: string;
  question: string;
  answer: string;
  displayOrder: number;
  active: boolean;
}

const initialForm = { question: "", answer: "", displayOrder: 0, active: true };

function AdminFaqs() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const data = await getAdminFaqsFn();
      setFaqs(data as Faq[]);
    } catch (err) {
      console.error("Failed to fetch FAQs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOrUpdateFaqFn({
        data: {
          ...(editingId ? { id: editingId } : {}),
          question: form.question,
          answer: form.answer,
          displayOrder: form.displayOrder,
          active: form.active,
        } as any,
      });
      setForm(initialForm);
      setEditingId(null);
      fetchFaqs();
    } catch (err) {
      console.error("Failed to save FAQ:", err);
    }
  };

  const handleEdit = (faq: Faq) => {
    setForm({
      question: faq.question,
      answer: faq.answer,
      displayOrder: faq.displayOrder,
      active: faq.active,
    });
    setEditingId(faq.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    try {
      await deleteFaqFn({ data: { id } });
      fetchFaqs();
    } catch (err) {
      console.error("Failed to delete FAQ:", err);
    }
  };

  const handleCancel = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-card p-6 font-body">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-3xl text-primary mb-8">
          FAQ Management
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-lg p-6 mb-10 shadow-sm"
        >
          <h2 className="font-display text-xl text-accent mb-4">
            {editingId ? "Edit FAQ" : "Add New FAQ"}
          </h2>

          <div className="mb-4">
            <label className="block font-body text-sm text-primary mb-1">
              Question
            </label>
            <input
              type="text"
              name="question"
              value={form.question}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-border rounded-md bg-card text-primary font-body focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="mb-4">
            <label className="block font-body text-sm text-primary mb-1">
              Answer
            </label>
            <textarea
              name="answer"
              value={form.answer}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-2 border border-border rounded-md bg-card text-primary font-body focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="flex gap-6 mb-4">
            <div>
              <label className="block font-body text-sm text-primary mb-1">
                Display Order
              </label>
              <input
                type="number"
                name="displayOrder"
                value={form.displayOrder}
                onChange={handleChange}
                min={0}
                className="w-24 px-4 py-2 border border-border rounded-md bg-card text-primary font-body focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 font-body text-sm text-primary cursor-pointer">
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleChange}
                  className="w-4 h-4 accent-accent"
                />
                Active
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="px-6 py-2 bg-accent text-white font-display rounded-md hover:opacity-90 transition-opacity"
            >
              {editingId ? "Update FAQ" : "Create FAQ"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-border text-primary font-display rounded-md hover:bg-card transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {loading ? (
          <p className="text-primary font-body">Loading FAQs...</p>
        ) : faqs.length === 0 ? (
          <p className="text-primary font-body">No FAQs yet.</p>
        ) : (
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="bg-card border border-border rounded-lg p-5 shadow-sm"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-body px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                        #{faq.displayOrder}
                      </span>
                      <span
                        className={`text-xs font-body px-2 py-0.5 rounded-full ${
                          faq.active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {faq.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <h3 className="font-display text-lg text-primary mb-1">
                      {faq.question}
                    </h3>
                    <p className="font-body text-sm text-primary/70 line-clamp-2">
                      {faq.answer}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleEdit(faq)}
                      className="px-3 py-1.5 text-sm font-display border border-border rounded-md text-primary hover:bg-accent/10 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(faq.id)}
                      className="px-3 py-1.5 text-sm font-display border border-red-300 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
