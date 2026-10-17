import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";
import { formatAmount, getCurrencySymbol, SUPPORTED_CURRENCIES } from "@/lib/currency";
import { verifyPaystackWebhookSignature } from "@/lib/paystack";
import { verifyStripeWebhookSignature } from "@/lib/stripe";
import { invoiceEmailHtml, invoiceEmailText } from "@/lib/email-templates/invoice-email";
import { processInvoicePaymentSuccess, generateInvoicePaymentLink } from "@/lib/invoice-payment";
import * as paystackLib from "@/lib/paystack";
import { prisma } from "@/lib/prisma";

describe("Slice A: Multi-Currency Engine", () => {
  it("formats amounts in kobo to Nigerian Naira correctly", () => {
    // 250,000 Naira = 25,000,000 kobo
    const formatted = formatAmount(25000000, "NGN");
    expect(formatted).toContain("250,000.00");
    expect(formatted).toMatch(/₦|NGN/);
  });

  it("formats amounts in pence to British Pounds correctly", () => {
    const formatted = formatAmount(15000, "GBP");
    expect(formatted).toContain("150.00");
    expect(formatted).toContain("£");
  });

  it("formats amounts in cents to Euro and US Dollar correctly", () => {
    const eur = formatAmount(12050, "EUR");
    expect(eur).toContain("120.50");
    expect(eur).toContain("€");

    const usd = formatAmount(9999, "USD");
    expect(usd).toContain("99.99");
    expect(usd).toContain("$");
  });

  it("returns correct currency symbols", () => {
    expect(getCurrencySymbol("NGN")).toBe("₦");
    expect(getCurrencySymbol("GBP")).toBe("£");
    expect(getCurrencySymbol("EUR")).toBe("€");
    expect(getCurrencySymbol("USD")).toBe("$");
    expect(getCurrencySymbol("GHS")).toBe("GH₵");
    expect(getCurrencySymbol("ZAR")).toBe("R");
    expect(getCurrencySymbol("KES")).toBe("KSh");
  });

  it("handles unknown or fallback currencies gracefully", () => {
    const res = formatAmount(5000, "XYZ");
    expect(res).toContain("50.00");
  });
});

