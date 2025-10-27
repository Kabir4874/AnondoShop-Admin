import axios from "axios";
import {
  Check,
  Edit3,
  Hash,
  ImagePlus,
  Loader2,
  Plus,
  Search,
  Tag,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { backendUrl } from "../App";

const initialForm = { name: "", isActive: true };

const Categories = ({ token }) => {
  const [form, setForm] = useState(initialForm);
  const [formImageFile, setFormImageFile] = useState(null);
  const [formImagePreview, setFormImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState("name");
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ name: "", isActive: true });
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState("");

  const authHeaders = useMemo(() => ({ headers: { token } }), [token]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        page: String(page),
        limit: String(limit),
        sort,
      });
      const { data } = await axios.get(
        `${backendUrl}/api/category?${params.toString()}`
      );
      if (data.success) {
        setCategories(data.categories || []);
        setPagination(data.pagination || { total: 0, pages: 1 });
      } else {
        toast.error(data.message || "Failed to load categories");
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || err.message || "Request failed"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, sort]);

  const onPickCreateImage = (file) => {
    if (!file) {
      setFormImageFile(null);
      setFormImagePreview("");
      return;
    }
    setFormImageFile(file);
    setFormImagePreview(URL.createObjectURL(file));
  };

  const onPickEditImage = (file) => {
    if (!file) {
      setEditImageFile(null);
      setEditImagePreview("");
      return;
    }
    setEditImageFile(file);
    setEditImagePreview(URL.createObjectURL(file));
  };

  const onCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.warn("Please enter a category name");
      return;
    }
    try {
      setSubmitting(true);

      // ALWAYS send multipart (so backend consistently uses multer)
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("isActive", String(form.isActive));
      if (formImageFile) fd.append("image", formImageFile);

      const { data } = await axios.post(`${backendUrl}/api/category`, fd, {
        headers: { token },
      });
      if (data.success) {
        toast.success("Category created");
        setForm(initialForm);
        setFormImageFile(null);
        setFormImagePreview("");
        setPage(1);
        await fetchCategories();
      } else {
        toast.error(data.message || "Failed to create category");
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || err.message || "Request failed"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat._id);
    setEditDraft({ name: cat.name, isActive: !!cat.isActive });
    setEditImageFile(null);
    setEditImagePreview(cat?.image?.url || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({ name: "", isActive: true });
    setEditImageFile(null);
    setEditImagePreview("");
  };

  const saveEdit = async (id) => {
    try {
      // ALWAYS send multipart for update as well
      const fd = new FormData();
      if (editDraft.name?.trim()) fd.append("name", editDraft.name.trim());
      fd.append("isActive", String(!!editDraft.isActive));
      if (editImageFile) fd.append("image", editImageFile);

      const { data } = await axios.put(`${backendUrl}/api/category/${id}`, fd, {
        headers: { token },
      });
      if (data.success) {
        toast.success("Category updated");
        cancelEdit();
        await fetchCategories();
      } else {
        toast.error(data.message || "Failed to update category");
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || err.message || "Request failed"
      );
    }
  };

  const toggleActive = async (cat) => {
    try {
      const fd = new FormData();
      fd.append("isActive", String(!cat.isActive));
      const { data } = await axios.put(
        `${backendUrl}/api/category/${cat._id}`,
        fd,
        { headers: { token } }
      );
      if (data.success) {
        await fetchCategories();
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || err.message || "Request failed"
      );
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this category? This cannot be undone.")) return;
    try {
      const { data } = await axios.delete(
        `${backendUrl}/api/category/${id}`,
        authHeaders
      );
      if (data.success) {
        toast.info("Category deleted");
        if (categories.length === 1 && page > 1) {
          setPage((p) => p - 1);
        } else {
          await fetchCategories();
        }
      } else {
        toast.error(data.message || "Failed to delete category");
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || err.message || "Request failed"
      );
    }
  };

  const onSearch = async (e) => {
    e.preventDefault();
    setPage(1);
    await fetchCategories();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <Tag className="w-6 h-6" />
        <h1 className="text-2xl font-semibold">Categories</h1>
      </div>

      {/* Create Form */}
      <form
        onSubmit={onCreate}
        className="w-full max-w-xl bg-white border rounded-xl p-4 flex flex-col gap-3"
      >
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <h2 className="font-semibold">Add New Category</h2>
        </div>

        <label className="text-sm font-medium">Name</label>
        <input
          type="text"
          placeholder="e.g., Men, Women, Kids"
          className="w-full px-3 py-2 border rounded-md"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />

        <label className="text-sm font-medium">Thumbnail (optional)</label>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer hover:bg-gray-50">
            <ImagePlus className="w-4 h-4" />
            <span>Choose image</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPickCreateImage(e.target.files?.[0] || null)}
            />
          </label>
          {formImagePreview ? (
            <img
              src={formImagePreview}
              alt="Preview"
              className="h-12 w-12 object-cover rounded border"
            />
          ) : (
            <span className="text-xs text-gray-500">No file chosen</span>
          )}
          {!!formImagePreview && (
            <button
              type="button"
              onClick={() => {
                setFormImageFile(null);
                setFormImagePreview("");
              }}
              className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>

        <label className="inline-flex items-center gap-2 mt-1 cursor-pointer select-none">
          {form.isActive ? (
            <ToggleRight className="w-5 h-5" />
          ) : (
            <ToggleLeft className="w-5 h-5" />
          )}
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
            className="hidden"
          />
          <span className="text-sm">Active</span>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 self-start px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Create Category
        </button>
      </form>

      {/* Toolbar */}
      <form
        onSubmit={onSearch}
        className="flex flex-col sm:flex-row sm:items-center gap-3"
      >
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name or slug…"
            className="px-3 py-2 border rounded-md w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm">Sort:</span>
          <select
            className="px-2 py-2 border rounded-md"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="name">Name (A→Z)</option>
            <option value="-name">Name (Z→A)</option>
            <option value="-_id">Newest</option>
            <option value="_id">Oldest</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm">Per page:</span>
          <select
            className="px-2 py-2 border rounded-md"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-800"
        >
          Apply
        </button>
      </form>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="hidden md:grid grid-cols-[0.4fr_0.8fr_1.2fr_1.2fr_0.8fr_0.8fr] gap-2 py-3 px-4 bg-gray-100 text-sm font-semibold">
          <div className="flex items-center gap-1">
            <Hash className="w-4 h-4" />
            ID
          </div>
          <div>Image</div>
          <div>Name</div>
          <div>Slug</div>
          <div>Status</div>
          <div className="text-center">Actions</div>
        </div>

        {loading && (
          <div className="py-8 text-center text-gray-600">
            <Loader2 className="inline-block w-5 h-5 mr-2 animate-spin" />
            Loading categories…
          </div>
        )}

        {!loading && categories.length === 0 && (
          <div className="py-8 text-center text-gray-600">
            No categories found.
          </div>
        )}

        {!loading &&
          categories.map((cat) => {
            const isEditing = editingId === cat._id;
            const liveImageUrl = isEditing
              ? editImagePreview
              : cat?.image?.url || "";

            return (
              <div
                key={cat._id}
                className="grid grid-cols-1 md:grid-cols-[0.4fr_0.8fr_1.2fr_1.2fr_0.8fr_0.8fr] gap-3 md:gap-2 py-3 px-4 border-t text-sm items-center"
              >
                {/* ID */}
                <div className="text-gray-500 break-all">
                  {String(cat._id).slice(-6)}
                </div>

                {/* Image */}
                <div className="flex items-center gap-3">
                  {liveImageUrl ? (
                    <img
                      src={liveImageUrl}
                      alt={cat.name}
                      className="h-12 w-12 object-cover rounded border"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded border bg-gray-50 flex items-center justify-center text-[10px] text-gray-400">
                      No img
                    </div>
                  )}

                  {isEditing && (
                    <label className="inline-flex items-center gap-2 px-2 py-1 border rounded-md cursor-pointer hover:bg-gray-50 text-xs">
                      <ImagePlus className="w-4 h-4" />
                      <span>Replace</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          onPickEditImage(e.target.files?.[0] || null)
                        }
                      />
                    </label>
                  )}
                </div>

                {/* Name */}
                <div className="font-medium">
                  {isEditing ? (
                    <input
                      className="w-full px-2 py-1 border rounded-md"
                      value={editDraft.name}
                      onChange={(e) =>
                        setEditDraft((d) => ({ ...d, name: e.target.value }))
                      }
                    />
                  ) : (
                    cat.name
                  )}
                </div>

                {/* Slug */}
                <div className="text-gray-700">{cat.slug}</div>

                {/* Active */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      isEditing
                        ? setEditDraft((d) => ({ ...d, isActive: !d.isActive }))
                        : toggleActive(cat)
                    }
                    className="inline-flex items-center gap-2"
                    title={
                      isEditing ? "Toggle active (edit draft)" : "Toggle active"
                    }
                  >
                    {(isEditing ? editDraft.isActive : cat.isActive) ? (
                      <span className="inline-flex items-center gap-1 text-green-700">
                        <ToggleRight className="w-5 h-5" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-500">
                        <ToggleLeft className="w-5 h-5" /> Inactive
                      </span>
                    )}
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => saveEdit(cat._id)}
                        className="px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                        title="Save"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-2 py-1 rounded bg-gray-600 text-white hover:bg-gray-700"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(cat)}
                        className="px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(cat._id)}
                        className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-gray-600">
            Page {page} of {pagination.pages} • {pagination.total} total
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page >= pagination.pages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
