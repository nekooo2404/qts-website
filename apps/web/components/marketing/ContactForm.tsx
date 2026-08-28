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
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/leads/consultation/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries())),
    }).catch(() => null);

    if (!response?.ok) {
      setStatus("error");
      setError("The QTS API is unavailable right now. Please try again shortly.");
      setShakeKey((k) => k + 1);
      return;
    }
    setStatus("success");
  }

  if (status === "success") return (
    <motion.div className="form-success" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: DUR.slow, ease: EASE }}>
      <svg className="success-check" viewBox="0 0 52 52" aria-hidden="true">
        <circle cx="26" cy="26" r="24" />
        <path d="M14 27l8 8 16-16" />
      </svg>
      <b>Request received.</b><br/>Your QTS consultation is in motion. We will use the details you shared to make the conversation useful from the first minute.
    </motion.div>
  );

  return <form className="form contact-form" onSubmit={handleSubmit} key={shakeKey}>
    <div className="form-pair">
      <div className="field-float"><input required name="email" type="email" id="cf-email" placeholder=" "/><label htmlFor="cf-email">Work email</label></div>
      <div className="field-float"><input required name="name" type="text" id="cf-name" placeholder=" "/><label htmlFor="cf-name">Full name</label></div>
    </div>
    <div className="field-float"><input required name="company" type="text" id="cf-company" placeholder=" "/><label htmlFor="cf-company">Company</label></div>
    <div className="field-float"><textarea required name="message" rows={5} id="cf-message" placeholder=" "/><label htmlFor="cf-message">What are you building?</label></div>
    {status === "error" && <p className="form-error">{error}</p>}
    <button className={`btn btn-primary ${status === "sending" ? "btn-loading" : ""}`} disabled={status === "sending"} type="submit">{status === "sending" ? "Sending request…" : "Request consultation"}<ArrowRightIcon width={15}/></button>
  </form>;
}
