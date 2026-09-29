"use client";

import React, { useState, useEffect, useRef } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { broadcastLiveEvent } from "@/lib/live-channel";

interface EnquiryFormProps {
  businessSlug: string;
  businessName: string;
}

export default function EnquiryForm({ businessSlug, businessName }: EnquiryFormProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    serviceType: "",
    description: "",
    source: "",
    website: "",
  });

  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // Cloudflare Turnstile loader if site key is configured
  useEffect(() => {
    if (!turnstileSiteKey) return;

    // Window callback
    (window as unknown as { onTurnstileSuccess?: (token: string) => void }).onTurnstileSuccess = (token: string) => {
      setTurnstileToken(token);
    };

    const scriptId = "cf-turnstile-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, [turnstileSiteKey]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    // Client-side quick validation
    const errs: Record<string, string> = {};
    if (!formData.firstName.trim()) errs.firstName = "First name is required";
    if (!formData.lastName.trim()) errs.lastName = "Last name is required";
    if (!formData.phone.trim()) errs.phone = "Phone number is required";
    if (!formData.email.trim() || !formData.email.includes("@")) {
      errs.email = "A valid email address is required";
    }
    if (!formData.serviceType.trim()) errs.serviceType = "Service type is required";
    if (formData.description.trim().length < 10) {
      errs.description = "Please provide at least 10 characters describing the work";
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/enquiry/${businessSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          turnstileToken: turnstileToken || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 422 && data.fields) {
          const flat: Record<string, string> = {};
          for (const [k, v] of Object.entries(data.fields as Record<string, string[]>)) {
            if (v && v.length > 0) flat[k] = v[0];
          }
          setFieldErrors(flat);
        } else if (res.status === 429) {
          setFormError("Too many submissions from this connection. Please try again in an hour.");
        } else {
          setFormError(data.error || "Unable to send enquiry. Please check the form and try again.");
        }
        return;
      }

      setIsSuccess(true);
      broadcastLiveEvent("LEAD_CREATED", {
        customerName: `${formData.firstName} ${formData.lastName}`,
        serviceType: formData.serviceType,
      });
    } catch {
      setFormError("A network error occurred. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setFormData({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      serviceType: "",
      description: "",
      source: "",
      website: "",
    });
    setFieldErrors({});
    setFormError(null);
    setIsSuccess(false);
  }

  if (isSuccess) {
    return (
      <div className="text-center py-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">
          Thanks — we&apos;ll be in touch soon.
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto mb-6">
          Your enquiry has been received by <strong className="font-semibold text-[var(--color-text)]">{businessName}</strong>.
          We have sent a confirmation email to <span className="font-medium text-[var(--color-text)]">{formData.email}</span>.
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-[var(--color-primary)] bg-[var(--color-primary-subtle)] hover:bg-[#d6ece7] rounded-[var(--radius-md)] transition-colors"
        >
          Submit another enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Honeypot field for anti-bot protection */}
      <div style={{ display: "none" }} aria-hidden="true">
        <input
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={formData.website}
          onChange={handleChange}
        />
      </div>

      {formError && (
        <div className="flex items-start gap-3 p-3 text-sm bg-[var(--color-error-bg)] text-[var(--color-error)] rounded-[var(--radius-md)] border border-[#f8b4b4]">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      {/* Name row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
            First name *
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            value={formData.firstName}
            onChange={handleChange}
            placeholder="e.g. David"
            className={`w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors ${
              fieldErrors.firstName ? "border-[var(--color-error)]" : "border-[var(--color-border)]"
            }`}
          />
          {fieldErrors.firstName && (
            <p className="mt-1 text-xs text-[var(--color-error)]">{fieldErrors.firstName}</p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
            Last name *
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            value={formData.lastName}
            onChange={handleChange}
            placeholder="e.g. Chen"
            className={`w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors ${
              fieldErrors.lastName ? "border-[var(--color-error)]" : "border-[var(--color-border)]"
            }`}
          />
          {fieldErrors.lastName && (
            <p className="mt-1 text-xs text-[var(--color-error)]">{fieldErrors.lastName}</p>
          )}
        </div>
      </div>

      {/* Contact row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone" className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
            Phone number *
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            value={formData.phone}
            onChange={handleChange}
            placeholder="e.g. 07700 900123"
            className={`w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors ${
              fieldErrors.phone ? "border-[var(--color-error)]" : "border-[var(--color-border)]"
            }`}
          />
          {fieldErrors.phone && (
            <p className="mt-1 text-xs text-[var(--color-error)]">{fieldErrors.phone}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
            Email address *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="e.g. david@example.com"
            className={`w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors ${
              fieldErrors.email ? "border-[var(--color-error)]" : "border-[var(--color-border)]"
            }`}
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-[var(--color-error)]">{fieldErrors.email}</p>
          )}
        </div>
      </div>

      {/* Service type */}
      <div>
        <label htmlFor="serviceType" className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
          Service or Work Required *
        </label>
        <input
          id="serviceType"
          name="serviceType"
          type="text"
          required
          value={formData.serviceType}
          onChange={handleChange}
          placeholder="e.g. Boiler Replacement, Bathroom Fitting, Rewiring..."
          className={`w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors ${
            fieldErrors.serviceType ? "border-[var(--color-error)]" : "border-[var(--color-border)]"
          }`}
        />
        {fieldErrors.serviceType && (
          <p className="mt-1 text-xs text-[var(--color-error)]">{fieldErrors.serviceType}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
          Project details / description *
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          required
          value={formData.description}
          onChange={handleChange}
          placeholder="Please describe the job, location, and any timing requirements..."
          className={`w-full p-3 text-sm rounded-[var(--radius-md)] border bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors resize-y ${
            fieldErrors.description ? "border-[var(--color-error)]" : "border-[var(--color-border)]"
          }`}
        />
        {fieldErrors.description && (
          <p className="mt-1 text-xs text-[var(--color-error)]">{fieldErrors.description}</p>
        )}
        <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
          At least 10 characters.
        </p>
      </div>

      {/* How did you hear about us */}
      <div>
        <label htmlFor="source" className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
          How did you hear about us? <span className="font-normal text-[var(--color-text-muted)] lowercase">(optional)</span>
        </label>
        <select
          id="source"
          name="source"
          value={formData.source}
          onChange={handleChange}
          className="w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)]"
        >
          <option value="">Select an option</option>
          <option value="Recommendation / Word of Mouth">Recommendation / Word of Mouth</option>
          <option value="Google / Online Search">Google / Online Search</option>
          <option value="Social Media">Social Media</option>
          <option value="Van Signage / Local Advert">Van Signage / Local Advert</option>
          <option value="Existing Customer">Existing Customer</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Turnstile Container */}
      {turnstileSiteKey && (
        <div className="pt-2" ref={turnstileContainerRef}>
          <div
            className="cf-turnstile"
            data-sitekey={turnstileSiteKey}
            data-callback="onTurnstileSuccess"
          />
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] text-white text-sm font-semibold rounded-[var(--radius-md)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {isSubmitting ? "Sending enquiry..." : "Send enquiry"}
        </button>
      </div>
    </form>
  );
}
