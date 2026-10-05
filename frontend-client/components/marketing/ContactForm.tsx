"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { DUR, EASE } from "@/lib/motion";

const POW_PREFIX = "000";

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function solvePow(seed: string): Promise<string> {
  const batchSize = 96;
  for (let nonce = 0; nonce < 1_000_000; nonce += batchSize) {
    const tokens = Array.from({ length: batchSize }, (_, index) => String(nonce + index));
    const hashes = await Promise.all(tokens.map((token) => sha256Hex(`${seed}:${token}`)));
    const found = hashes.findIndex((hash) => hash.startsWith(POW_PREFIX));
    if (found >= 0) return tokens[found];
  }
  throw new Error("pow");
}

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const reducedMotion = useReducedMotion();
  const pending = useRef(false);
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "success") successRef.current?.focus();
    if (status === "error") errorRef.current?.focus();
  }, [status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setStatus("sending");
    setError("");
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;

    // honeypot - bots fill this
    if (data.website) {
      setStatus("success");
      pending.current = false;
      return;
    }

    const signature = JSON.stringify(data);
    if (attempt.current?.signature !== signature) attempt.current = { signature, key: crypto.randomUUID() };
    const payload = {
      name: data.name?.trim(),
      email: data.email?.trim(),
      company: data.company?.trim(),
      message: data.message?.trim(),
      consent: data.consent === "on",
      idempotency_key: attempt.current.key,
    };

    if (!payload.consent) {
      setStatus("error");
      setError("Vui lòng đồng ý với điều khoản bảo mật trước khi gửi.");
      pending.current = false;
      return;
    }

    let pow: string;
    try {
      pow = await solvePow(payload.idempotency_key);
    } catch {
      setStatus("error");
      setError("Không thể xác thực yêu cầu. Vui lòng thử lại.");
      pending.current = false;
      return;
    }

    const response = await fetch("/api/v1/leads/consultation/", {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: { "Content-Type": "application/json", "X-PoW": pow },
      body: JSON.stringify({ ...payload, pow }),
    }).catch(() => null);

    if (!response?.ok) {
      const body = await response?.json().catch(() => null);
      const msg =
        body?.error?.message ??
        (body?.email?.[0] as string) ??
        (body?.message?.[0] as string) ??
        (response?.status === 429 ? "Bạn đã gửi nhiều yêu cầu. Vui lòng đợi ít phút rồi thử lại." : "Chưa gửi được yêu cầu. Nội dung đã được giữ lại; vui lòng thử lại.");
      setStatus("error");
      setError(msg);
      pending.current = false;
      return;
    }
    pending.current = false;
    setStatus("success");
  }

  if (status === "success")
    return (
      <motion.div
        className="form-success" role="status" aria-live="polite" ref={successRef} tabIndex={-1}
        initial={reducedMotion ? false : { opacity: 0, scale: 0.98 }}
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
    <form className="form contact-form" onSubmit={handleSubmit} aria-busy={status === "sending"}>
      {/* honeypot - hidden from humans */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp-field" />
      <div className="form-pair">
        <div className="field-float">
          <input required name="email" type="email" id="cf-email" autoComplete="email" maxLength={254} placeholder=" " />
          <label htmlFor="cf-email">Email công việc</label>
        </div>
        <div className="field-float">
          <input required name="name" type="text" id="cf-name" autoComplete="name" maxLength={120} placeholder=" " />
          <label htmlFor="cf-name">Họ và tên</label>
        </div>
      </div>
      <div className="field-float">
        <input required name="company" type="text" id="cf-company" autoComplete="organization" maxLength={160} placeholder=" " />
        <label htmlFor="cf-company">Doanh nghiệp</label>
      </div>
      <div className="field-float">
        <textarea required name="message" rows={5} id="cf-message" minLength={10} maxLength={2000} placeholder=" " />
        <label htmlFor="cf-message">Bạn đang cần xây dựng điều gì?</label>
      </div>
      <label className="consent-row">
        <input type="checkbox" name="consent" required /> Tôi đồng ý cho QTS xử lý dữ liệu để phản hồi yêu cầu tư vấn này.
      </label>
      {status === "sending" && <p className="form-status animate__animated animate__fadeIn animate__faster" role="status" aria-live="polite">Đang kiểm tra an toàn và gửi thông tin của bạn…</p>}
      {status === "error" && <p className="form-error animate__animated animate__fadeIn animate__faster" ref={errorRef} role="alert" tabIndex={-1}>{error}</p>}
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
