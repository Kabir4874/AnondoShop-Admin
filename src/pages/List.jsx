import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { backendUrl, currency } from "../App";

const List = ({ token }) => {
  const [listProducts, setListProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchListProducts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/product/list`);
      if (data.success) {
        setListProducts(data.products || []);
      } else {
        toast.error(data.message || "Failed to fetch products");
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || error.message || "Request failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const removeProduct = async (id) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/product/remove`,
        { id },
        { headers: { token } }
      );
      if (data.success) {
        toast.info(data.message || "Product removed");
        await fetchListProducts();
      } else {
        toast.error(data.message || "Failed to remove product");
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || error.message || "Request failed"
      );
    }
  };

  useEffect(() => {
    fetchListProducts();
  }, []);

  const effectivePrice = (price, discount) => {
    const d = Number(discount) || 0;
    if (!d) return price;
    const p = Number(price) || 0;
    return Math.max(0, p - (p * d) / 100);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="hidden md:grid grid-cols-[0.5fr_1fr_1.2fr_0.7fr_0.8fr_0.6fr_0.6fr_0.8fr] items-center py-2 px-2 border bg-gray-200 text-base text-center font-semibold">
        <div>Image</div>
        <div className="text-left">Name</div>
        <div className="text-left">Description</div>
        <div>Category</div>
        <div>Sub Category</div>
        <div>Price</div>
        <div>Discount</div>
        <div>Action</div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-6 text-center text-sm text-gray-600">
          Loading products…
        </div>
      )}

      {/* Rows */}
      {!loading &&
        listProducts.map((item) => {
          const imgUrl =
            Array.isArray(item.image) && item.image.length
              ? item.image[0].url || item.image[0] // support old data (string) and new data ({url, publicId})
              : "";
          const finalPrice = effectivePrice(item.price, item.discount);

          return (
            <div
              key={item._id}
              className="grid grid-cols-1 md:grid-cols-[0.5fr_1fr_1.2fr_0.7fr_0.8fr_0.6fr_0.6fr_0.8fr] items-center gap-3 md:gap-2 py-2 px-2 border text-sm"
            >
              {/* Image */}
              <div className="flex justify-center md:justify-start">
                {imgUrl ? (
                  <img
                    className="w-12 h-12 object-cover rounded"
                    src={imgUrl}
                    alt={item.name}
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-gray-100" />
                )}
              </div>

              {/* Name */}
              <p className="md:text-left font-medium">{item.name}</p>

              {/* Short Description */}
              <p className="md:text-left text-gray-700 line-clamp-2">
                {item.description}
              </p>

              {/* Category */}
              <p className="text-center">{item.category}</p>

              {/* Sub Category */}
              <p className="text-center">{item.subCategory}</p>

              {/* Price (shows original and discounted if applicable) */}
              <div className="text-center">
                {Number(item.discount) > 0 ? (
                  <div className="flex flex-col items-center">
                    <span className="line-through text-gray-400">
                      &#2547; {item.price}
                    </span>
                    <span className="font-semibold">&#2547; {finalPrice}</span>
                  </div>
                ) : (
                  <span className="font-semibold">{currency(item.price)}</span>
                )}
              </div>

              {/* Discount */}
              <p className="text-center">{Number(item.discount) || 0}%</p>

              {/* Action */}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => navigate(`/edit/${item._id}`)}
                  className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                  title="Edit"
                  type="button"
                >
                  Edit
                </button>
                <button
                  onClick={() => removeProduct(item._id)}
                  className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                  title="Remove"
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}

      {!loading && listProducts.length === 0 && (
        <div className="py-6 text-center text-sm text-gray-600">
          No products found.
        </div>
      )}
    </div>
  );
};

export default List;
