"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { DUR, EASE } from "@/lib/motion";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [shakeKey, setShakeKey] = useState(0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError("");
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;

    // honeypot — bots fill this
    if (data.website) {
      setStatus("success");
      return;
    }

    const payload = {
      name: data.name?.trim(),
      email: data.email?.trim(),
      company: data.company?.trim(),
      message: data.message?.trim(),
      consent: data.consent === "on",
      idempotency_key: crypto.randomUUID(),
    };

    if (!payload.consent) {
      setStatus("error");
      setError("Vui lòng đồng ý với điều khoản bảo mật trước khi gửi.");
      setShakeKey((k) => k + 1);
      return;
    }

    const response = await fetch("/api/v1/leads/consultation/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);

    if (!response?.ok) {
      const body = await response?.json().catch(() => null);
      const msg =
        body?.error?.message ??
        (body?.email?.[0] as string) ??
        (body?.message?.[0] as string) ??
        "API QTS hiện chưa khả dụng. Vui lòng thử lại sau ít phút.";
      setStatus("error");
      setError(msg);
      setShakeKey((k) => k + 1);
      return;
    }
    setStatus("success");
  }

  if (status === "success")
    return (
      <motion.div
        className="form-success"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: DUR.slow, ease: EASE }}
      >
        <svg className="success-check" viewBox="0 0 52 52" aria-hidden="true">
          <circle cx="26" cy="26" r="24" />
          <path d="M14 27l8 8 16-16" />
        </svg>
        <b>Đã tiếp nhận yêu cầu.</b>
        <br />
        QTS sẽ sử dụng thông tin bạn chia sẻ để chuẩn bị cho buổi trao đổi phù hợp với nhu cầu.
      </motion.div>
    );

  return (
    <form className="form contact-form" onSubmit={handleSubmit} key={shakeKey} noValidate>
      {/* honeypot — hidden from humans */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp-field" />
      <div className="form-pair">
        <div className="field-float">
          <input required name="email" type="email" id="cf-email" placeholder=" " />
          <label htmlFor="cf-email">Email công việc</label>
        </div>
        <div className="field-float">
          <input required name="name" type="text" id="cf-name" placeholder=" " />
          <label htmlFor="cf-name">Họ và tên</label>
        </div>
      </div>
      <div className="field-float">
        <input required name="company" type="text" id="cf-company" placeholder=" " />
        <label htmlFor="cf-company">Doanh nghiệp</label>
      </div>
      <div className="field-float">
        <textarea required name="message" rows={5} id="cf-message" placeholder=" " />
        <label htmlFor="cf-message">Bạn đang cần xây dựng điều gì?</label>
      </div>
      <label className="consent-row">
        <input type="checkbox" name="consent" required /> Tôi đồng ý cho QTS xử lý dữ liệu để phản hồi yêu cầu tư vấn này.
      </label>
      {status === "error" && <p className="form-error">{error}</p>}
      <button
        className={`btn btn-primary ${status === "sending" ? "btn-loading" : ""}`}
        disabled={status === "sending"}
        type="submit"
      >
        {status === "sending" ? "Đang gửi yêu cầu…" : "Yêu cầu tư vấn"}
        <ArrowRightIcon width={15} />
      </button>
    </form>
  );
}
