// src/pages/EditProduct.jsx
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { backendUrl } from "../App";

const SIZE_OPTIONS = ["S-38", "M-40", "L-42", "XL-44", "XXL-46"];
const SUBCATEGORY_OPTIONS = [
  "Belt Combo",
  "Love Box combo",
  "Full combo",
  "প্রিন্ট শার্ট কম্বো",
  "ছোট কম্বো",
  "শাড়ি",
];

const SLOT_COUNT = 4;

const EditProduct = ({ token, onSaved }) => {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const productId = routeId;

  const [loading, setLoading] = useState(true);

  // Existing images normalized as exactly 4 slots: [{url, publicId}|null, ...]
  const [slots, setSlots] = useState(Array(SLOT_COUNT).fill(null)); // each slot: { url, publicId } | null

  // Newly chosen files to replace slots (parallel array length 4)
  const [replacements, setReplacements] = useState(Array(SLOT_COUNT).fill(null)); // each: File | null

  // Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState(""); // short description
  const [longDescription, setLongDescription] = useState(""); // HTML from Quill
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState(0);
  const [sizes, setSizes] = useState([]);
  const [bestSeller, setBestSeller] = useState(false);

  // Previews for replacements
  const previews = useMemo(
    () =>
      replacements.map((file) => (file ? URL.createObjectURL(file) : null)),
    [replacements]
  );

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      previews.forEach((url) => url && URL.revokeObjectURL(url));
    };
  }, [previews]);

  // Load product details
  useEffect(() => {
    if (!productId) {
      toast.error("Product ID not found");
      navigate("/admin/products");
      return;
    }

    const load = async () => {
      try {
        const { data } = await axios.post(`${backendUrl}/api/product/single`, {
          productId,
        });
        if (data.success && data.product) {
          const p = data.product;

          setName(p.name || "");
          setDescription(p.description || "");
          setLongDescription(p.longDescription || "");
          setCategory(p.category || "");
          setSubCategory(p.subCategory || "");
          setPrice(p.price ?? "");
          setDiscount(p.discount ?? 0);
          setSizes(Array.isArray(p.sizes) ? p.sizes : []);
          setBestSeller(!!p.bestSeller);

          // Normalize images to exactly 4 slots
          const raw = Array.isArray(p.image) ? p.image : [];
          const norm = raw.map((img) =>
            typeof img === "string" ? { url: img, publicId: null } : img
          );
          const filled = Array(SLOT_COUNT)
            .fill(null)
            .map((_, i) => norm[i] ?? null);
          setSlots(filled);

          // Ensure no pending replacements on load
          setReplacements(Array(SLOT_COUNT).fill(null));
        } else {
          toast.error(data.message || "Failed to load product");
          navigate("/admin/products");
        }
      } catch (e) {
        toast.error(
          e?.response?.data?.message || e.message || "Failed to load product"
        );
        navigate("/admin/products");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [productId, navigate]);

  // Replace a slot with a new file
  const onPickFileForSlot = (slotIndex, file) => {
    if (!file) return;
    // replace exactly this slot only
    setReplacements((prev) => {
      const next = [...prev];
      next[slotIndex] = file;
      return next;
    });
  };

  // Clear replacement for a slot (keep original)
  const onClearReplacement = (slotIndex) => {
    setReplacements((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      const form = new FormData();

      form.append("productId", productId);
      form.append("name", name);
      form.append("description", description);
      form.append("longDescription", longDescription);
      form.append("category", category);
      form.append("subCategory", subCategory);
      form.append("price", price);
      form.append("discount", discount);
      form.append("sizes", JSON.stringify(sizes));
      form.append("bestSeller", bestSeller);

      // Determine which existing images are being replaced and must be removed from Cloudinary
      const removedPublicIds = [];
      slots.forEach((slot, idx) => {
        if (replacements[idx] && slot?.publicId) {
          removedPublicIds.push(slot.publicId);
        }
      });
      form.append("removedPublicIds", JSON.stringify(removedPublicIds));

      // Map replacements to expected field names image1..image4
      replacements.forEach((file, idx) => {
        if (file) form.append(`image${idx + 1}`, file);
      });

      const { data } = await axios.post(`${backendUrl}/api/product/edit`, form, {
        headers: { token },
      });

      if (data.success) {
        toast.success("Product updated");
        onSaved?.(data.product);
        navigate("/admin/products");
      } else {
        toast.error(data.message || "Failed to update");
      }
    } catch (e) {
      console.error(e);
      toast.error(
        e?.response?.data?.message || e.message || "Something went wrong"
      );
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col gap-6"
      encType="multipart/form-data"
    >
      {/* Exactly 4 image slots */}
      <div>
        <p className="mb-2 text-lg font-semibold">Product Images (4 slots)</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: SLOT_COUNT }).map((_, idx) => {
            const existing = slots[idx]; // {url, publicId} | null
            const replacement = replacements[idx]; // File | null
            const preview = previews[idx];

            return (
              <div key={idx} className="relative">
                <label htmlFor={`slot-file-${idx}`} className="block">
                  <div className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-pointer flex items-center justify-center bg-white">
                    {/* Priority: replacement preview > existing image > placeholder */}
                    {replacement && preview ? (
                      <img
                        src={preview}
                        alt={`slot-${idx}`}
                        className="w-full h-full object-cover"
                      />
                    ) : existing?.url ? (
                      <img
                        src={existing.url}
                        alt={`slot-${idx}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm text-gray-500">+ Upload</span>
                    )}
                  </div>
                </label>

                {/* Hidden input per slot */}
                <input
                  id={`slot-file-${idx}`}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => onPickFileForSlot(idx, e.target.files?.[0])}
                />

                {/* Controls */}
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-gray-600">
                    Slot {idx + 1}
                    {replacement ? " (replacing)" : existing ? "" : " (empty)"}
                  </span>
                  {replacement ? (
                    <button
                      type="button"
                      onClick={() => onClearReplacement(idx)}
                      className="text-xs px-2 py-0.5 rounded bg-gray-200 hover:bg-gray-300"
                    >
                      Undo
                    </button>
                  ) : (
                    <label
                      htmlFor={`slot-file-${idx}`}
                      className="text-xs px-2 py-0.5 rounded bg-black text-white cursor-pointer"
                    >
                      {existing ? "Change" : "Add"}
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          You can keep up to <b>4 images</b>. Click a slot to add/change. Replaced images will be deleted from Cloudinary.
        </p>
      </div>

      {/* Fields */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <p className="mb-1 font-semibold">Name</p>
          <input
            className="w-full px-3 py-2 border"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Product Name"
            required
          />
        </div>

        <div>
          <p className="mb-1 font-semibold">Price</p>
          <input
            className="w-full px-3 py-2 border"
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price"
            required
          />
        </div>

        <div>
          <p className="mb-1 font-semibold">Discount (%)</p>
          <input
            className="w-full px-3 py-2 border"
            type="number"
            min="0"
            max="100"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="0"
          />
        </div>

        <div>
          <p className="mb-1 font-semibold">Category</p>
          <select
            className="w-full px-3 py-2 border"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Select Category</option>
            <option>Men</option>
            <option>Women</option>
            <option>Kids</option>
          </select>
        </div>

        <div>
          <p className="mb-1 font-semibold">Sub Category</p>
          <select
            className="w-full px-3 py-2 border"
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            required
          >
            <option value="">Select Sub Category</option>
            {SUBCATEGORY_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="mb-1 font-semibold">Short Description</p>
        <textarea
          className="w-full px-3 py-2 border min-h-24"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description"
          required
        />
      </div>

      <div>
        <p className="mb-1 font-semibold">Long Description</p>
        <ReactQuill
          theme="snow"
          value={longDescription}
          onChange={setLongDescription}
          className="min-h-40"
        />
      </div>

      <div>
        <p className="mb-2 font-semibold">Sizes</p>
        <div className="flex flex-wrap gap-2">
          {SIZE_OPTIONS.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() =>
                setSizes((prev) =>
                  prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                )
              }
              className={`px-3 py-1 rounded-full border ${
                sizes.includes(s)
                  ? "bg-cyan-50 border-cyan-400 text-cyan-700"
                  : "bg-white border-gray-300 text-gray-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="bestSeller"
          type="checkbox"
          checked={bestSeller}
          onChange={() => setBestSeller((p) => !p)}
        />
        <label htmlFor="bestSeller">Best Seller</label>
      </div>

      <div className="flex gap-3">
        <button type="submit" className="px-5 py-2 text-white bg-black">
          Save Changes
        </button>
        <button
          type="button"
          onClick={() => navigate("/admin/products")}
          className="px-5 py-2 border"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default EditProduct;
