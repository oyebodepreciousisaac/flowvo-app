import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { invoiceEmailHtml, invoiceEmailText } from "@/lib/email-templates/invoice-email";
import { LineItem } from "@/lib/email-templates/quote-email";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      businessId: session.user.businessId,
    },
    include: {
      business: true,
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  let lineItems: LineItem[] = [];
  try {
    lineItems = JSON.parse(invoice.lineItems);
  } catch {
    lineItems = [];
  }

  // Send email
  const emailRes = await sendEmail({
    to: invoice.customerEmail,
    replyTo: invoice.business.email,
    fromName: invoice.business.name,
    subject: `Invoice ${invoice.invoiceNumber} from ${invoice.business.name} — £${(invoice.total / 100).toFixed(2)}`,
    html: invoiceEmailHtml({
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      businessName: invoice.business.name,
      lineItems,
      totalPence: invoice.total,
      dueDate: invoice.dueDate,
      paymentDetails: invoice.business.paymentDetails,
    }),
    text: invoiceEmailText({
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      businessName: invoice.business.name,
      lineItems,
      totalPence: invoice.total,
      dueDate: invoice.dueDate,
      paymentDetails: invoice.business.paymentDetails,
    }),
  });

  // Update status
  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: "SENT",
      sentAt: new Date(),
      emailDeliveryStatus: emailRes.success ? "DELIVERED" : "PENDING",
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      businessId: session.user.businessId,
      leadId: invoice.leadId,
      quoteId: invoice.quoteId,
      jobId: invoice.jobId,
      invoiceId: invoice.id,
      entityType: "invoice",
      entityId: invoice.id,
      eventType: emailRes.success ? "invoice.sent" : "invoice.send_failed",
      status: emailRes.success ? "SUCCESS" : "FAILURE",
      detail: emailRes.success
        ? `Invoice ${invoice.invoiceNumber} sent to ${invoice.customerEmail}`
        : `Email delivery failed: ${emailRes.error}`,
    },
  });

  return NextResponse.json({ ok: true, invoice: updatedInvoice });
}
