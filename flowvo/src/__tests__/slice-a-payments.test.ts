import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";
import { formatAmount, getCurrencySymbol, SUPPORTED_CURRENCIES } from "@/lib/currency";
import { verifyPaystackWebhookSignature } from "@/lib/paystack";
import { verifyStripeWebhookSignature } from "@/lib/stripe";
import { invoiceEmailHtml, invoiceEmailText } from "@/lib/email-templates/invoice-email";
import { processInvoicePaymentSuccess } from "@/lib/invoice-payment";
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
});
