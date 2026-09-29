"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CopyButton } from "@/app/(app)/leads/CopyButton";
import {
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building2,
  Globe2,
  ShieldCheck,
  Check,
  Loader2,
  Landmark,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Image as ImageIcon,
  MessageCircle,
} from "lucide-react";
import { SUPPORTED_COUNTRIES, SUPPORTED_CURRENCIES } from "@/lib/currency";

interface BusinessProfileFormProps {
  initialBusiness: {
    name: string;
    slug: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    logoUrl?: string | null;
    notificationPhone?: string | null;
    country?: string;
    currency?: string;
    paymentGateway?: string;
    paystackPublicKey?: string | null;
    hasPaystackSecret?: boolean;
    stripePublishableKey?: string | null;
    hasStripeSecret?: boolean;
    paymentsEnabled?: boolean;
    paymentDetails?: string | null;
    googleReviewUrl?: string | null;
    quoteFollowUpDelayDays?: number;
    reviewReminderDelayDays?: number;
    paystackSubaccountCode?: string | null;
    bankName?: string | null;
    bankCode?: string | null;
    bankAccountNumber?: string | null;
    bankAccountName?: string | null;
  };
}

export function BusinessProfileForm({ initialBusiness }: BusinessProfileFormProps) {
  const router = useRouter();

  // Basic Details
  const [name, setName] = useState(initialBusiness.name);
  const [email, setEmail] = useState(initialBusiness.email);
  const [phone, setPhone] = useState(initialBusiness.phone || "");
  const [address, setAddress] = useState(initialBusiness.address || "");
  const [logoUrl, setLogoUrl] = useState(initialBusiness.logoUrl || "");
  const [notificationPhone, setNotificationPhone] = useState(initialBusiness.notificationPhone || "");

  // Multi-Currency & Gateway
  const [country, setCountry] = useState(initialBusiness.country || "GB");
  const [currency, setCurrency] = useState(initialBusiness.currency || "GBP");
  const [paymentGateway, setPaymentGateway] = useState(initialBusiness.paymentGateway || "MANUAL");
  const [paymentsEnabled, setPaymentsEnabled] = useState(initialBusiness.paymentsEnabled ?? false);

  // Paystack Platform Subaccount & Direct Nigerian Bank Settlement
  const [paystackSubaccountCode, setPaystackSubaccountCode] = useState(initialBusiness.paystackSubaccountCode || "");
  const [subaccountBankCode, setSubaccountBankCode] = useState(initialBusiness.bankCode || "058");
  const [subaccountBankName, setSubaccountBankName] = useState(initialBusiness.bankName || "Guaranty Trust Bank");
  const [subaccountAccountNumber, setSubaccountAccountNumber] = useState(initialBusiness.bankAccountNumber || "");
  const [subaccountAccountName, setSubaccountAccountName] = useState(initialBusiness.bankAccountName || "");

  const [banksList, setBanksList] = useState<Array<{ name: string; code: string }>>([
    { name: "Guaranty Trust Bank", code: "058" },
    { name: "Zenith Bank", code: "057" },
    { name: "Access Bank", code: "044" },
    { name: "First Bank of Nigeria", code: "011" },
    { name: "United Bank For Africa", code: "033" },
    { name: "Kuda Bank", code: "50211" },
    { name: "Moniepoint MFB", code: "50515" },
    { name: "OPay Digital Services (Paycom)", code: "999992" },
    { name: "PalmPay", code: "999991" },
    { name: "Fidelity Bank", code: "070" },
    { name: "Stanbic IBTC Bank", code: "221" },
    { name: "Sterling Bank", code: "232" },
    { name: "Wema Bank", code: "035" },
  ]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [isResolvingAccount, setIsResolvingAccount] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [isActivatingSubaccount, setIsActivatingSubaccount] = useState(false);
  const [subaccountSuccessMsg, setSubaccountSuccessMsg] = useState<string | null>(null);
  const [showAdvancedPaystackKeys, setShowAdvancedPaystackKeys] = useState(false);
  const [showAdvancedStripeKeys, setShowAdvancedStripeKeys] = useState(false);

  // Paystack Custom Keys (BYOK Fallback)
  const [paystackPublicKey, setPaystackPublicKey] = useState(initialBusiness.paystackPublicKey || "");
  const [paystackSecretKey, setPaystackSecretKey] = useState("");
  const [hasPaystackSecret, setHasPaystackSecret] = useState(initialBusiness.hasPaystackSecret ?? false);

  // Stripe Keys
  const [stripePublishableKey, setStripePublishableKey] = useState(initialBusiness.stripePublishableKey || "");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [hasStripeSecret, setHasStripeSecret] = useState(initialBusiness.hasStripeSecret ?? false);

  // Testing connection state
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ gateway: string; valid: boolean; error?: string } | null>(null);

  // Structured Bank Details
  let initialBankDetails = {
    accountName: "",
    bankName: "",
    accountNumber: "",
    sortCode: "",
    routingNumber: "",
    iban: "",
    swiftBic: "",
    notes: "",
  };

  try {
    if (initialBusiness.paymentDetails && initialBusiness.paymentDetails.startsWith("{")) {
      initialBankDetails = { ...initialBankDetails, ...JSON.parse(initialBusiness.paymentDetails) };
    } else if (initialBusiness.paymentDetails) {
      initialBankDetails.notes = initialBusiness.paymentDetails;
    }
  } catch {
    initialBankDetails.notes = initialBusiness.paymentDetails || "";
  }

  const [bankDetails, setBankDetails] = useState(initialBankDetails);

  // Automation & Reviews
  const [googleReviewUrl, setGoogleReviewUrl] = useState(initialBusiness.googleReviewUrl || "");
  const [quoteFollowUpDelayDays, setQuoteFollowUpDelayDays] = useState(
    initialBusiness.quoteFollowUpDelayDays ?? 3
  );
  const [reviewReminderDelayDays, setReviewReminderDelayDays] = useState(
    initialBusiness.reviewReminderDelayDays ?? 4
  );

  // Form Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Slug rename state
  const [slugRenameOpen, setSlugRenameOpen] = useState(false);
  const [newSlug, setNewSlug] = useState(initialBusiness.slug);
  const [slugWarningAcknowledged, setSlugWarningAcknowledged] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [isRenamingSlug, setIsRenamingSlug] = useState(false);

  const currentSlug = initialBusiness.slug;

  // Country change handler with smart auto-recommendations
  function handleCountryChange(newCountryCode: string) {
    setCountry(newCountryCode);
    const countryConfig = SUPPORTED_COUNTRIES.find((c) => c.code === newCountryCode);
    if (countryConfig) {
      setCurrency(countryConfig.defaultCurrency);
      setPaymentGateway(countryConfig.defaultGateway);
      if (countryConfig.defaultGateway !== "MANUAL") {
        setPaymentsEnabled(true);
      }
    }
  }

  async function handleTestConnection(gateway: "PAYSTACK" | "STRIPE") {
    const keyToTest = gateway === "PAYSTACK" ? paystackSecretKey : stripeSecretKey;

    setIsTestingKey(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/business/payment-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gateway, secretKey: keyToTest || "PRESERVED" }),
      });
      const data = await res.json();
      setTestResult({ gateway, valid: data.valid, error: data.error });
    } catch {
      setTestResult({ gateway, valid: false, error: "Network connection failed" });
    } finally {
      setIsTestingKey(false);
    }
  }

  // Fetch supported Nigerian banks on demand
  useEffect(() => {
    if (country === "NG" || paymentGateway === "PAYSTACK") {
      setIsLoadingBanks(true);
      fetch("/api/banks/nigeria")
        .then((res) => res.json())
        .then((data) => {
          if (data.banks && Array.isArray(data.banks) && data.banks.length > 0) {
            setBanksList(data.banks);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoadingBanks(false));
    }
  }, [country, paymentGateway]);

  // Real-time NUBAN Account Name Verification
  async function handleResolveAccount(accountNum: string, bCode: string) {
    const cleanNum = accountNum.trim();
    if (cleanNum.length !== 10 || !bCode) return;

    setIsResolvingAccount(true);
    setResolveError(null);
    try {
      const res = await fetch("/api/banks/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountNumber: cleanNum, bankCode: bCode }),
      });
      const data = await res.json();
      if (res.ok && data.accountName) {
        setSubaccountAccountName(data.accountName);
        setResolveError(null);
      } else {
        setSubaccountAccountName("");
        setResolveError(data.error || "Could not verify bank account. Please check the number.");
      }
    } catch {
      setResolveError("Network error while resolving account details.");
    } finally {
      setIsResolvingAccount(false);
    }
  }

  // Create Subaccount under Master Account
  async function handleActivateDirectPayouts() {
    if (!subaccountAccountNumber || subaccountAccountNumber.trim().length !== 10) {
      setResolveError("Please enter a valid 10-digit NUBAN account number.");
      return;
    }
    if (!subaccountBankCode) {
      setResolveError("Please select your bank.");
      return;
    }
    setIsActivatingSubaccount(true);
    setResolveError(null);
    setSubaccountSuccessMsg(null);

    try {
      const res = await fetch("/api/business/subaccount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankCode: subaccountBankCode,
          bankName: subaccountBankName,
          accountNumber: subaccountAccountNumber.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResolveError(data.error || "Failed to link bank account with Paystack.");
        return;
      }

      setPaystackSubaccountCode(data.subaccountCode);
      setSubaccountAccountName(data.accountName);
      setPaymentGateway("PAYSTACK");
      setPaymentsEnabled(true);
      setCountry("NG");
      setCurrency("NGN");

      // Update manual bank details fallback
      setBankDetails((prev) => ({
        ...prev,
        accountName: data.accountName,
        bankName: subaccountBankName,
        accountNumber: subaccountAccountNumber.trim(),
      }));

      setSubaccountSuccessMsg(
        `Bank linked successfully! Instant direct payouts are now active (${data.subaccountCode}).`
      );
      router.refresh();
      setTimeout(() => setSubaccountSuccessMsg(null), 6000);
    } catch {
      setResolveError("Network error occurred while linking bank account.");
    } finally {
      setIsActivatingSubaccount(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    // Format bank details as JSON
    const paymentDetailsJson = JSON.stringify(bankDetails);

    try {
      const payload: Record<string, unknown> = {
        name,
        email,
        phone: phone.trim() || null,
        address: address.trim() || null,
        country,
        currency,
        paymentGateway,
        paymentsEnabled,
        paystackPublicKey: paystackPublicKey.trim() || null,
        stripePublishableKey: stripePublishableKey.trim() || null,
        paymentDetails: paymentDetailsJson,
        googleReviewUrl: googleReviewUrl.trim() || null,
        quoteFollowUpDelayDays: Number(quoteFollowUpDelayDays),
        reviewReminderDelayDays: Number(reviewReminderDelayDays),
        logoUrl: logoUrl.trim() || null,
        notificationPhone: notificationPhone.trim() || null,
      };

      if (paystackSecretKey) payload.paystackSecretKey = paystackSecretKey.trim();
      if (stripeSecretKey) payload.stripeSecretKey = stripeSecretKey.trim();

      const res = await fetch("/api/business/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        const fieldError = data.fields?.googleReviewUrl?.[0] || data.fields?.email?.[0];
        setErrorMsg(fieldError || data.error || "Failed to update business profile.");
        return;
      }

      setSuccessMsg("Business profile & payment settings updated successfully.");
      if (paystackSecretKey) setHasPaystackSecret(true);
      if (stripeSecretKey) setHasStripeSecret(true);
      setPaystackSecretKey("");
      setStripeSecretKey("");

      router.refresh();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch {
      setErrorMsg("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSlugRename() {
    setSlugError(null);
    const trimmed = newSlug.trim().toLowerCase().replace(/\s+/g, "-");
    if (!trimmed) { setSlugError("Slug cannot be empty."); return; }
    if (!/^[a-z0-9-]+$/.test(trimmed)) { setSlugError("Only lowercase letters, numbers, and hyphens allowed."); return; }
    if (trimmed === currentSlug) { setSlugRenameOpen(false); return; }

    setIsRenamingSlug(true);
    try {
      const res = await fetch("/api/business/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email,
          slug: trimmed,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSlugError(data.fields?.slug?.[0] || data.error || "Failed to rename slug.");
        return;
      }
      setSlugRenameOpen(false);
      setSlugWarningAcknowledged(false);
      setSuccessMsg("Slug updated. Your old links will no longer work.");
      router.refresh();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch {
      setSlugError("A network error occurred. Please try again.");
    } finally {
      setIsRenamingSlug(false);
    }
  }

  const enquiryPath = `/enquiry/${initialBusiness.slug}`;
  const [origin, setOrigin] = useState("https://flowvo.app");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const fullEnquiryUrl = `${origin}${enquiryPath}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {successMsg && (
        <div className="flex items-center gap-2 p-3 text-xs bg-[var(--color-success-bg)] text-[var(--color-primary)] rounded-[var(--radius-md)] border border-[#c1e6de]">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-xs bg-[var(--color-error-bg)] text-[var(--color-error)] rounded-[var(--radius-md)] border border-[#f8b4b4]">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Section 1: Business Identity ─────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[var(--color-text)] flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
          <Building2 className="w-4 h-4 text-[var(--color-primary)]" />
          Business Identity &amp; Contact
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="bizName" className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
              Business name *
            </label>
            <input
              id="bizName"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
            />
          </div>

          <div>
            <label htmlFor="bizEmail" className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
              Business email *
            </label>
            <input
              id="bizEmail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="bizPhone" className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
              Business Phone <span className="font-normal text-[var(--color-text-muted)] lowercase">(shown on invoices)</span>
            </label>
            <input
              id="bizPhone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +234 801 234 5678 or 07700 900123"
              className="w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
            />
          </div>

          <div>
            <label htmlFor="bizAddress" className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
              Business Address <span className="font-normal text-[var(--color-text-muted)] lowercase">(shown on invoices)</span>
            </label>
            <input
              id="bizAddress"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 14 Commercial Way, Ikeja, Lagos"
              className="w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
            />
          </div>
        </div>

        {/* Business Logo & Owner WhatsApp Alerts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Business Logo */}
          <div>
            <label htmlFor="bizLogo" className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
              Business Logo URL <span className="font-normal text-[var(--color-text-muted)] lowercase">(shown on quotes &amp; invoices)</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] flex items-center justify-center shrink-0 overflow-hidden">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="w-full h-full object-contain p-0.5"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <ImageIcon className="w-5 h-5 text-[var(--color-text-muted)]" />
                )}
              </div>
              <input
                id="bizLogo"
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://.../logo.png"
                className="flex-1 h-10 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
              />
            </div>
            <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
              Direct image link (.png, .jpg, or .svg). Displayed at the top of customer quotes and payment invoices.
            </p>
          </div>

          {/* Owner WhatsApp Notification Phone */}
          <div>
            <label htmlFor="bizNotificationPhone" className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              Owner WhatsApp Alert Number <span className="font-normal text-[var(--color-text-muted)] lowercase">(private to you)</span>
            </label>
            <input
              id="bizNotificationPhone"
              type="tel"
              value={notificationPhone}
              onChange={(e) => setNotificationPhone(e.target.value)}
              placeholder="e.g. +234 801 234 5678 or 08012345678"
              className="w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
            />
            <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
              🔔 Instant notifications: Leads, quote approvals, and invoice payments trigger instant alerts directly to this WhatsApp number so you don&apos;t have to stay 24/7 on the app.
            </p>
          </div>
        </div>
      </div>

      {/* ── Section 2: Country, Currency & Customer Payout Collection ───────── */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text)] flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
            <Globe2 className="w-4 h-4 text-[var(--color-primary)]" />
            Country, Currency &amp; Customer Payment Collection
          </h3>
          <p className="mt-1.5 text-xs text-[var(--color-text-secondary)]">
            Configure how your customers pay on their public invoice view (cards, bank transfer, USSD), and where those payments settle into your business account.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="bizCountry" className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
              Primary Business Country
            </label>
            <select
              id="bizCountry"
              value={country}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
            >
              {SUPPORTED_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
              Selecting a country automatically recommends the standard currency and best payment gateway.
            </p>
          </div>

          <div>
            <label htmlFor="bizCurrency" className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
              Default Billing Currency
            </label>
            <select
              id="bizCurrency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
            >
              {Object.values(SUPPORTED_CURRENCIES).map((cur) => (
                <option key={cur.code} value={cur.code}>
                  {cur.flag} {cur.code} ({cur.symbol}) — {cur.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
              All quotes, invoices, and totals will be formatted in this currency.
            </p>
          </div>
        </div>

        {/* Payment Gateway Options */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
            Payment Processing Gateway
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Paystack Card */}
            <div
              onClick={() => { setPaymentGateway("PAYSTACK"); setPaymentsEnabled(true); }}
              className={`p-3.5 rounded-[var(--radius-md)] border cursor-pointer transition-all ${
                paymentGateway === "PAYSTACK"
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)] ring-1 ring-[var(--color-primary)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-[var(--color-text)] flex items-center gap-1.5">
                  🇳🇬 Paystack
                </span>
                {paymentGateway === "PAYSTACK" && <Check className="w-4 h-4 text-[var(--color-primary)]" />}
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Cards, Instant Bank Transfer, USSD &amp; Mobile Money. Ideal for Nigeria &amp; Africa.
              </p>
            </div>

            {/* Stripe Card */}
            <div
              onClick={() => { setPaymentGateway("STRIPE"); setPaymentsEnabled(true); }}
              className={`p-3.5 rounded-[var(--radius-md)] border cursor-pointer transition-all ${
                paymentGateway === "STRIPE"
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)] ring-1 ring-[var(--color-primary)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-[var(--color-text)] flex items-center gap-1.5">
                  🌍 Stripe
                </span>
                {paymentGateway === "STRIPE" && <Check className="w-4 h-4 text-[var(--color-primary)]" />}
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Cards, Apple Pay, Google Pay, SEPA, BACS. Ideal for UK, Europe &amp; Global.
              </p>
            </div>

            {/* Manual Bank Only */}
            <div
              onClick={() => { setPaymentGateway("MANUAL"); setPaymentsEnabled(false); }}
              className={`p-3.5 rounded-[var(--radius-md)] border cursor-pointer transition-all ${
                paymentGateway === "MANUAL"
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)] ring-1 ring-[var(--color-primary)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-[var(--color-text)] flex items-center gap-1.5">
                  🏦 Manual Bank Only
                </span>
                {paymentGateway === "MANUAL" && <Check className="w-4 h-4 text-[var(--color-primary)]" />}
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Direct manual bank transfer only. You manually verify payments.
              </p>
            </div>
          </div>
        </div>

        {/* Paystack Panel: Direct Settlement Subaccount + Advanced BYOK */}
        {paymentGateway === "PAYSTACK" && (
          <div className="space-y-4">
            {/* Primary: Direct Nigerian Bank Account Settlement */}
            <div className="p-4 sm:p-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--color-border)] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
                      <Landmark className="w-4 h-4" />
                    </span>
                    <h4 className="text-sm font-semibold text-[var(--color-text)]">
                      Direct Nigerian Bank Payouts
                    </h4>
                    <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Zero-Setup
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    Connect your Nigerian bank account once. All invoice payments (Card, Bank Transfer, USSD) automatically settle straight into your account.
                  </p>
                </div>
              </div>

              {/* Active Subaccount Badge */}
              {paystackSubaccountCode && (
                <div className="p-3.5 rounded-[var(--radius-md)] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                        Instant Payouts Active
                      </span>
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                        {paystackSubaccountCode}
                      </span>
                    </div>
                    <p className="text-emerald-800 dark:text-emerald-300">
                      Settling to: <strong>{subaccountAccountName || "Registered Account"}</strong> — {subaccountBankName} (•••• {subaccountAccountNumber?.slice(-4) || "••••"})
                    </p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      100% of customer invoice payments are automatically routed to your bank account via Paystack split settlement.
                    </p>
                  </div>
                </div>
              )}

              {/* Subaccount Activation / Edit Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
                    Select Settlement Bank
                  </label>
                  <select
                    value={subaccountBankCode}
                    onChange={(e) => {
                      const selectedCode = e.target.value;
                      const bankObj = banksList.find((b) => b.code === selectedCode);
                      setSubaccountBankCode(selectedCode);
                      if (bankObj) {
                        setSubaccountBankName(bankObj.name);
                      }
                      if (subaccountAccountNumber.length === 10) {
                        handleResolveAccount(subaccountAccountNumber, selectedCode);
                      }
                    }}
                    className="w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                  >
                    {banksList.map((b) => (
                      <option key={`${b.code}-${b.name}`} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
                    10-Digit NUBAN Account Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={10}
                      value={subaccountAccountNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setSubaccountAccountNumber(val);
                        if (val.length === 10) {
                          handleResolveAccount(val, subaccountBankCode);
                        } else {
                          setSubaccountAccountName("");
                          setResolveError(null);
                        }
                      }}
                      placeholder="e.g. 0123456789"
                      className="w-full h-10 px-3 text-sm font-mono rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors pr-9"
                    />
                    {isResolvingAccount && (
                      <div className="absolute right-2.5 top-2.5">
                        <Loader2 className="w-5 h-5 text-[var(--color-primary)] animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Real-time Account Verification Status */}
              {subaccountAccountName && (
                <div className="flex items-center gap-2 p-2.5 rounded-[var(--radius-md)] bg-[var(--color-success-bg)] text-[var(--color-primary)] border border-[#c1e6de] text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    Verified Account Holder: <strong>{subaccountAccountName}</strong>
                  </span>
                </div>
              )}

              {resolveError && (
                <div className="flex items-center gap-2 p-2.5 rounded-[var(--radius-md)] bg-[var(--color-error-bg)] text-[var(--color-error)] border border-[#f8b4b4] text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{resolveError}</span>
                </div>
              )}

              {subaccountSuccessMsg && (
                <div className="flex items-center gap-2 p-2.5 rounded-[var(--radius-md)] bg-[var(--color-success-bg)] text-[var(--color-primary)] border border-[#c1e6de] text-xs">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>{subaccountSuccessMsg}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  Secured via Paystack API. Settlement is handled directly by licensed Nigerian clearing banks.
                </span>
                <button
                  type="button"
                  onClick={handleActivateDirectPayouts}
                  disabled={isActivatingSubaccount || isResolvingAccount || subaccountAccountNumber.length !== 10}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors shadow-sm whitespace-nowrap"
                >
                  {isActivatingSubaccount ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Connecting with Paystack...
                    </>
                  ) : paystackSubaccountCode ? (
                    "Update Bank Account"
                  ) : (
                    "Connect Bank & Activate Instant Payouts"
                  )}
                </button>
              </div>
            </div>

            {/* Secondary: Collapsible Advanced Developer API Keys (BYOK) */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvancedPaystackKeys((v) => !v)}
                className="w-full p-3.5 flex items-center justify-between text-left text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[var(--color-primary)]" />
                  Advanced: Custom Paystack Developer API Keys (BYOK)
                </span>
                {showAdvancedPaystackKeys ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showAdvancedPaystackKeys && (
                <div className="p-4 border-t border-[var(--color-border)] space-y-3 bg-[var(--color-surface)]">
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    Optional: If you already have your own registered Paystack developer account and wish to use your own direct API keys rather than the platform automated payouts, enter them below.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                        Public Key (pk_test_... or pk_live_...)
                      </label>
                      <input
                        type="text"
                        value={paystackPublicKey}
                        onChange={(e) => setPaystackPublicKey(e.target.value)}
                        placeholder="pk_test_xxxxxxxxxxxxxxxx"
                        className="w-full h-9 px-3 text-xs font-mono rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                        Secret Key (sk_test_... or sk_live_...)
                      </label>
                      <input
                        type="password"
                        value={paystackSecretKey}
                        onChange={(e) => setPaystackSecretKey(e.target.value)}
                        placeholder={hasPaystackSecret ? "•••••••••••• (configured — leave blank to keep)" : "sk_test_xxxxxxxxxxxxxxxx"}
                        className="w-full h-9 px-3 text-xs font-mono rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => handleTestConnection("PAYSTACK")}
                      disabled={isTestingKey}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] transition-colors"
                    >
                      {isTestingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                      Test Custom Keys
                    </button>

                    {testResult?.gateway === "PAYSTACK" && (
                      <span className={`text-xs flex items-center gap-1 ${testResult.valid ? "text-[var(--color-primary)] font-medium" : "text-[var(--color-error)]"}`}>
                        {testResult.valid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        {testResult.valid ? "Connection verified!" : (testResult.error || "Failed")}
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[var(--color-border)] text-[11px] text-[var(--color-text-muted)] flex items-center justify-between">
                    <span suppressHydrationWarning>Webhook URL for Paystack Dashboard: <code suppressHydrationWarning className="font-mono text-[var(--color-text)]">{origin}/api/webhooks/paystack</code></span>
                    <CopyButton text={`${origin}/api/webhooks/paystack`} label="Copy" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stripe Panel: Zero-Setup Platform Rail + Advanced BYOK */}
        {paymentGateway === "STRIPE" && (
          <div className="space-y-4">
            {/* Primary: Zero-Setup Flowvo Global Payments */}
            <div className="p-4 sm:p-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
                  <CreditCard className="w-4 h-4" />
                </span>
                <h4 className="text-sm font-semibold text-[var(--color-text)]">
                  Flowvo Global Payments (Stripe)
                </h4>
                <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Ready to accept payments
                </span>
              </div>

              <div className="p-3.5 rounded-[var(--radius-md)] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                    Instant Global Online Payments Active
                  </span>
                  <p className="text-emerald-800 dark:text-emerald-300">
                    Your invoices automatically accept Debit/Credit Cards, Apple Pay, Google Pay, and international bank transfers. No developer registration required.
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Client payments are securely processed and deposited directly into your settlement bank account below.
                  </p>
                </div>
              </div>

              {/* Live Test Connection & Details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="text-[11px] text-[var(--color-text-muted)] space-y-0.5">
                  <p className="flex items-center gap-1.5 font-medium text-[var(--color-text)]">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    Accepts Cards, Apple Pay, Google Pay &amp; Bank Transfer
                  </p>
                  <p>Test Card: <code className="font-mono text-[var(--color-text)]">4242 4242 4242 4242</code> (Any future date &amp; 3-digit CVC)</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleTestConnection("STRIPE")}
                  disabled={isTestingKey}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors shadow-sm whitespace-nowrap"
                >
                  {isTestingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                  Test Live Stripe Connection
                </button>
              </div>

              {testResult?.gateway === "STRIPE" && (
                <div className={`p-3 rounded-[var(--radius-md)] text-xs flex items-center gap-2 border ${
                  testResult.valid
                    ? "bg-[var(--color-success-bg)] text-[var(--color-primary)] border-[#c1e6de]"
                    : "bg-[var(--color-error-bg)] text-[var(--color-error)] border-[#f8b4b4]"
                }`}>
                  {testResult.valid ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>
                    {testResult.valid
                      ? "Stripe Platform Connection Verified & Live! All invoice send operations will generate active Stripe checkout links."
                      : (testResult.error || "Connection test failed")}
                  </span>
                </div>
              )}
            </div>

            {/* Secondary: Collapsible Advanced Developer API Keys (BYOK) */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvancedStripeKeys((v) => !v)}
                className="w-full p-3.5 flex items-center justify-between text-left text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[var(--color-primary)]" />
                  Advanced: Custom Stripe Developer API Keys (BYOK)
                </span>
                {showAdvancedStripeKeys ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showAdvancedStripeKeys && (
                <div className="p-4 border-t border-[var(--color-border)] space-y-3 bg-[var(--color-surface)]">
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    Optional: If you already have your own registered Stripe developer account and wish to use your own direct API keys rather than the platform automated rail, enter them below.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                        Publishable Key (pk_test_... or pk_live_...)
                      </label>
                      <input
                        type="text"
                        value={stripePublishableKey}
                        onChange={(e) => setStripePublishableKey(e.target.value)}
                        placeholder="pk_test_xxxxxxxxxxxxxxxx"
                        className="w-full h-9 px-3 text-xs font-mono rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                        Secret Key (sk_test_... or sk_live_...)
                      </label>
                      <input
                        type="password"
                        value={stripeSecretKey}
                        onChange={(e) => setStripeSecretKey(e.target.value)}
                        placeholder={hasStripeSecret ? "•••••••••••• (configured — leave blank to keep)" : "sk_test_xxxxxxxxxxxxxxxx"}
                        className="w-full h-9 px-3 text-xs font-mono rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => handleTestConnection("STRIPE")}
                      disabled={isTestingKey}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] transition-colors"
                    >
                      {isTestingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                      Test Custom Keys
                    </button>

                    {testResult?.gateway === "STRIPE" && (
                      <span className={`text-xs flex items-center gap-1 ${testResult.valid ? "text-[var(--color-primary)] font-medium" : "text-[var(--color-error)]"}`}>
                        {testResult.valid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        {testResult.valid ? "Connection verified!" : (testResult.error || "Failed")}
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[var(--color-border)] text-[11px] text-[var(--color-text-muted)] flex items-center justify-between">
                    <span suppressHydrationWarning>Webhook URL for Stripe Dashboard: <code suppressHydrationWarning className="font-mono text-[var(--color-text)]">{origin}/api/webhooks/stripe</code></span>
                    <CopyButton text={`${origin}/api/webhooks/stripe`} label="Copy" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Section 3: Structured Bank Details (Manual Fallback) ──────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[var(--color-text)] flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
          <CreditCard className="w-4 h-4 text-[var(--color-primary)]" />
          Bank Transfer Instructions <span className="font-normal text-xs text-[var(--color-text-muted)]">(Appears on invoices)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
              Account Holder Name
            </label>
            <input
              type="text"
              value={bankDetails.accountName}
              onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
              placeholder="e.g. Apex Electrical Ltd"
              className="w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
            />
          </div>

          {country === "NG" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
                  Bank Name (Nigeria)
                </label>
                <input
                  type="text"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                  placeholder="e.g. GTBank, Zenith, Access, Kuda, Moniepoint"
                  className="w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
                  NUBAN Account Number (10 digits)
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                  placeholder="e.g. 0123456789"
                  className="w-full h-10 px-3 text-sm font-mono rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                />
              </div>
            </>
          )}

          {country === "GB" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
                  Sort Code (XX-XX-XX)
                </label>
                <input
                  type="text"
                  maxLength={8}
                  value={bankDetails.sortCode}
                  onChange={(e) => setBankDetails({ ...bankDetails, sortCode: e.target.value })}
                  placeholder="20-00-00"
                  className="w-full h-10 px-3 text-sm font-mono rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
                  Account Number (8 digits)
                </label>
                <input
                  type="text"
                  maxLength={8}
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                  placeholder="12345678"
                  className="w-full h-10 px-3 text-sm font-mono rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                />
              </div>
            </>
          )}

          {(country === "IE" || country === "DE" || country === "FR") && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
                  IBAN
                </label>
                <input
                  type="text"
                  value={bankDetails.iban}
                  onChange={(e) => setBankDetails({ ...bankDetails, iban: e.target.value })}
                  placeholder="DE89 3704 0044 0532 0130 00"
                  className="w-full h-10 px-3 text-sm font-mono rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
                  BIC / SWIFT
                </label>
                <input
                  type="text"
                  value={bankDetails.swiftBic}
                  onChange={(e) => setBankDetails({ ...bankDetails, swiftBic: e.target.value })}
                  placeholder="DEUTDEDDXXX"
                  className="w-full h-10 px-3 text-sm font-mono rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                />
              </div>
            </>
          )}

          {(country === "US" || country === "CA") && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
                  Routing Number (9 digits)
                </label>
                <input
                  type="text"
                  maxLength={9}
                  value={bankDetails.routingNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, routingNumber: e.target.value })}
                  placeholder="123456789"
                  className="w-full h-10 px-3 text-sm font-mono rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                  placeholder="987654321"
                  className="w-full h-10 px-3 text-sm font-mono rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                />
              </div>
            </>
          )}

          {country !== "NG" && country !== "GB" && country !== "IE" && country !== "DE" && country !== "FR" && country !== "US" && country !== "CA" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
                  Bank Name &amp; SWIFT
                </label>
                <input
                  type="text"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                  placeholder="e.g. Standard Bank / SBICZAJJ"
                  className="w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
                  Account Number / IBAN
                </label>
                <input
                  type="text"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                  placeholder="Account Number"
                  className="w-full h-10 px-3 text-sm font-mono rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                />
              </div>
            </>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
            Additional Payment Notes / Reference Guidance
          </label>
          <textarea
            rows={2}
            value={bankDetails.notes}
            onChange={(e) => setBankDetails({ ...bankDetails, notes: e.target.value })}
            placeholder="e.g. Please use your invoice number as the payment reference."
            className="w-full p-2.5 text-xs rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors resize-y"
          />
        </div>
      </div>

      {/* ── Section 4: Automation & Reviews ──────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[var(--color-text)] flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
          Automation &amp; Google Reviews
        </h3>

        <div>
          <label htmlFor="googleReviewUrl" className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
            Google Review Link
          </label>
          <input
            id="googleReviewUrl"
            type="url"
            value={googleReviewUrl}
            onChange={(e) => setGoogleReviewUrl(e.target.value)}
            placeholder="https://g.page/r/... or https://maps.app.goo.gl/..."
            className="w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
          />
          <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
            Used to request 5-star reviews on Google automatically as soon as an invoice is paid.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="quoteDelay" className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
              Quote Follow-Up Delay (Days)
            </label>
            <input
              id="quoteDelay"
              type="number"
              min={1}
              max={7}
              value={quoteFollowUpDelayDays}
              onChange={(e) => setQuoteFollowUpDelayDays(Number(e.target.value))}
              className="w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
            />
          </div>

          <div>
            <label htmlFor="reviewDelay" className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
              Review Reminder Delay (Days)
            </label>
            <input
              id="reviewDelay"
              type="number"
              min={1}
              max={7}
              value={reviewReminderDelayDays}
              onChange={(e) => setReviewReminderDelayDays(Number(e.target.value))}
              className="w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* ── Section 5: Business Slug & Public Link ───────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[var(--color-text)] flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
          Public Link &amp; Slug
        </h3>

        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
            Business slug
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={currentSlug}
              className="w-full h-10 px-3 text-xs font-mono rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => { setSlugRenameOpen((v) => !v); setSlugWarningAcknowledged(false); setNewSlug(currentSlug); setSlugError(null); }}
              className="shrink-0 px-3 py-2 text-xs font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text-secondary)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)] transition-colors whitespace-nowrap"
            >
              {slugRenameOpen ? "Cancel" : "Change slug"}
            </button>
          </div>

          {/* Slug rename modal/panel */}
          {slugRenameOpen && (
            <div className="mt-3 p-4 rounded-[var(--radius-md)] border border-[#edd7a6] bg-[var(--color-status-action)] text-[var(--color-text)] space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#8C5A00] flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-[#8C5A00]">Warning: Changing your slug breaks existing links</p>
                  <p className="text-[var(--color-text-secondary)]">
                    Any customers who have your current link (<strong>{enquiryPath}</strong>) will no longer be able to reach your enquiry form.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                  New slug
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[var(--color-text-muted)] font-mono">/enquiry/</span>
                  <input
                    type="text"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="my-business-name"
                    className="flex-1 h-8 px-2.5 text-xs font-mono rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)]"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 cursor-pointer select-none text-xs text-[var(--color-text-secondary)]">
                <input
                  type="checkbox"
                  checked={slugWarningAcknowledged}
                  onChange={(e) => setSlugWarningAcknowledged(e.target.checked)}
                  className="mt-0.5 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-0"
                />
                <span>I understand that existing links will break and I will need to share the new URL.</span>
              </label>

              {slugError && (
                <p className="text-xs text-[var(--color-error)]">{slugError}</p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSlugRename}
                  disabled={!slugWarningAcknowledged || isRenamingSlug || newSlug === currentSlug}
                  className="px-3 py-1.5 text-xs font-medium rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRenamingSlug ? "Saving..." : "Confirm & update slug"}
                </button>
                <button
                  type="button"
                  onClick={() => setSlugRenameOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text-secondary)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Public Enquiry Form Link */}
        <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
              Public Customer Enquiry URL
            </span>
            <a
              href={enquiryPath}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--color-primary)] hover:underline inline-flex items-center gap-1 font-medium"
            >
              Open form <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex items-center gap-2">
            <span suppressHydrationWarning className="text-xs font-mono text-[var(--color-text)] truncate flex-1 select-all">
              {fullEnquiryUrl}
            </span>
            <CopyButton text={fullEnquiryUrl} label="Copy link" />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-2 border-t border-[var(--color-border)] flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 text-sm font-medium rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors shadow-sm"
        >
          {isSubmitting ? "Saving changes..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