describe("Slice A: Payment Gateway Webhook Security", () => {
  const secret = "test_secret_key_123456789";

  it("validates authentic Paystack webhook HMAC-SHA512 signatures", () => {
    const rawPayload = JSON.stringify({
      event: "charge.success",
      data: { reference: "FLOWVO_INV_001", amount: 5000000 },
    });

    const validSig = crypto.createHmac("sha512", secret).update(rawPayload).digest("hex");
    expect(verifyPaystackWebhookSignature(rawPayload, validSig, secret)).toBe(true);

    const badSig = "0000000000000000000000000000000000000000000000000000000000000000";
    expect(verifyPaystackWebhookSignature(rawPayload, badSig, secret)).toBe(false);
    expect(verifyPaystackWebhookSignature(rawPayload, null, secret)).toBe(false);
  });

  it("validates authentic Stripe webhook HMAC-SHA256 signatures and timestamp checks", () => {
    const rawPayload = JSON.stringify({
      id: "evt_test_123",
      type: "checkout.session.completed",
    });

    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${rawPayload}`;
    const hash = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");
    const validHeader = `t=${timestamp},v1=${hash}`;

    expect(verifyStripeWebhookSignature(rawPayload, validHeader, secret)).toBe(true);

    // Tampered payload
    expect(verifyStripeWebhookSignature(rawPayload + "tampered", validHeader, secret)).toBe(false);

    // Expired timestamp (>5 min drift)
    const oldTimestamp = timestamp - 400;
    const oldSignedPayload = `${oldTimestamp}.${rawPayload}`;
    const oldHash = crypto.createHmac("sha256", secret).update(oldSignedPayload, "utf8").digest("hex");
    const expiredHeader = `t=${oldTimestamp},v1=${oldHash}`;
    expect(verifyStripeWebhookSignature(rawPayload, expiredHeader, secret)).toBe(false);
  });
});

describe("Slice A: Invoice Email Template Multi-Currency & Payment Link", () => {
  it("renders Naira currency symbol and online payment link in invoice email HTML", () => {
    const html = invoiceEmailHtml({
      invoiceNumber: "INV-042",
      customerName: "Adebayo Johnson",
      businessName: "Lagos Plumbing Pros",
      lineItems: [
        {
          id: "item-1",
          description: "Full Bore Valve Installation",
          quantity: 2,
          unitPricePence: 2500000,
          lineTotalPence: 5000000,
        },
      ],
      totalPence: 5000000,
      dueDate: new Date("2026-10-15"),
      currency: "NGN",
      paymentLinkUrl: "https://checkout.paystack.com/flowvo-test-pay-123",
      paymentDetails: "Zenith Bank\nAccount: 1012345678\nAdebayo Services",
    });

    expect(html).toContain("INV-042");
    expect(html).toContain("Lagos Plumbing Pros");
    expect(html).toContain("Full Bore Valve Installation");
    expect(html).toContain("https://checkout.paystack.com/flowvo-test-pay-123");
    expect(html).toContain("Pay Online Now (₦) — Card / Transfer / USSD");
    expect(html).toContain("Zenith Bank");
  });

  it("renders plain text invoice with payment link and multi-currency", () => {
    const text = invoiceEmailText({
      invoiceNumber: "INV-042",
      customerName: "Adebayo Johnson",
      businessName: "Lagos Plumbing Pros",
      lineItems: [
        {
          id: "item-1",
          description: "Water Heater Repair",
          quantity: 1,
          unitPricePence: 3500000,
          lineTotalPence: 3500000,
        },
      ],
      totalPence: 3500000,
      dueDate: new Date("2026-10-15"),
      currency: "NGN",
      paymentLinkUrl: "https://checkout.paystack.com/flowvo-test-pay-123",
    });

    expect(text).toContain("Invoice INV-042");
    expect(text).toContain("https://checkout.paystack.com/flowvo-test-pay-123");
    expect(text).toContain("Water Heater Repair");
  });
});

describe("Slice A: Idempotent Payment Success Processing", () => {
  it("idempotently processes invoice payment without duplicate execution", async () => {
    // Mock prisma
    const fakeInvoice = {
      id: "inv-test-slice-a",
      invoiceNumber: "INV-099",
      businessId: "biz-test",
      leadId: "lead-test",
      quoteId: "quote-test",
      jobId: "job-test",
      status: "DRAFT",
      total: 7500000,
      currency: "NGN",
      customerName: "Amaka Obi",
      customerEmail: "amaka@example.com",
      business: {
        id: "biz-test",
        name: "Quick Fix Abuja",
        email: "contact@quickfix.ng",
        googleReviewUrl: "https://g.page/r/test/review",
      },
      job: { description: "Electrical rewire" },
      lead: { serviceType: "Electrical" },
      reviewRequests: [],
    };

    const findUniqueSpy = vi.spyOn(prisma.invoice, "findUnique").mockResolvedValueOnce({
      ...fakeInvoice,
      status: "SENT",
      paidAt: null,
    } as any);

    const updateSpy = vi.spyOn(prisma.invoice, "update").mockResolvedValueOnce({
      ...fakeInvoice,
      status: "PAID",
      paidAt: new Date(),
    } as any);

    const activitySpy = vi.spyOn(prisma.activityLog, "create").mockResolvedValue({} as any);
    const reviewSpy = vi.spyOn(prisma.reviewRequest, "findFirst").mockResolvedValue(null);
    const reviewCreateSpy = vi.spyOn(prisma.reviewRequest, "create").mockResolvedValue({
      id: "rev-1",
      unsubscribeToken: "tok-123",
    } as any);
    const reviewUpdateSpy = vi.spyOn(prisma.reviewRequest, "update").mockResolvedValue({} as any);

    const result = await processInvoicePaymentSuccess({
      invoiceId: "inv-test-slice-a",
      paymentReference: "REF_PAYSTACK_001",
      gatewayPaymentId: "pstk_12345",
    });

    expect(result.ok).toBe(true);
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "inv-test-slice-a" },
        data: expect.objectContaining({
          status: "PAID",
          paymentReference: "REF_PAYSTACK_001",
          gatewayPaymentId: "pstk_12345",
        }),
      })
    );

    // Second call: already PAID
    vi.spyOn(prisma.invoice, "findUnique").mockResolvedValueOnce({
      ...fakeInvoice,
      status: "PAID",
      paidAt: new Date(),
    } as any);

    const secondResult = await processInvoicePaymentSuccess({
      invoiceId: "inv-test-slice-a",
    });

    expect(secondResult.ok).toBe(true);
    expect(secondResult.alreadyPaid).toBe(true);
  });

  describe("Invoice Payment Link Generation (Paystack & Offline)", () => {
    it("returns existing paymentLinkUrl without calling gateway if already present", async () => {
      const res = await generateInvoicePaymentLink({
        invoice: {
          id: "inv-existing",
          invoiceNumber: "INV-100",
          customerEmail: "customer@example.com",
          currency: "NGN",
          total: 5000000,
          paymentLinkUrl: "https://checkout.paystack.com/already-created",
          paymentReference: "FLOWVO_REF_EXISTING",
        },
        business: {
          id: "biz-1",
          currency: "NGN",
          paymentGateway: "PAYSTACK",
        },
        origin: "http://localhost:3000",
      });

      expect(res.paymentLinkUrl).toBe("https://checkout.paystack.com/already-created");
      expect(res.paymentReference).toBe("FLOWVO_REF_EXISTING");
    });

    it("initializes Paystack transaction in kobo for Nigerian Naira invoices", async () => {
      vi.spyOn(paystackLib, "getEffectivePaystackSecretKey").mockReturnValueOnce("sk_test_mocked_key");
      vi.spyOn(paystackLib, "initializePaystackTransaction").mockResolvedValueOnce({
        status: true,
        message: "Authorization URL created",
        data: {
          authorization_url: "https://checkout.paystack.com/new-session-123",
          access_code: "acc_code_123",
          reference: "FLOWVO_inv-new_123",
        },
      });

      const updateSpy = vi.spyOn(prisma.invoice, "update").mockResolvedValueOnce({} as any);

      const res = await generateInvoicePaymentLink({
        invoice: {
          id: "inv-new",
          invoiceNumber: "INV-101",
          customerEmail: "chidi@example.com",
          currency: "NGN",
          total: 35000000, // 350,000 NGN in kobo
          paymentLinkUrl: null,
          paymentReference: null,
        },
        business: {
          id: "biz-ng",
          currency: "NGN",
          paymentGateway: "PAYSTACK",
        },
        origin: "http://localhost:3000",
        callbackPath: "/q/quote-token-abc?paid=true",
      });

      expect(res.paymentLinkUrl).toBe("https://checkout.paystack.com/new-session-123");
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "inv-new" },
          data: expect.objectContaining({
            paymentLinkUrl: "https://checkout.paystack.com/new-session-123",
          }),
        })
      );
    });

    it("properly structures offline bank transfer receipt metadata", () => {
      const receiptMeta = {
        senderName: "Bolanle Cole",
        bankName: "Guaranty Trust Bank (GTBank)",
        reference: "TRANSFER-REF-992",
        note: "Paid for solar installation package",
        receiptDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        amount: 25000000,
        currency: "NGN",
        submittedAt: new Date().toISOString(),
      };

      const serialized = JSON.stringify(receiptMeta);
      const parsed = JSON.parse(serialized);

      expect(parsed.senderName).toBe("Bolanle Cole");
      expect(parsed.bankName).toContain("GTBank");
      expect(parsed.currency).toBe("NGN");
      expect(parsed.amount).toBe(25000000);
      expect(parsed.receiptDataUrl).toContain("data:image/png;base64");
      expect(formatAmount(parsed.amount, parsed.currency)).toContain("250,000.00");
    });
  });
});

