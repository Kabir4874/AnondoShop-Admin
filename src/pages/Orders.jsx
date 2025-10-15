import axios from "axios";
import {
  ArrowUpDown,
  CalendarClock,
  Eye,
  Loader2,
  MapPin,
  Phone,
  SlidersHorizontal,
  Truck,
  User2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { backendUrl } from "../App";

const STATUS_OPTIONS = [
  "All",
  "Order Placed",
  "Pending",
  "Packing",
  "Shipped",
  "Out for delivery",
  "Delivered",
  "Canceled",
];

const SORT_OPTIONS = [
  { value: "date_desc", label: "Newest first" },
  { value: "date_asc", label: "Oldest first" },
  { value: "amount_desc", label: "Amount: High → Low" },
  { value: "amount_asc", label: "Amount: Low → High" },
  { value: "status_asc", label: "Status: A → Z" },
  { value: "status_desc", label: "Status: Z → A" },
];

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterStatus, setFilterStatus] = useState("All");
  const [sortBy, setSortBy] = useState("date_desc");

  const headers = useMemo(() => ({ headers: { token } }), [token]);

  // Modal state (courier check) — no input, auto-fetch
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPhone, setModalPhone] = useState("");
  const [courierLoading, setCourierLoading] = useState(false);
  const [courierData, setCourierData] = useState(null);

  const fetchAllOrders = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const { data } = await axios.post(
        `${backendUrl}/api/order/list`,
        {},
        headers
      );
      if (data.success) {
        // newest first coming from API? we control via sort selector anyway
        setOrders(data.orders || []);
      } else {
        toast.error(data.message || "Failed to load orders");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Failed to load orders"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const statusHandler = async (event, orderId) => {
    try {
      const newStatus = event.target.value;
      const { data } = await axios.post(
        `${backendUrl}/api/order/status`,
        { orderId, status: newStatus },
        headers
      );
      if (data.success) {
        toast.success("Status updated");
        fetchAllOrders();
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Something went wrong"
      );
    }
  };

  // ---------- Courier check (auto fetch) ----------
  const normalizeCourier = (raw) => {
    let couriers = [];
    if (Array.isArray(raw?.couriers)) {
      couriers = raw.couriers.map((c) => ({
        name: c.name || c.courier || "Unknown",
        total: Number(c.total ?? 0),
        success: Number(c.success ?? 0),
        cancel: Number(c.cancel ?? 0),
      }));
    } else if (raw && typeof raw === "object") {
      couriers = Object.entries(raw).map(([name, v]) => ({
        name,
        total: Number(v?.total ?? 0),
        success: Number(v?.success ?? 0),
        cancel: Number(v?.cancel ?? 0),
      }));
    }

    const totals = couriers.reduce(
      (acc, c) => {
        acc.total += c.total;
        acc.success += c.success;
        acc.cancel += c.cancel;
        return acc;
      },
      { total: 0, success: 0, cancel: 0 }
    );

    const pctSuccess =
      totals.total > 0 ? Math.round((totals.success / totals.total) * 100) : 0;
    const pctCancel =
      totals.total > 0 ? Math.round((totals.cancel / totals.total) * 100) : 0;

    return {
      couriers,
      totals,
      pct: { success: pctSuccess, cancel: pctCancel },
    };
  };

  const checkCourier = async (phone) => {
    if (!phone?.trim()) {
      toast.warn("No phone number found for this order");
      return;
    }
    try {
      setCourierLoading(true);
      const { data } = await axios.post(
        `${backendUrl}/api/order/courier/check`,
        { phone: phone.trim() },
        headers
      );
      if (data?.success) {
        setCourierData(normalizeCourier(data.data));
      } else {
        setCourierData(null);
        toast.error(data?.message || "Failed to check courier");
      }
    } catch (error) {
      setCourierData(null);
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Courier check failed"
      );
    } finally {
      setCourierLoading(false);
    }
  };

  const openCourierModal = (phone) => {
    setModalPhone(phone || "");
    setCourierData(null);
    setModalOpen(true);
    // auto-fetch data immediately
    checkCourier(phone || "");
  };

  const closeCourierModal = () => {
    setModalOpen(false);
    setCourierLoading(false);
    setCourierData(null);
    setModalPhone("");
  };

  // ---------- Filter & Sort (client-side) ----------
  const visible = useMemo(() => {
    let list = Array.isArray(orders) ? [...orders] : [];

    if (filterStatus !== "All") {
      list = list.filter((o) => String(o?.status) === filterStatus);
    }

    const by = sortBy;
    list.sort((a, b) => {
      const da = new Date(a.date).getTime() || 0;
      const db = new Date(b.date).getTime() || 0;
      const aa = Number(a.amount || 0);
      const ab = Number(b.amount || 0);
      const sa = String(a.status || "");
      const sb = String(b.status || "");

      switch (by) {
        case "date_desc":
          return db - da;
        case "date_asc":
          return da - db;
        case "amount_desc":
          return ab - aa;
        case "amount_asc":
          return aa - ab;
        case "status_desc":
          return sb.localeCompare(sa);
        case "status_asc":
          return sa.localeCompare(sb);
        default:
          return 0;
      }
    });

    return list;
  }, [orders, filterStatus, sortBy]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header & toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Truck className="w-6 h-6" />
          <h1 className="text-2xl font-semibold">Orders</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            <select
              className="px-3 py-2 border rounded-md"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              title="Filter by status"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="inline-flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4" />
            <select
              className="px-3 py-2 border rounded-md"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              title="Sort orders"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        {/* Head */}
        <div className="hidden lg:grid grid-cols-[1.1fr_1.8fr_1.2fr_1fr_1fr_1.2fr_1fr] gap-2 py-3 px-4 bg-gray-100 text-sm font-semibold">
          <div>Order</div>
          <div>Items</div>
          <div>Customer</div>
          <div>Address</div>
          <div>Amount</div>
          <div>Meta</div>
          <div className="text-center">Actions</div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-10 text-center text-gray-600">
            <Loader2 className="inline-block w-5 h-5 mr-2 animate-spin" />
            Loading orders…
          </div>
        )}

        {/* Empty */}
        {!loading && visible.length === 0 && (
          <div className="py-10 text-center text-gray-600">
            No orders found.
          </div>
        )}

        {/* Rows */}
        {!loading &&
          visible.map((order) => {
            const itemSummary =
              Array.isArray(order.items) && order.items.length
                ? order.items
                    .slice(0, 3)
                    .map(
                      (i) =>
                        `${i.name} × ${i.quantity}${
                          i.size ? ` (${i.size})` : ""
                        }`
                    )
                    .join(", ") + (order.items.length > 3 ? "…" : "")
                : "—";
            const customer = order?.address?.recipientName || "—";
            const phone = order?.address?.phone || "—";
            const addressLine = order?.address
              ? `${order.address.addressLine1 || ""}, ${
                  order.address.district || ""
                } ${order.address.postalCode || ""}`
              : "—";
            const amount = Number(order.amount || 0);

            return (
              <div
                key={order._id}
                className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.8fr_1.2fr_1fr_1fr_1.2fr_1fr] gap-3 lg:gap-2 py-4 px-4 border-t text-sm items-start"
              >
                {/* Order info */}
                <div className="space-y-1">
                  <div className="font-semibold">
                    #{String(order._id).slice(-8)}
                  </div>
                  <div className="inline-flex items-center gap-1 text-gray-700">
                    <CalendarClock className="w-4 h-4" />
                    {new Date(order.date).toLocaleString()}
                  </div>
                  <div className="mt-1">
                    <select
                      onChange={(e) => statusHandler(e, order._id)}
                      value={order.status}
                      className="px-2 py-1 border rounded text-xs"
                      title="Update order status"
                    >
                      <option value="Order Placed">Order Placed</option>
                      <option value="Pending">Pending</option>
                      <option value="Packing">Packing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Out for delivery">Out for delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Canceled">Canceled</option>
                    </select>
                  </div>
                </div>

                {/* Items */}
                <div className="text-gray-800">{itemSummary}</div>

                {/* Customer */}
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1 font-medium">
                    <User2 className="w-4 h-4" />
                    {customer}
                  </div>
                  <div className="inline-flex items-center gap-1 text-gray-700 break-all">
                    <Phone className="w-4 h-4" />
                    {phone}
                  </div>
                </div>

                {/* Address */}
                <div className="inline-flex items-start gap-1 text-gray-700">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <span>{addressLine}</span>
                </div>

                {/* Amount */}
                <div className="inline-flex items-center gap-1 font-semibold">
                  {amount} ৳
                </div>

                {/* Meta */}
                <div className="space-y-1">
                  <div>
                    <span className="text-gray-500">Method:</span>{" "}
                    <span className="font-medium">{order.paymentMethod}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Payment:</span>{" "}
                    <span
                      className={`font-medium ${
                        order.payment ? "text-green-700" : "text-amber-700"
                      }`}
                    >
                      {order.payment ? "Done" : "Pending"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center lg:justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => openCourierModal(order?.address?.phone)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-slate-700 text-white hover:bg-slate-800"
                    title="Check customer delivery rate"
                  >
                    <Eye className="w-4 h-4" />
                    Check Customer
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {/* Modal (auto-fetched data, no input) */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCourierModal();
          }}
        >
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <div className="font-semibold">
                Customer Courier Summary {modalPhone ? `• ${modalPhone}` : ""}
              </div>
              <button
                className="p-1 rounded hover:bg-gray-100"
                onClick={closeCourierModal}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-5 space-y-4">
              {courierLoading && (
                <div className="py-6 text-center text-gray-600">
                  <Loader2 className="inline-block w-5 h-5 mr-2 animate-spin" />
                  Checking…
                </div>
              )}

              {!courierLoading && courierData && (
                <>
                  {/* Summary table */}
                  <div className="border rounded-md overflow-hidden">
                    <div className="grid grid-cols-4 bg-gray-100 text-sm font-semibold px-4 py-2">
                      <div>Courier</div>
                      <div>Total</div>
                      <div>Success</div>
                      <div>Cancel</div>
                    </div>
                    {courierData.couriers.length === 0 ? (
                      <div className="px-4 py-6 text-center text-gray-600">
                        No records found for this customer.
                      </div>
                    ) : (
                      courierData.couriers.map((c) => (
                        <div
                          key={c.name}
                          className="grid grid-cols-4 px-4 py-2 border-t text-sm"
                        >
                          <div>{c.name}</div>
                          <div>{c.total}</div>
                          <div>{c.success}</div>
                          <div>{c.cancel}</div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 bg-gray-200 text-gray-800 px-3 py-1.5 rounded-full text-sm">
                      Total : {courierData.totals.total}
                    </span>
                    <span className="inline-flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-full text-sm">
                      Success : {courierData.totals.success}
                    </span>
                    <span className="inline-flex items-center gap-2 bg-rose-600 text-white px-3 py-1.5 rounded-full text-sm">
                      Cancel : {courierData.totals.cancel}
                    </span>
                  </div>

                  {/* Success bar */}
                  <div className="mt-2">
                    <div className="h-6 w-full bg-gray-200 rounded overflow-hidden">
                      <div
                        className="h-full bg-green-600"
                        style={{ width: `${courierData.pct.success}%` }}
                      />
                    </div>
                    <div className="text-center text-sm font-medium mt-1">
                      {courierData.pct.success}% Success /{" "}
                      {courierData.pct.cancel}% Cancel
                    </div>
                  </div>
                </>
              )}

              {!courierLoading && !courierData && (
                <div className="py-6 text-center text-gray-600">
                  Unable to fetch courier summary.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
