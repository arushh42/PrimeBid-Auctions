import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { api, getErrorMessage } from "@/lib/api";

const inputClass =
  "w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D6482B]";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const navigateTo = useNavigate();
  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleContactForm = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/contact", form);
      toast.success(response.data.message);
      navigateTo("/");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to send message."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full ml-0 m-0 h-fit px-5 pt-20 lg:pl-[320px] flex flex-col min-h-screen py-4 justify-start">
      <div className="bg-white mx-auto w-full h-auto px-2 flex flex-col gap-4 items-center py-4 justify-center rounded-md">
        <form className="flex flex-col gap-5 w-full" onSubmit={handleContactForm}>
          <h3 className="text-[#D6482B] text-xl font-semibold mb-2 min-[480px]:text-xl md:text-2xl lg:text-3xl">
            Contact Us
          </h3>
          <div className="flex flex-col gap-2">
            <label htmlFor="ct-name" className="text-[16px] text-stone-500">Your Name</label>
            <input id="ct-name" type="text" maxLength={80} required value={form.name}
              onChange={update("name")} className={inputClass} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="ct-email" className="text-[16px] text-stone-500">Your Email</label>
            <input id="ct-email" type="email" required value={form.email}
              onChange={update("email")} className={inputClass} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="ct-phone" className="text-[16px] text-stone-500">Your Phone (optional)</label>
            <input id="ct-phone" type="tel" maxLength={20} value={form.phone}
              onChange={update("phone")} className={inputClass} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="ct-subject" className="text-[16px] text-stone-500">Subject</label>
            <input id="ct-subject" type="text" maxLength={150} required value={form.subject}
              onChange={update("subject")} className={inputClass} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="ct-message" className="text-[16px] text-stone-500">Message</label>
            <textarea id="ct-message" rows={7} maxLength={5000} required value={form.message}
              onChange={update("message")} className={inputClass} />
          </div>
          <button
            className="bg-[#d6482b] mx-auto font-semibold hover:bg-[#b8381e] text-xl transition-all duration-300 py-2 px-4 rounded-md text-white my-4 disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? "Sending Message..." : "Send Message"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default Contact;
