import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { backendUrl } from "../App";
const initial = {
  enableFacebook: false,
  fbPixelId: "",
  fbAccessToken: "",
  fbTestEventCode: "",

  enableTikTok: false,
  tiktokPixelId: "",
  tiktokAccessToken: "",
};

export default function MarketingSettings({ token }) {
  const [form, setForm] = useState(initial);
  const headers = { headers: { token } };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(
          `${backendUrl}/api/marketing-config/public`
        );
        if (data?.success) {
          setForm((f) => ({
            ...f,
            enableFacebook: !!data.config.enableFacebook,
            fbPixelId: data.config.fbPixelId || "",
            fbTestEventCode: data.config.fbTestEventCode || "",
            enableTikTok: !!data.config.enableTikTok,
            tiktokPixelId: data.config.tiktokPixelId || "",
          }));
        }
      } catch {}
    })();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/marketing-config`,
        form,
        headers
      );
      if (data?.success) toast.success("Saved!");
      else toast.error(data?.message || "Save failed");
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message);
    }
  };

  return (
    <form
      onSubmit={save}
      className="max-w-2xl p-4 bg-white border rounded-lg flex flex-col gap-4"
    >
      <h2 className="text-xl font-semibold">Marketing Pixels</h2>

      <div className="border rounded p-3">
        <label className="font-semibold block mb-2">Facebook</label>
        <label className="inline-flex gap-2 items-center mb-2">
          <input
            type="checkbox"
            checked={form.enableFacebook}
            onChange={(e) =>
              setForm({ ...form, enableFacebook: e.target.checked })
            }
          />
          Enable Facebook Pixel + CAPI
        </label>
        <input
          className="border p-2 rounded mb-2 w-full"
          placeholder="Facebook Pixel ID"
          value={form.fbPixelId}
          onChange={(e) => setForm({ ...form, fbPixelId: e.target.value })}
        />
        <input
          className="border p-2 rounded mb-2 w-full"
          placeholder="Facebook Access Token (server only)"
          value={form.fbAccessToken}
          onChange={(e) => setForm({ ...form, fbAccessToken: e.target.value })}
        />
        <input
          className="border p-2 rounded w-full"
          placeholder="Facebook Test Event Code (optional)"
          value={form.fbTestEventCode}
          onChange={(e) =>
            setForm({ ...form, fbTestEventCode: e.target.value })
          }
        />
      </div>

      <div className="border rounded p-3">
        <label className="font-semibold block mb-2">TikTok</label>
        <label className="inline-flex gap-2 items-center mb-2">
          <input
            type="checkbox"
            checked={form.enableTikTok}
            onChange={(e) =>
              setForm({ ...form, enableTikTok: e.target.checked })
            }
          />
          Enable TikTok Pixel + Events API
        </label>
        <input
          className="border p-2 rounded mb-2 w-full"
          placeholder="TikTok Pixel ID"
          value={form.tiktokPixelId}
          onChange={(e) => setForm({ ...form, tiktokPixelId: e.target.value })}
        />
        <input
          className="border p-2 rounded w-full"
          placeholder="TikTok Access Token (server only)"
          value={form.tiktokAccessToken}
          onChange={(e) =>
            setForm({ ...form, tiktokAccessToken: e.target.value })
          }
        />
      </div>

      <button className="bg-black text-white px-4 py-2 rounded self-start">
        Save
      </button>
    </form>
  );
}
