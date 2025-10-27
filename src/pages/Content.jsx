import axios from "axios";
import {
  Check,
  Edit3,
  Image as ImageIcon,
  Loader2,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { backendUrl } from "../App";

/* -------------------------------------------------------
   Content Management: Headlines (text) + Banners (image)
   Props: { token }
-------------------------------------------------------- */
const Content = ({ token }) => {
  const headers = useMemo(() => ({ headers: { token } }), [token]);

  const [activeTab, setActiveTab] = useState("headlines"); // 'headlines' | 'banners'

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <ImageIcon className="w-6 h-6" />
        <h1 className="text-2xl font-semibold">Content Management</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          className={`px-4 py-2 rounded-lg border ${
            activeTab === "headlines"
              ? "bg-slate-800 text-white border-slate-800"
              : "bg-gray-100"
          }`}
          onClick={() => setActiveTab("headlines")}
        >
          Headlines
        </button>
        <button
          className={`px-4 py-2 rounded-lg border ${
            activeTab === "banners"
              ? "bg-slate-800 text-white border-slate-800"
              : "bg-gray-100"
          }`}
          onClick={() => setActiveTab("banners")}
        >
          Banners
        </button>
      </div>

      {activeTab === "headlines" ? (
        <HeadlinesSection headers={headers} />
      ) : (
        <BannersSection headers={headers} />
      )}
    </div>
  );
};

