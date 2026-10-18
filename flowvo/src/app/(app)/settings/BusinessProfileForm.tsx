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
  RefreshCw,
  UploadCloud,
  Trash2,
} from "lucide-react";
import { SUPPORTED_COUNTRIES, SUPPORTED_CURRENCIES } from "@/lib/currency";
import { cleanNotesText } from "@/lib/bank-details";

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

  // Direct Logo File Upload states & processor
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [logoUploadSuccess, setLogoUploadSuccess] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const processLogoFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLogoUploadError("Please select a valid image file (PNG, JPG, SVG, or WebP).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setLogoUploadError("File size is too large. Please select an image under 8MB.");
      return;
    }

    setLogoUploading(true);
    setLogoUploadError(null);
    setLogoUploadSuccess(null);

    // If SVG, read as text / base64 directly
    if (file.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoUrl(result);
        setLogoUploading(false);
        setLogoUploadSuccess("SVG vector logo loaded successfully.");
      };
      reader.onerror = () => {
        setLogoUploadError("Failed to read SVG file.");
        setLogoUploading(false);
      };
      reader.readAsDataURL(file);
      return;
    }

    // For raster images (PNG, JPG, WebP), resize to max 500x500 for crisp, lightweight storage
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 500;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setLogoUrl(e.target?.result as string);
          setLogoUploading(false);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        let dataUrl = canvas.toDataURL("image/webp", 0.92);
        if (!dataUrl.startsWith("data:image/webp")) {
          dataUrl = canvas.toDataURL("image/png");
        }
        setLogoUrl(dataUrl);
        setLogoUploading(false);
        const kbSize = Math.round((dataUrl.length * 3) / 4 / 1024);
        setLogoUploadSuccess(`Logo optimized (${width}×${height}px, ~${kbSize} KB) ready to save!`);
      };
      img.onerror = () => {
        setLogoUploadError("Could not process image file.");
        setLogoUploading(false);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      setLogoUploadError("Failed to read image file.");
      setLogoUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Multi-Currency & Gateway
  const [country, setCountry] = useState(initialBusiness.country || "NG");
  const [currency, setCurrency] = useState(initialBusiness.currency || "NGN");
  const [paymentGateway, setPaymentGateway] = useState(initialBusiness.paymentGateway || "MANUAL");
  const [paymentsEnabled, setPaymentsEnabled] = useState(initialBusiness.paymentsEnabled ?? false);

  // Structured Bank Details fallback parsing
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
      if (initialBankDetails.notes) {
        initialBankDetails.notes = cleanNotesText(initialBankDetails.notes) || "";
      }
    } else if (initialBusiness.paymentDetails) {
      initialBankDetails.notes = cleanNotesText(initialBusiness.paymentDetails) || "";
    }
  } catch {
    initialBankDetails.notes = cleanNotesText(initialBusiness.paymentDetails) || "";
  }

  // Unified Bank Details for Customer Invoices
  const [bankCode, setBankCode] = useState(initialBusiness.bankCode || "058");
  const [bankName, setBankName] = useState(
    initialBusiness.bankName || initialBankDetails.bankName || "Guaranty Trust Bank"
  );
  const [bankAccountNumber, setBankAccountNumber] = useState(
    initialBusiness.bankAccountNumber || initialBankDetails.accountNumber || ""
  );
  const [bankAccountName, setBankAccountName] = useState(
    initialBusiness.bankAccountName || initialBankDetails.accountName || ""
  );
  const [paymentNotes, setPaymentNotes] = useState(
    initialBankDetails.notes || ""
  );
  const [isCustomBank, setIsCustomBank] = useState(
    Boolean(
      (initialBusiness.bankName || initialBankDetails.bankName) &&
      !["058", "057", "044", "011", "033", "50211", "50515", "999992", "999991", "070", "221", "232", "035"].includes(initialBusiness.bankCode || "")
    )
  );

  // Online Card / Gateway checkout
  const [enableOnlineCards, setEnableOnlineCards] = useState(
    (initialBusiness.paymentGateway === "PAYSTACK" || initialBusiness.paymentGateway === "STRIPE") &&
    (initialBusiness.paymentsEnabled ?? false)
  );
  const [paystackSubaccountCode, setPaystackSubaccountCode] = useState(initialBusiness.paystackSubaccountCode || "");

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
            const seen = new Set<string>();
            const unique: { name: string; code: string }[] = [];
            for (const b of data.banks) {
              const c = String(b.code || "").trim();
              if (c && !seen.has(c)) {
                seen.add(c);
                unique.push({ name: String(b.name || "").trim(), code: c });
              }
            }
            setBanksList(unique);
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
        setBankAccountName(data.accountName);
        setResolveError(null);
      } else {
        setResolveError(data.error || "Could not verify bank account. Please check the number.");
      }
    } catch {
      setResolveError("Network error while resolving account details.");
    } finally {
      setIsResolvingAccount(false);
    }
  }

  // Create Subaccount under Master Account for Direct Instant Settlement
  async function handleActivateDirectPayouts() {
    if (!bankAccountNumber || bankAccountNumber.trim().length !== 10) {
      setResolveError("Please enter a valid 10-digit NUBAN account number.");
      return;
    }
    if (!bankCode) {
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
          bankCode: bankCode,
          bankName: bankName,
          accountNumber: bankAccountNumber.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResolveError(data.error || "Failed to link bank account with Paystack.");
        return;
      }

      setPaystackSubaccountCode(data.subaccountCode);
      if (data.accountName) {
        setBankAccountName(data.accountName);
      }
      setPaymentGateway("PAYSTACK");
      setPaymentsEnabled(true);
      setEnableOnlineCards(true);

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

    // Format structured bank details for paymentDetails column
    const paymentDetailsJson = JSON.stringify({
      bankName: bankName.trim(),
      accountName: bankAccountName.trim(),
      accountNumber: bankAccountNumber.trim(),
      bankCode: bankCode.trim(),
      notes: paymentNotes.trim(),
    });

    try {
      const payload: Record<string, unknown> = {
        name,
        email,
        phone: phone.trim() || null,
        address: address.trim() || null,
        country,
        currency,
        paymentGateway: enableOnlineCards ? paymentGateway : "MANUAL",
        paymentsEnabled: enableOnlineCards,
        bankName: bankName.trim() || null,
        bankCode: bankCode.trim() || null,
        bankAccountNumber: bankAccountNumber.trim() || null,
        bankAccountName: bankAccountName.trim() || null,
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
          {/* Business Logo Direct Upload & Preview */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
              Business Logo <span className="font-normal text-[var(--color-text-muted)] lowercase">(shown on quotes &amp; invoices)</span>
            </label>

            {/* Hidden file input for native camera/gallery/filepicker */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  processLogoFile(file);
                }
              }}
            />

            {logoUrl ? (
              <div className="p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xs space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-inner">
                    <img
                      src={logoUrl}
                      alt="Business logo preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={logoUploading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold bg-[var(--color-primary-subtle)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors cursor-pointer"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{logoUploading ? "Processing..." : "Change Logo"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLogoUrl("");
                          setLogoUploadSuccess(null);
                          setLogoUploadError(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold text-[var(--color-error)] hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                    {logoUploadSuccess ? (
                      <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        <span>{logoUploadSuccess}</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-[var(--color-text-muted)]">
                        Logo active. Displayed on public quotes and invoices.
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline cursor-pointer"
                  >
                    {showUrlInput ? "Hide image link" : "Or use image URL instead"}
                  </button>
                </div>

                {showUrlInput && (
                  <input
                    type="url"
                    value={logoUrl.startsWith("data:") ? "" : logoUrl}
                    onChange={(e) => {
                      setLogoUrl(e.target.value);
                      setLogoUploadSuccess(null);
                    }}
                    placeholder="https://.../logo.png"
                    className="w-full h-9 px-2.5 text-xs rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                  />
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) processLogoFile(file);
                  }}
                  className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]/50 hover:bg-[var(--color-surface-muted)] transition-all cursor-pointer text-center group"
                >
                  <div className="w-9 h-9 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-primary)] mb-1.5 group-hover:scale-105 transition-transform">
                    {logoUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
                    ) : (
                      <UploadCloud className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                    {logoUploading ? "Optimizing image..." : "Tap or drop image to upload logo"}
                  </span>
                  <span className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    Supports PNG, JPG, WebP, or SVG (auto-scaled for invoices)
                  </span>
                </div>

                {logoUploadError && (
                  <p className="text-[11px] text-[var(--color-error)] font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{logoUploadError}</span>
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] px-1">
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline cursor-pointer"
                  >
                    {showUrlInput ? "Cancel URL input" : "Or paste image link"}
                  </button>
                </div>

                {showUrlInput && (
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://.../logo.png"
                    className="w-full h-9 px-2.5 text-xs rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                  />
                )}
              </div>
            )}
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

      {/* ── Section 2: Receiver Bank Account (Where Clients Send Money) ────── */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text)] flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
            <Landmark className="w-4 h-4 text-[var(--color-primary)]" />
            Where Customers Send Payment (Your Bank Account)
          </h3>
          <p className="mt-1.5 text-xs text-[var(--color-text-secondary)]">
            Set up the bank account where your clients send money. These details appear directly on all customer invoices with a 1-click &ldquo;Copy Account Number&rdquo; button and instant WhatsApp payment confirmation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Bank Selection */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
              Bank Name
            </label>
            {!isCustomBank ? (
              <div className="space-y-1.5">
                <select
                  value={bankCode}
                  onChange={(e) => {
                    const selectedCode = e.target.value;
                    if (selectedCode === "CUSTOM") {
                      setIsCustomBank(true);
                      setBankCode("");
                      setBankName("");
                      return;
                    }
                    const bankObj = banksList.find((b) => b.code === selectedCode);
                    setBankCode(selectedCode);
                    if (bankObj) {
                      setBankName(bankObj.name);
                    }
                    if (bankAccountNumber.trim().length === 10) {
                      handleResolveAccount(bankAccountNumber.trim(), selectedCode);
                    }
                  }}
                  className="w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                >
                  <option value="">-- Select Your Bank --</option>
                  {banksList.map((b, idx) => (
                    <option key={`bank-${b.code}-${idx}`} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                  <option value="CUSTOM">➕ Other / International Bank...</option>
                </select>
                <button
                  type="button"
                  onClick={() => setIsCustomBank(true)}
                  className="text-[11px] text-[var(--color-primary)] hover:underline font-medium"
                >
                  Can&apos;t find your bank? Enter custom bank name
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. Providus Bank, Moniepoint, Barclays"
                  className="w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomBank(false);
                    if (banksList.length > 0) {
                      setBankCode(banksList[0].code);
                      setBankName(banksList[0].name);
                    }
                  }}
                  className="text-[11px] text-[var(--color-primary)] hover:underline font-medium"
                >
                  ← Choose from standard banks list
                </button>
              </div>
            )}
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
              Account Number
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={20}
                value={bankAccountNumber}
                onChange={(e) => {
                  const val = e.target.value;
                  setBankAccountNumber(val);
                  if (val.trim().length === 10 && bankCode) {
                    handleResolveAccount(val.trim(), bankCode);
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
            <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
              10-digit NUBAN (or standard account number). Auto-verifies account name with bank.
            </p>
          </div>

          {/* Account Holder Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
              Account Holder Name
            </label>
            <input
              type="text"
              value={bankAccountName}
              onChange={(e) => setBankAccountName(e.target.value)}
              placeholder="e.g. Oyebode Precious or Apex Ventures Ltd"
              className="w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
            />
            {bankAccountName && (
              <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Shown on customer invoice: <strong>{bankAccountName}</strong> &bull; {bankName || "Bank"} &bull; {bankAccountNumber}
              </p>
            )}
          </div>
        </div>

        {/* Verification alert or error */}
        {resolveError && (
          <div className="flex items-center gap-2 p-2.5 rounded-[var(--radius-md)] bg-[var(--color-error-bg)] text-[var(--color-error)] border border-[#f8b4b4] text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{resolveError}</span>
          </div>
        )}

        {/* Payment Reference Guidance Notes */}
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
            Payment Notes / Reference Guidance <span className="font-normal text-[var(--color-text-muted)] lowercase">(optional)</span>
          </label>
          <textarea
            rows={2}
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            placeholder="e.g. Please use your invoice number or company name as payment reference."
            className="w-full p-2.5 text-xs rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors resize-y"
          />
        </div>

        {/* Paystack Automated Instant Settlement Option */}
        <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
                <h4 className="text-xs font-semibold text-[var(--color-text)] uppercase tracking-wider">
                  Automated Online Card &amp; Instant Transfer Settlement
                </h4>
                {paystackSubaccountCode && (
                  <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                Link this bank account to Paystack so customers can also pay directly via Debit Cards, Apple Pay, and automated USSD with instant settlement straight to your account.
              </p>
            </div>

            {paystackSubaccountCode ? (
              <button
                type="button"
                onClick={handleActivateDirectPayouts}
                disabled={isActivatingSubaccount || isResolvingAccount || bankAccountNumber.trim().length !== 10}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] transition-colors"
              >
                {isActivatingSubaccount ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Re-sync Bank with Paystack
              </button>
            ) : (
              <button
                type="button"
                onClick={handleActivateDirectPayouts}
                disabled={isActivatingSubaccount || isResolvingAccount || bankAccountNumber.trim().length !== 10 || !bankCode}
                className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors shadow-sm whitespace-nowrap"
              >
                {isActivatingSubaccount ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Linking Bank...
                  </>
                ) : (
                  <>
                    <Landmark className="w-3.5 h-3.5" />
                    Link Bank for Instant Online Payouts
                  </>
                )}
              </button>
            )}
          </div>

          {paystackSubaccountCode && (
            <div className="flex items-center gap-2 p-2.5 rounded-[var(--radius-md)] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>
                Connected subaccount: <code className="font-mono">{paystackSubaccountCode}</code>. 100% of customer card payments settle automatically into your bank account.
              </span>
            </div>
          )}

          {subaccountSuccessMsg && (
            <div className="flex items-center gap-2 p-2.5 rounded-[var(--radius-md)] bg-[var(--color-success-bg)] text-[var(--color-primary)] border border-[#c1e6de] text-xs">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{subaccountSuccessMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 3: Currency, Region & Online Checkout ──────────────────── */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text)] flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
            <Globe2 className="w-4 h-4 text-[var(--color-primary)]" />
            Regional Currency &amp; Online Checkout
          </h3>
          <p className="mt-1.5 text-xs text-[var(--color-text-secondary)]">
            Select the currency for your invoices and configure optional online payment channels.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="bizCountry" className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
              Business Country
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
          </div>

          <div>
            <label htmlFor="bizCurrency" className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
              Billing Currency
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
          </div>
        </div>

        {/* Optional Online Card Checkout Toggle */}
        <div className="pt-2">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={enableOnlineCards}
              onChange={(e) => {
                setEnableOnlineCards(e.target.checked);
                setPaymentsEnabled(e.target.checked);
              }}
              className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-0"
            />
            <span className="text-xs font-semibold text-[var(--color-text)]">
              Enable Online Card &amp; Digital Checkout Button on Invoices
            </span>
          </label>
          <p className="mt-1 text-[11px] text-[var(--color-text-muted)] ml-6.5">
            When enabled, customers can pay with debit/credit cards online in addition to direct bank transfer.
          </p>
        </div>

        {enableOnlineCards && (
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Paystack Card */}
              <div
                onClick={() => setPaymentGateway("PAYSTACK")}
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
                onClick={() => setPaymentGateway("STRIPE")}
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
            </div>

            {/* Paystack BYOK collapsible */}
            {paymentGateway === "PAYSTACK" && (
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
                  {showAdvancedPaystackKeys ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showAdvancedPaystackKeys && (
                  <div className="p-4 border-t border-[var(--color-border)] space-y-3 bg-[var(--color-surface)]">
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      Optional: If you have your own Paystack developer account and wish to use direct API keys instead of platform settlement:
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
                  </div>
                )}
              </div>
            )}

            {/* Stripe BYOK collapsible */}
            {paymentGateway === "STRIPE" && (
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
                  {showAdvancedStripeKeys ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showAdvancedStripeKeys && (
                  <div className="p-4 border-t border-[var(--color-border)] space-y-3 bg-[var(--color-surface)]">
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
                        Test Stripe Keys
                      </button>

                      {testResult?.gateway === "STRIPE" && (
                        <span className={`text-xs flex items-center gap-1 ${testResult.valid ? "text-[var(--color-primary)] font-medium" : "text-[var(--color-error)]"}`}>
                          {testResult.valid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                          {testResult.valid ? "Connection verified!" : (testResult.error || "Failed")}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
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
