import axios from "axios";
import { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { toast } from "react-toastify";
import { backendUrl } from "../App";
import { assets } from "../assets/assets";

const Add = ({ token }) => {
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [image3, setImage3] = useState(null);
  const [image4, setImage4] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState(0);
  const [sizes, setSizes] = useState([]);
  const [bestSeller, setBestSeller] = useState(false);

  // Dynamic categories
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      setCatLoading(true);
      const params = new URLSearchParams({
        active: "true",
        limit: "500",
        sort: "name",
      });
      const { data } = await axios.get(
        `${backendUrl}/api/category?${params.toString()}`
      );
      if (data.success) {
        setCategories(Array.isArray(data.categories) ? data.categories : []);
      } else {
        toast.error(data.message || "Failed to load categories");
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || err.message || "Request failed"
      );
    } finally {
      setCatLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();

      image1 && formData.append("image1", image1);
      image2 && formData.append("image2", image2);
      image3 && formData.append("image3", image3);
      image4 && formData.append("image4", image4);

      formData.append("name", name);
      formData.append("description", description);
      formData.append("longDescription", longDescription);
      formData.append("category", category); // send selected category (name)
      formData.append("price", price);
      formData.append("discount", discount);
      formData.append("sizes", JSON.stringify(sizes));
      formData.append("bestSeller", bestSeller);

      const response = await axios.post(
        backendUrl + "/api/product/add",
        formData,
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Product added");
        resetForm();
      } else {
        toast.error(response.data.message || "Failed to add product");
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Something went wrong"
      );
    }
  };

  const resetForm = () => {
    setImage1(null);
    setImage2(null);
    setImage3(null);
    setImage4(null);
    setName("");
    setDescription("");
    setLongDescription("");
    setCategory("");
    setPrice("");
    setDiscount(0);
    setSizes([]);
    setBestSeller(false);
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col items-start w-full gap-3"
    >
      <div>
        <p className="mb-2 text-lg font-semibold">Upload Product Image(s)</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((n) => (
            <label key={n} htmlFor={`image${n}`}>
              <img
                className="w-20 border-2 border-gray-500 rounded-lg cursor-pointer object-cover aspect-square"
                src={
                  !eval(`image${n}`)
                    ? assets.upload_area
                    : URL.createObjectURL(eval(`image${n}`))
                }
                alt="Upload"
              />
              <input
                onChange={(e) => eval(`setImage${n}`)(e.target.files[0])}
                type="file"
                id={`image${n}`}
                hidden
                accept="image/*"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="w-full mt-2">
        <p className="mb-2 text-lg font-semibold">Product Item Name</p>
        <input
          onChange={(e) => setName(e.target.value)}
          value={name}
          className="w-full px-3 py-2 border border-gray-500 max-w-[500px]"
          type="text"
          placeholder="Enter Product Name"
          required
        />
      </div>

      <div className="w-full mt-2">
        <p className="mb-2 text-lg font-semibold">Short Description</p>
        <textarea
          onChange={(e) => setDescription(e.target.value)}
          value={description}
          className="w-full px-3 py-2 border border-gray-500 max-w-[500px] min-h-24"
          placeholder="Enter short description"
          required
        />
      </div>

      <div className="w-full mt-2">
        <p className="mb-2 text-lg font-semibold">Long Description</p>
        <ReactQuill
          theme="snow"
          value={longDescription}
          onChange={setLongDescription}
          className="min-h-40"
        />
      </div>

      <div className="flex flex-col w-full gap-2 sm:flex-row sm:gap-8 mt-12">
        <div>
          <p className="mb-2 text-lg font-semibold">Product Category</p>
          <select
            onChange={(e) => setCategory(e.target.value)}
            value={category}
            className="w-full px-3 py-2 border border-gray-500 max-w-[500px]"
            required
            disabled={catLoading}
          >
            <option value="">
              {catLoading ? "Loading categories…" : "Select Category"}
            </option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-2 text-lg font-semibold">Price</p>
          <input
            onChange={(e) => setPrice(e.target.value)}
            value={price}
            className="w-full px-3 py-2 border border-gray-500 max-w-[500px]"
            type="number"
            min="0"
            placeholder="Enter Product Price"
            required
          />
        </div>

        <div>
          <p className="mb-2 text-lg font-semibold">Discount (%)</p>
          <input
            onChange={(e) => setDiscount(e.target.value)}
            value={discount}
            className="w-full px-3 py-2 border border-gray-500 max-w-[500px]"
            type="number"
            min="0"
            max="100"
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-lg font-semibold">Product Sizes</p>
        <div className="flex flex-wrap gap-3">
          {["S-38", "M-40", "L-42", "XL-44", "XXL-46"].map((size) => (
            <button
              type="button"
              key={size}
              onClick={() =>
                setSizes((prev) =>
                  prev.includes(size)
                    ? prev.filter((i) => i !== size)
                    : [...prev, size]
                )
              }
              className={`px-3 py-1 rounded-md ${
                sizes.includes(size) ? "bg-gray-600 text-white" : "bg-slate-200"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        <input
          type="checkbox"
          id="bestSeller"
          checked={bestSeller}
          onChange={() => setBestSeller((prev) => !prev)}
        />
        <label htmlFor="bestSeller" className="ml-2 cursor-pointer">
          Add to Best Seller
        </label>
      </div>

      <div className="flex flex-col w-full gap-2 sm:flex-row sm:gap-8">
        <button
          type="submit"
          className="px-5 py-2 mt-2 text-white rounded-lg bg-slate-700"
        >
          Add Product
        </button>
        <button
          type="button"
          className="px-5 py-2 mt-2 text-white rounded-lg bg-slate-700"
          onClick={resetForm}
        >
          Reset Details
        </button>
      </div>
    </form>
  );
};

export default Add;