/* ============================ Headlines ============================ */
const HeadlinesSection = ({ headers }) => {
  const [form, setForm] = useState({ text: "", isActive: true });
  const [submitting, setSubmitting] = useState(false);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [activeOnly, setActiveOnly] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Inline edit
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ text: "", isActive: true });

  const fetchHeadlines = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        activeOnly: activeOnly ? "1" : "0",
      });
      const { data } = await axios.get(
        `${backendUrl}/api/content/headlines?${params}`,
        {}
      );
      if (data.success) {
        setItems(data.headlines || []);
        setPagination(data.pagination || { total: 0, pages: 1 });
      } else {
        toast.error(data.message || "Failed to load headlines");
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
    fetchHeadlines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, activeOnly]);

  const onCreate = async (e) => {
    e.preventDefault();
    if (!form.text.trim()) {
      toast.warn("Please enter headline text");
      return;
    }
    try {
      setSubmitting(true);
      const { data } = await axios.post(
        `${backendUrl}/api/content/headlines`,
        { text: form.text.trim(), isActive: !!form.isActive },
        headers
      );
      if (data.success) {
        toast.success("Headline created");
        setForm({ text: "", isActive: true });
        setPage(1);
        fetchHeadlines();
      } else {
        toast.error(data.message || "Failed to create headline");
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

  const startEdit = (h) => {
    setEditingId(h._id);
    setEditDraft({ text: h.text, isActive: !!h.isActive });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({ text: "", isActive: true });
  };

  const saveEdit = async (id) => {
    try {
      const payload = { ...editDraft, text: editDraft.text?.trim() || "" };
      if (!payload.text) {
        toast.warn("Headline text is required");
        return;
      }
      const { data } = await axios.put(
        `${backendUrl}/api/content/headlines/${id}`,
        payload,
        headers
      );
      if (data.success) {
        toast.success("Headline updated");
        cancelEdit();
        fetchHeadlines();
      } else {
        toast.error(data.message || "Failed to update headline");
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || err.message || "Request failed"
      );
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this headline? This cannot be undone.")) return;
    try {
      const { data } = await axios.delete(
        `${backendUrl}/api/content/headlines/${id}`,
        headers
      );
      if (data.success) {
        toast.info("Headline deleted");
        if (items.length === 1 && page > 1) {
          setPage((p) => p - 1);
        } else {
          fetchHeadlines();
        }
      } else {
        toast.error(data.message || "Failed to delete headline");
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || err.message || "Request failed"
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Create Headline */}
      <form
        onSubmit={onCreate}
        className="w-full max-w-2xl bg-white border rounded-xl p-4 flex flex-col gap-3"
      >
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <h2 className="font-semibold">Add Headline</h2>
        </div>

        <label className="text-sm font-medium">Text</label>
        <input
          type="text"
          placeholder="Write headline text…"
          className="w-full px-3 py-2 border rounded-md"
          value={form.text}
          onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
          required
        />

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
          Create Headline
        </button>
      </form>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 cursor-pointer">
          {activeOnly ? (
            <ToggleRight className="w-5 h-5" />
          ) : (
            <ToggleLeft className="w-5 h-5" />
          )}
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={() => setActiveOnly((v) => !v)}
            className="hidden"
          />
          <span className="text-sm">Show active only</span>
        </label>

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
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        {/* Head */}
        <div className="hidden md:grid grid-cols-[0.5fr_2fr_1fr_1fr] gap-2 py-3 px-4 bg-gray-100 text-sm font-semibold">
          <div>ID</div>
          <div>Text</div>
          <div>Status</div>
          <div className="text-center">Actions</div>
        </div>

        {loading && (
          <div className="py-8 text-center text-gray-600">
            <Loader2 className="inline-block w-5 h-5 mr-2 animate-spin" />
            Loading…
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="py-8 text-center text-gray-600">No headlines.</div>
        )}

        {!loading &&
          items.map((h) => {
            const isEditing = editingId === h._id;
            return (
              <div
                key={h._id}
                className="grid grid-cols-1 md:grid-cols-[0.5fr_2fr_1fr_1fr] gap-3 md:gap-2 py-3 px-4 border-t text-sm items-center"
              >
                <div className="text-gray-500 break-all">
                  {String(h._id).slice(-6)}
                </div>

                <div>
                  {isEditing ? (
                    <input
                      className="w-full px-2 py-1 border rounded-md"
                      value={editDraft.text}
                      onChange={(e) =>
                        setEditDraft((d) => ({ ...d, text: e.target.value }))
                      }
                    />
                  ) : (
                    <span className="font-medium">{h.text}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      isEditing
                        ? setEditDraft((d) => ({ ...d, isActive: !d.isActive }))
                        : toggleActiveHeadline(h, headers, fetchHeadlines)
                    }
                    className="inline-flex items-center gap-2"
                    title={
                      isEditing ? "Toggle active (edit draft)" : "Toggle active"
                    }
                  >
                    {(isEditing ? editDraft.isActive : h.isActive) ? (
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

                <div className="flex items-center justify-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => saveEdit(h._id)}
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
                        onClick={() => startEdit(h)}
                        className="px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          removeHeadline(
                            h._id,
                            headers,
                            fetchHeadlines,
                            items,
                            page,
                            setPage
                          )
                        }
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

// quick helpers for headline row actions
async function toggleActiveHeadline(h, headers, refetch) {
  try {
    const { data } = await axios.put(
      `${backendUrl}/api/content/headlines/${h._id}`,
      { isActive: !h.isActive },
      headers
    );
    if (data.success) {
      refetch();
    } else {
      toast.error(data.message || "Failed to update status");
    }
  } catch (err) {
    console.error(err);
    toast.error(
      err?.response?.data?.message || err.message || "Request failed"
    );
  }
}
async function removeHeadline(id, headers, refetch, items, page, setPage) {
  if (!confirm("Delete this headline? This cannot be undone.")) return;
  try {
    const { data } = await axios.delete(
      `${backendUrl}/api/content/headlines/${id}`,
      headers
    );
    if (data.success) {
      toast.info("Headline deleted");
      if (items.length === 1 && page > 1) setPage((p) => p - 1);
      else refetch();
    } else {
      toast.error(data.message || "Failed to delete headline");
    }
  } catch (err) {
    console.error(err);
    toast.error(
      err?.response?.data?.message || err.message || "Request failed"
    );
  }
}

/* ============================= Banners ============================= */
const BannersSection = ({ headers }) => {
  const [form, setForm] = useState({ file: null, isActive: true });
  const [uploading, setUploading] = useState(false);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [activeOnly, setActiveOnly] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Replace image draft per row
  const [replaceMap, setReplaceMap] = useState({}); // { [id]: File|null }

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        activeOnly: activeOnly ? "1" : "0",
      });
      const { data } = await axios.get(
        `${backendUrl}/api/content/banners?${params}`,
        {}
      );
      if (data.success) {
        setItems(data.banners || []);
        setPagination(data.pagination || { total: 0, pages: 1 });
      } else {
        toast.error(data.message || "Failed to load banners");
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
    fetchBanners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, activeOnly]);

  const onCreate = async (e) => {
    e.preventDefault();
    if (!form.file) {
      toast.warn("Please choose an image file");
      return;
    }
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("image", form.file);
      fd.append("isActive", String(!!form.isActive));

      const { data } = await axios.post(
        `${backendUrl}/api/content/banners`,
        fd,
        {
          ...headers,
          headers: {
            ...(headers.headers || {}),
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (data.success) {
        toast.success("Banner uploaded");
        setForm({ file: null, isActive: true });
        setPage(1);
        fetchBanners();
      } else {
        toast.error(data.message || "Failed to create banner");
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || err.message || "Request failed"
      );
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (b) => {
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/content/banners/${b._id}`,
        { isActive: !b.isActive },
        headers
      );
      if (data.success) fetchBanners();
      else toast.error(data.message || "Failed to update status");
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || err.message || "Request failed"
      );
    }
  };

  const saveReplace = async (id) => {
    const file = replaceMap[id];
    if (!file) {
      toast.warn("Choose an image first");
      return;
    }
    try {
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await axios.put(
        `${backendUrl}/api/content/banners/${id}`,
        fd,
        {
          ...headers,
          headers: {
            ...(headers.headers || {}),
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (data.success) {
        toast.success("Banner updated");
        setReplaceMap((m) => ({ ...m, [id]: null }));
        fetchBanners();
      } else {
        toast.error(data.message || "Failed to update banner");
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || err.message || "Request failed"
      );
    }
  };

  const remove = async (id) => {
    if (
      !confirm(
        "Delete this banner? This will delete the Cloudinary image as well."
      )
    )
      return;
    try {
      const { data } = await axios.delete(
        `${backendUrl}/api/content/banners/${id}`,
        headers
      );
      if (data.success) {
        toast.info("Banner deleted");
        if (items.length === 1 && page > 1) setPage((p) => p - 1);
        else fetchBanners();
      } else {
        toast.error(data.message || "Failed to delete banner");
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || err.message || "Request failed"
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Upload Banner */}
      <form
        onSubmit={onCreate}
        className="w-full max-w-2xl bg-white border rounded-xl p-4 flex flex-col gap-3"
      >
        <div className="flex items-center gap-2">
          <UploadCloud className="w-4 h-4" />
          <h2 className="font-semibold">Add Banner (Image)</h2>
        </div>

        <label className="text-sm font-medium">Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setForm((f) => ({ ...f, file: e.target.files?.[0] || null }))
          }
          className="w-full px-3 py-2 border rounded-md"
        />

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
          disabled={uploading}
          className="inline-flex items-center gap-2 self-start px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Upload Banner
        </button>
      </form>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 cursor-pointer">
          {activeOnly ? (
            <ToggleRight className="w-5 h-5" />
          ) : (
            <ToggleLeft className="w-5 h-5" />
          )}
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={() => setActiveOnly((v) => !v)}
            className="hidden"
          />
          <span className="text-sm">Show active only</span>
        </label>

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
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        {/* Head */}
        <div className="hidden md:grid grid-cols-[0.5fr_1.6fr_1fr_1.4fr_1fr] gap-2 py-3 px-4 bg-gray-100 text-sm font-semibold">
          <div>ID</div>
          <div>Preview</div>
          <div>Status</div>
          <div>Replace Image</div>
          <div className="text-center">Actions</div>
        </div>

        {loading && (
          <div className="py-8 text-center text-gray-600">
            <Loader2 className="inline-block w-5 h-5 mr-2 animate-spin" />
            Loading…
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="py-8 text-center text-gray-600">No banners.</div>
        )}

        {!loading &&
          items.map((b) => {
            const replaceFile = replaceMap[b._id] || null;
            return (
              <div
                key={b._id}
                className="grid grid-cols-1 md:grid-cols-[0.5fr_1.6fr_1fr_1.4fr_1fr] gap-3 md:gap-2 py-3 px-4 border-t text-sm items-center"
              >
                <div className="text-gray-500 break-all">
                  {String(b._id).slice(-6)}
                </div>

                <div className="flex items-center gap-4">
                  <img
                    src={b?.image?.url}
                    alt=""
                    className="w-36 h-20 object-cover rounded border bg-gray-50"
                  />
                  <div className="text-xs text-gray-600 break-all">
                    {b?.image?.url}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(b)}
                    className="inline-flex items-center gap-2"
                    title="Toggle active"
                  >
                    {b.isActive ? (
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

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setReplaceMap((m) => ({
                        ...m,
                        [b._id]: e.target.files?.[0] || null,
                      }))
                    }
                    className="w-full px-2 py-1 border rounded"
                  />
                  <button
                    type="button"
                    onClick={() => saveReplace(b._id)}
                    className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                    title="Save new image"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => remove(b._id)}
                    className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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

export default Content;
