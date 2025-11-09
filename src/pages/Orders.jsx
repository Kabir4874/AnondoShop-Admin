// src/pages/Orders.jsx (Admin)
import axios from "axios";
import {
  ArrowUpDown,
  CalendarClock,
  Edit3,
  Eye,
  Loader2,
  MapPin,
  Phone,
  RotateCcw,
  Search as SearchIcon,
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
  "Confirmed",
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

const BD_PHONE_REGEX = /^(?:\+?88)?01[3-9]\d{8}$/;
const BD_POSTAL_REGEX = /^\d{4}$/;

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Server-side filters
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortBy, setSortBy] = useState("date_desc");
  const [dateFrom, setDateFrom] = useState(""); // YYYY-MM-DD
  const [dateTo, setDateTo] = useState(""); // YYYY-MM-DD
  const [searchTerm, setSearchTerm] = useState("");

  const headers = useMemo(() => ({ headers: { token } }), [token]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalPhone, setModalPhone] = useState("");
  const [courierLoading, setCourierLoading] = useState(false);
  const [courierData, setCourierData] = useState(null);

  const [addrOpen, setAddrOpen] = useState(false);
  const [addrSaving, setAddrSaving] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [addrForm, setAddrForm] = useState({
    recipientName: "",
    phone: "",
    addressLine1: "",
    district: "",
    postalCode: "",
  });

  const fetchAllOrders = async () => {
    if (!token) return;
    try {
      setLoading(true);

      const payload = {
        status: filterStatus !== "All" ? filterStatus : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: searchTerm?.trim() ? searchTerm.trim() : undefined,
        sort: sortBy || "date_desc",
      };

      const { data } = await axios.post(
        `${backendUrl}/api/order/list`,
        payload,
        headers
      );
      if (data.success) {
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

  const normalizeCourier = (raw) => {
    const cd = raw?.courierData || {};
    const summary = cd.summary || {
      total_parcel: 0,
      success_parcel: 0,
      cancelled_parcel: 0,
      success_ratio: 0,
    };

    const couriers = Object.entries(cd)
      .filter(([k]) => k !== "summary")
      .map(([key, v]) => ({
        key,
        name: v?.name || key,
        logo: v?.logo || "",
        total: Number(v?.total_parcel ?? 0),
        success: Number(v?.success_parcel ?? 0),
        cancel: Number(v?.cancelled_parcel ?? 0),
        ratio: Number(v?.success_ratio ?? 0),
      }));

    const totals = {
      total: Number(summary?.total_parcel ?? 0),
      success: Number(summary?.success_parcel ?? 0),
      cancel: Number(summary?.cancelled_parcel ?? 0),
    };
    const pct = {
      success:
        totals.total > 0
          ? Math.round((totals.success / totals.total) * 100)
          : 0,
      cancel:
        totals.total > 0 ? Math.round((totals.cancel / totals.total) * 100) : 0,
    };

    return { couriers, totals, pct };
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
    checkCourier(phone || "");
  };

  const closeCourierModal = () => {
    setModalOpen(false);
    setCourierLoading(false);
    setCourierData(null);
    setModalPhone("");
  };

  const openAddressModal = (order) => {
    setEditingOrderId(order?._id || null);
    setAddrForm({
      recipientName: order?.address?.recipientName || "",
      phone: order?.address?.phone || "",
      addressLine1: order?.address?.addressLine1 || "",
      district: order?.address?.district || "",
      postalCode: order?.address?.postalCode || "",
    });
    setAddrOpen(true);
  };

  const closeAddressModal = () => {
    setAddrOpen(false);
    setAddrSaving(false);
    setEditingOrderId(null);
    setAddrForm({
      recipientName: "",
      phone: "",
      addressLine1: "",
      district: "",
      postalCode: "",
    });
  };

  const onAddrChange = (e) => {
    const { name, value } = e.target;
    setAddrForm((f) => ({ ...f, [name]: value }));
  };

  const validateAddr = () => {
    const { recipientName, phone, addressLine1, district, postalCode } =
      addrForm;
    if (!recipientName || !phone || !addressLine1 || !district || !postalCode) {
      toast.error("All address fields are required.");
      return false;
    }
    if (!BD_PHONE_REGEX.test(phone)) {
      toast.error("Invalid Bangladesh phone number.");
      return false;
    }
    if (!BD_POSTAL_REGEX.test(postalCode)) {
      toast.error("Postal code must be a 4-digit Bangladesh postcode.");
      return false;
    }
    return true;
  };

  const saveAddress = async () => {
    if (!editingOrderId) return;
    if (!validateAddr()) return;

    try {
      setAddrSaving(true);
      const { data } = await axios.post(
        `${backendUrl}/api/order/update-address`,
        { orderId: editingOrderId, address: addrForm },
        headers
      );
      if (data?.success) {
        toast.success("Address updated");
        closeAddressModal();
        fetchAllOrders();
      } else {
        toast.error(data?.message || "Failed to update address");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Failed to update address"
      );
    } finally {
      setAddrSaving(false);
    }
  };

  // What we render = what server returns (filters are server-side)
  const visible = orders;

  // Quick stats for header
  const totalAmount = useMemo(
    () => visible.reduce((sum, o) => sum + (Number(o.amount) || 0), 0),
    [visible]
  );

  const applyFilters = () => {
    fetchAllOrders();
  };

  const clearFilters = () => {
    setFilterStatus("All");
    setSortBy("date_desc");
    setDateFrom("");
    setDateTo("");
    setSearchTerm("");
    setTimeout(fetchAllOrders, 0);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Sticky header bar */}
      <div className=" top-0 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-5 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-black text-white">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold leading-tight">
                  Orders
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  Manage and track customer orders in real-time
                </p>
              </div>
            </div>

            {/* Filters toolbar */}
            <div className="w-full lg:w-auto flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
              {/* Status */}
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gray-600" />
                <select
                  className="px-3 py-2 border rounded-md bg-white"
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

              {/* Date range */}
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <input
                  type="date"
                  className="px-3 py-2 border rounded-md bg-white"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  title="From date"
                />
                <span className="text-gray-500 text-sm">to</span>
                <input
                  type="date"
                  className="px-3 py-2 border rounded-md bg-white"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  title="To date"
                />
              </div>

              {/* Search */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <SearchIcon className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    className="w-full sm:w-56 md:w-64 pl-9 pr-3 py-2 border rounded-md bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search name / phone / order id"
                    title="Search"
                  />
                </div>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-gray-600" />
                <select
                  className="px-3 py-2 border rounded-md bg-white"
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

              {/* Apply / Reset */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={applyFilters}
                  className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  title="Apply filters"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-3 py-2 rounded-md border hover:bg-gray-50 inline-flex items-center gap-2"
                  title="Reset filters"
                >
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="rounded-lg border p-3 bg-white">
              <p className="text-xs text-gray-500">Orders found</p>
              <p className="text-lg font-semibold">{visible.length}</p>
            </div>
            <div className="rounded-lg border p-3 bg-white">
              <p className="text-xs text-gray-500">Total amount</p>
              <p className="text-lg font-semibold">
                {totalAmount.toLocaleString()} ৳
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-2xl mx-auto w-full px-3 sm:px-5">
        {/* Desktop table */}
        <div className="hidden xl:block bg-white border rounded-xl overflow-hidden shadow-sm">
          {/* Head */}
          <div className="grid grid-cols-[1.1fr_1.8fr_1.2fr_1fr_1fr_1.4fr_1.2fr] gap-2 py-3 px-4 bg-gray-50 text-sm font-semibold">
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
                  className="grid grid-cols-1 xl:grid-cols-[1.1fr_1.8fr_1.2fr_1fr_1fr_1.4fr_1.2fr] gap-3 xl:gap-2 py-4 px-4 border-t text-sm items-start hover:bg-gray-50"
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
                        <option value="Confirmed">Confirmed</option>
                        <option value="Pending">Pending</option>
                        <option value="Packing">Packing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Out for delivery">
                          Out for delivery
                        </option>
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
                    {amount.toLocaleString()} ৳
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
                  <div className="flex items-center xl:justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => openCourierModal(order?.address?.phone)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-slate-700 text-white hover:bg-slate-800"
                      title="Check customer delivery rate"
                    >
                      <Eye className="w-4 h-4" />
                      Check
                    </button>
                    <button
                      type="button"
                      onClick={() => openAddressModal(order)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700"
                      title="Edit address"
                    >
                      <Edit3 className="w-4 h-4" />
                      Address
                    </button>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Mobile / Tablet cards */}
        <div className="xl:hidden grid gap-3">
          {loading && (
            <div className="py-10 text-center text-gray-600">
              <Loader2 className="inline-block w-5 h-5 mr-2 animate-spin" />
              Loading orders…
            </div>
          )}

          {!loading && visible.length === 0 && (
            <div className="py-10 text-center text-gray-600">
              No orders found.
            </div>
          )}

          {!loading &&
            visible.map((order) => {
              const itemSummary =
                Array.isArray(order.items) && order.items.length
                  ? order.items
                      .slice(0, 2)
                      .map(
                        (i) =>
                          `${i.name} × ${i.quantity}${
                            i.size ? ` (${i.size})` : ""
                          }`
                      )
                      .join(", ") + (order.items.length > 2 ? "…" : "")
                  : "—";
              const customer = order?.address?.recipientName || "—";
              const phone = order?.address?.phone || "—";
              const addressLine = order?.address
                ? `${order.address.addressLine1 || ""}, ${
                    order.address.district || ""
                  } ${order.address.postalCode || ""}`
                : "—";
              const amount = Number(order.amount || 0);
              const paid = !!order.payment;

              return (
                <div
                  key={order._id}
                  className="rounded-xl border bg-white shadow-sm overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-3 px-4 py-3 border-b">
                    <div>
                      <p className="text-sm text-gray-500">Order</p>
                      <p className="font-semibold">
                        #{String(order._id).slice(-8)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="text-sm">
                        {new Date(order.date).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="px-4 py-3 grid gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          paid
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {paid ? "Paid" : "Payment Pending"}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                        {order.paymentMethod || "—"}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                        {order.status}
                      </span>
                    </div>

                    <div className="text-gray-800">
                      <p className="text-sm">
                        <span className="font-medium">Items:</span>{" "}
                        {itemSummary}
                      </p>
                    </div>

                    <div className="flex items-start gap-2 text-gray-700">
                      <User2 className="w-4 h-4 mt-0.5 flex-none" />
                      <div className="text-sm">
                        <p className="font-medium">{customer}</p>
                        <p className="flex items-center gap-1 break-all">
                          <Phone className="w-3.5 h-3.5" /> {phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-gray-700">
                      <MapPin className="w-4 h-4 mt-0.5 flex-none" />
                      <p className="text-sm">{addressLine}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="text-base font-semibold">
                        {amount.toLocaleString()} ৳
                      </p>
                    </div>
                  </div>

                  <div className="px-4 py-3 border-t flex items-center justify-between gap-2">
                    <select
                      onChange={(e) => statusHandler(e, order._id)}
                      value={order.status}
                      className="flex-1 px-2 py-2 border rounded text-sm bg-white"
                      title="Update order status"
                    >
                      <option value="Order Placed">Order Placed</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Pending">Pending</option>
                      <option value="Packing">Packing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Out for delivery">Out for delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Canceled">Canceled</option>
                    </select>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openCourierModal(order?.address?.phone)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded bg-slate-700 text-white hover:bg-slate-800 text-sm"
                        title="Check customer delivery rate"
                      >
                        <Eye className="w-4 h-4" />
                        Check
                      </button>
                      <button
                        type="button"
                        onClick={() => openAddressModal(order)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
                        title="Edit address"
                      >
                        <Edit3 className="w-4 h-4" />
                        Address
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Courier Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCourierModal();
          }}
        >
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden">
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

            <div className="p-5 space-y-4">
              {courierLoading && (
                <div className="py-6 text-center text-gray-600">
                  <Loader2 className="inline-block w-5 h-5 mr-2 animate-spin" />
                  Checking…
                </div>
              )}

              {!courierLoading && courierData && (
                <>
                  <div className="border rounded-md overflow-hidden">
                    <div className="grid grid-cols-5 bg-gray-100 text-sm font-semibold px-4 py-2">
                      <div>Courier</div>
                      <div>Total</div>
                      <div>Success</div>
                      <div>Cancel</div>
                      <div>Success %</div>
                    </div>

                    {courierData.couriers.length === 0 ? (
                      <div className="px-4 py-6 text-center text-gray-600">
                        No records found for this customer.
                      </div>
                    ) : (
                      courierData.couriers.map((c) => (
                        <div
                          key={c.key}
                          className="grid grid-cols-5 px-4 py-2 border-t text-sm items-center"
                        >
                          <div className="flex items-center gap-2">
                            {c.logo ? (
                              <img
                                src={c.logo}
                                alt={c.name}
                                className="w-5 h-5 object-contain"
                              />
                            ) : null}
                            <span>{c.name}</span>
                          </div>
                          <div>{c.total}</div>
                          <div>{c.success}</div>
                          <div>{c.cancel}</div>
                          <div>{c.ratio}%</div>
                        </div>
                      ))
                    )}
                  </div>

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

      {/* Edit Address Modal */}
      {addrOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAddressModal();
          }}
        >
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <div className="font-semibold">Edit Delivery Address</div>
              <button
                className="p-1 rounded hover:bg-gray-100"
                onClick={closeAddressModal}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <label className="text-sm font-medium">
                  Recipient Name
                  <input
                    name="recipientName"
                    value={addrForm.recipientName}
                    onChange={onAddrChange}
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                    type="text"
                    placeholder="e.g., Mohammad Rahim"
                    required
                  />
                </label>

                <label className="text-sm font-medium">
                  Phone (BD)
                  <input
                    name="phone"
                    value={addrForm.phone}
                    onChange={onAddrChange}
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                    type="tel"
                    placeholder="01XXXXXXXXX or +8801XXXXXXXXX"
                    required
                  />
                </label>

                <label className="text-sm font-medium">
                  Address Line
                  <input
                    name="addressLine1"
                    value={addrForm.addressLine1}
                    onChange={onAddrChange}
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                    type="text"
                    placeholder="House/Road/Village"
                    required
                  />
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="text-sm font-medium">
                    District
                    <input
                      name="district"
                      value={addrForm.district}
                      onChange={onAddrChange}
                      className="mt-1 w-full px-3 py-2 border rounded-md"
                      type="text"
                      placeholder="e.g., Dhaka"
                      required
                    />
                  </label>

                  <label className="text-sm font-medium">
                    Postal Code
                    <input
                      name="postalCode"
                      value={addrForm.postalCode}
                      onChange={onAddrChange}
                      className="mt-1 w-full px-3 py-2 border rounded-md"
                      type="text"
                      inputMode="numeric"
                      placeholder="4 digits"
                      required
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t flex items-center justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                onClick={closeAddressModal}
                type="button"
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                onClick={saveAddress}
                disabled={addrSaving}
                type="button"
              >
                {addrSaving ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                  </span>
                ) : (
                  "Save Address"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
