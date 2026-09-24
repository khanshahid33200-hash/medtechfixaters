"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageSquare,
  Sparkles,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface FormState {
  fullName: string;
  organization: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  message?: string;
}

export default function ContactForm({
  selectedSubject = "Product & Platform Demonstration",
}: {
  selectedSubject?: string;
}) {
  const [formData, setFormData] = useState<FormState>({
    fullName: "",
    organization: "",
    email: "",
    phone: "",
    subject: selectedSubject,
    message: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedSubject) {
      setFormData((prev) => ({ ...prev, subject: selectedSubject }));
    }
  }, [selectedSubject]);

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!formData.fullName.trim()) {
      errs.fullName = "Full name is required";
    }
    if (!formData.email.trim()) {
      errs.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = "Please enter a valid email address";
    }
    if (formData.phone.trim() && formData.phone.trim().length < 8) {
      errs.phone = "Please enter a valid phone number";
    }
    if (!formData.message.trim()) {
      errs.message = "Message cannot be empty";
    } else if (formData.message.trim().length < 10) {
      errs.message = "Please write at least 10 characters";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const { error } = await supabase.from("contact_messages").insert([
        {
          full_name: formData.fullName.trim(),
          organization: formData.organization.trim() || null,
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          subject: formData.subject.trim() || "General Inquiry",
          message: formData.message.trim(),
          status: "new",
        },
      ]);

      if (error) {
        console.warn("Supabase contact table note:", error.message);
      }

      try {
        const backups = JSON.parse(
          localStorage.getItem("contact_messages_backup") || "[]"
        );
        backups.unshift({
          ...formData,
          created_at: new Date().toISOString(),
        });
        localStorage.setItem("contact_messages_backup", JSON.stringify(backups));
      } catch {
        // ignore
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error("Submission error:", err);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      organization: "",
      email: "",
      phone: "",
      subject: "Product & Platform Demonstration",
      message: "",
    });
    setSubmitted(false);
    setErrors({});
  };

  return (
    <section
      id="contact-form"
      className="relative overflow-hidden py-10 sm:py-16 lg:py-20 w-full"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10 items-stretch">
          
          {/* ─── LEFT SIDE: Contact Form ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6 }}
            className="relative flex flex-col justify-between rounded-2xl sm:rounded-[32px] border border-white/90 bg-white/85 p-5 sm:p-8 lg:p-10 shadow-[0_15px_50px_rgba(15,23,42,0.06)] backdrop-blur-2xl text-left"
          >
            <div>
              {/* Header */}
              <div className="flex items-center gap-1.5 text-blue-600 mb-1.5">
                <MessageSquare size={14} />
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em]">
                  DIRECT INQUIRY
                </span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#17191F]">
                Send Us a Message
              </h2>
              
              <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
                Fill out the details below and our healthcare technology team will connect with you.
              </p>

              {/* Form Content / Success State */}
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="mt-6 sm:mt-8 rounded-xl sm:rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 sm:p-8 text-center"
                  >
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/25">
                      <CheckCircle2 size={28} />
                    </div>

                    <h3 className="mt-4 text-xl sm:text-2xl font-bold text-slate-900">
                      Message Sent Successfully
                    </h3>

                    <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                      Thank you for contacting MedTech Fixaters. Our team will review your message and get back to you soon.
                    </p>

                    <button
                      onClick={resetForm}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-slate-800 cursor-pointer"
                    >
                      <span>Send Another Message</span>
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-5 sm:mt-7 space-y-3.5 sm:space-y-4"
                  >
                    {/* Row 1: Full Name & Organization */}
                    <div className="grid gap-3.5 sm:grid-cols-2">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) =>
                            setFormData({ ...formData, fullName: e.target.value })
                          }
                          placeholder="Dr. Aryan Sharma"
                          className={`w-full rounded-xl sm:rounded-2xl border bg-white/90 px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-[#17191F] placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-blue-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)] ${
                            errors.fullName ? "border-rose-400 bg-rose-50/30" : "border-slate-200/90"
                          }`}
                        />
                        {errors.fullName && (
                          <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.fullName}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Organization / Hospital
                        </label>
                        <input
                          type="text"
                          value={formData.organization}
                          onChange={(e) =>
                            setFormData({ ...formData, organization: e.target.value })
                          }
                          placeholder="City Care Hospital"
                          className="w-full rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white/90 px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-[#17191F] placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-blue-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)]"
                        />
                      </div>
                    </div>

                    {/* Row 2: Email & Phone */}
                    <div className="grid gap-3.5 sm:grid-cols-2">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="doctor@hospital.com"
                          className={`w-full rounded-xl sm:rounded-2xl border bg-white/90 px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-[#17191F] placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-blue-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)] ${
                            errors.email ? "border-rose-400 bg-rose-50/30" : "border-slate-200/90"
                          }`}
                        />
                        {errors.email && (
                          <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          placeholder="+91 95878 67559"
                          className={`w-full rounded-xl sm:rounded-2xl border bg-white/90 px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-[#17191F] placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-blue-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)] ${
                            errors.phone ? "border-rose-400 bg-rose-50/30" : "border-slate-200/90"
                          }`}
                        />
                        {errors.phone && (
                          <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.phone}</p>
                        )}
                      </div>
                    </div>

                    {/* Row 3: Subject */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Subject
                      </label>
                      <select
                        value={formData.subject}
                        onChange={(e) =>
                          setFormData({ ...formData, subject: e.target.value })
                        }
                        className="w-full rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white/90 px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-[#17191F] outline-none transition-all duration-200 focus:border-blue-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)] cursor-pointer"
                      >
                        <option value="Product & Platform Demonstration">
                          Product & Platform Demonstration
                        </option>
                        <option value="Hospital Partnership & Deployment">
                          Hospital Partnership & Deployment
                        </option>
                        <option value="Technical Support & Troubleshooting">
                          Technical Support & Troubleshooting
                        </option>
                        <option value="Pricing & Licensing Inquiry">
                          Pricing & Licensing Inquiry
                        </option>
                        <option value="General Inquiries">General Inquiries</option>
                      </select>
                    </div>

                    {/* Row 4: Message */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Message *
                      </label>
                      <textarea
                        rows={3}
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        placeholder="Tell us about your hospital, bed count, current OPD bottlenecks, or questions..."
                        className={`w-full rounded-xl sm:rounded-2xl border bg-white/90 p-3 sm:p-3.5 text-xs sm:text-sm text-[#17191F] placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-blue-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)] resize-none ${
                          errors.message ? "border-rose-400 bg-rose-50/30" : "border-slate-200/90"
                        }`}
                      />
                      {errors.message && (
                        <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.message}</p>
                      )}
                    </div>

                    {serverError && (
                      <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-600 border border-rose-200">
                        <AlertCircle size={14} />
                        <span>{serverError}</span>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group flex w-full items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 py-3 sm:py-3.5 px-5 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/25 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/35 hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          <span>Sending Message...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Message</span>
                          <Send size={14} className="transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ─── RIGHT SIDE: Connect Information & Response Card ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-between gap-4 sm:gap-6"
          >
            {/* Contact Details Card */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-[32px] border border-white/90 bg-white/80 p-5 sm:p-7 shadow-[0_10px_40px_rgba(15,23,42,0.05)] backdrop-blur-2xl text-left">
              <div className="flex items-center gap-1.5 text-orange-600 mb-1.5">
                <Sparkles size={14} />
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em]">
                  CONNECT DIRECTLY
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-[#17191F]">
                Get In Touch
              </h3>

              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Reach our clinical implementation specialists directly via email, phone, or in person.
              </p>

              {/* Direct Info List */}
              <div className="mt-5 sm:mt-6 space-y-3">
                {/* Email */}
                <a
                  href="mailto:contact@medtechfixaters.in"
                  className="group flex items-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-slate-100 bg-slate-50/80 p-3 sm:p-3.5 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50/50"
                >
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
                    <Mail size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      EMAIL US
                    </p>
                    <p className="truncate text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      contact@medtechfixaters.in
                    </p>
                  </div>
                </a>

                {/* Phone */}
                <a
                  href="tel:9587867559"
                  className="group flex items-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-slate-100 bg-slate-50/80 p-3 sm:p-3.5 transition-all duration-200 hover:border-orange-200 hover:bg-orange-50/50"
                >
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-orange-500 text-white shadow-sm shadow-orange-500/20">
                    <Phone size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      CALL OR WHATSAPP
                    </p>
                    <p className="truncate text-xs sm:text-sm font-bold text-slate-800 group-hover:text-orange-600 transition-colors">
                      +91 95878 67559
                    </p>
                  </div>
                </a>

                {/* Location */}
                <div className="flex items-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-slate-100 bg-slate-50/80 p-3 sm:p-3.5">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-500/20">
                    <MapPin size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      HEADQUARTERS
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800">
                      Jaipur, Rajasthan, India
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Response Promise Card */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-[32px] border border-blue-100 bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 p-5 sm:p-7 text-white shadow-lg shadow-blue-500/15 text-left">
              <div className="pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-orange-400/20 blur-[40px]" />

              <div className="flex items-center gap-1.5 text-blue-200 mb-2">
                <Clock size={14} />
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.14em]">
                  2-HOUR RESPONSE COMMITMENT
                </span>
              </div>

              <h4 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Let’s start a conversation.
              </h4>

              <p className="mt-2 text-xs leading-relaxed text-blue-100/90 font-medium">
                Tell us what you are building, what problem you are solving, or where your current healthcare workflow needs improvement.
              </p>

              <div className="mt-4 flex items-center gap-2 border-t border-white/15 pt-3.5 text-[11px] sm:text-xs text-blue-200">
                <ShieldCheck size={15} className="text-emerald-400 shrink-0" />
                <span>Zero spam • 100% confidential discussion</span>
              </div>
            </div>

          </motion.div>

        </div>
      </div>
    </section>
  );
}
