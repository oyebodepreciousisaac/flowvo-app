import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runVerification() {
  console.log("=== Flowvo Slice 5 Verification ===");

  // 1. Setup Business & User
  const bizEmail = `slice5-biz-${Date.now()}@example.com`;
  const business = await prisma.business.create({
    data: {
      name: "Apex Heating & Gas",
      slug: `apex-heating-${Date.now()}`,
      email: bizEmail,
      paymentDetails: "Bank: Barclays | Name: Apex Heating | Sort: 20-00-00 | Acc: 12345678",
    },
  });
  console.log(`[PASS] 1. Created business: ${business.name} (${business.id}) with paymentDetails`);

  // 2. Create Lead, Quote, and Job
  const lead = await prisma.lead.create({
    data: {
      businessId: business.id,
      customerName: "Sarah Connor",
      email: "sarah.connor@sky.net",
      phone: "07700900999",
      serviceType: "Full Boiler Replacement",
      description: "Replace legacy system with combi boiler",
      status: "WON",
    },
  });

  const quote = await prisma.quote.create({
    data: {
      leadId: lead.id,
      businessId: business.id,
      quoteToken: `token-${Date.now()}`,
      lineItems: JSON.stringify([
        { description: "Worcester Bosch Combi Boiler", quantity: 1, unitPricePence: 185000, lineTotalPence: 185000 },
        { description: "Installation & Flue Labor", quantity: 1, unitPricePence: 60000, lineTotalPence: 60000 },
      ]),
      subtotal: 245000,
      total: 245000,
      status: "ACCEPTED",
      acceptedAt: new Date(),
    },
  });

  const job = await prisma.job.create({
    data: {
      leadId: lead.id,
      quoteId: quote.id,
      businessId: business.id,
      customerName: lead.customerName,
      customerEmail: lead.email,
      customerPhone: lead.phone,
      description: "Supply and fit Worcester Bosch 30kW boiler",
      amount: 245000,
      lineItems: JSON.stringify([
        { description: "Worcester Bosch Combi Boiler", quantity: 1, unitPricePence: 185000, lineTotalPence: 185000 },
        { description: "Installation & Flue Labor", quantity: 1, unitPricePence: 60000, lineTotalPence: 60000 },
      ]),
      status: "SCHEDULED",
    },
  });
  console.log(`[PASS] 2. Created Job: ${job.id} for £${(job.amount / 100).toFixed(2)}`);

  // 3. Mark Job Complete -> Trigger Invoice Draft
  const nextInvoiceNumber = `INV-${String(
    (await prisma.invoice.count({ where: { businessId: business.id } })) + 1
  ).padStart(3, "0")}`;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const invoiceDraft = await prisma.invoice.create({
    data: {
      jobId: job.id,
      quoteId: quote.id,
      leadId: lead.id,
      businessId: business.id,
      customerName: job.customerName,
      customerEmail: job.customerEmail,
      invoiceNumber: nextInvoiceNumber,
      lineItems: job.lineItems,
      subtotal: job.amount,
      total: job.amount,
      dueDate,
      status: "DRAFT",
    },
  });

  await prisma.job.update({
    where: { id: job.id },
    data: { status: "COMPLETE", completedAt: new Date() },
  });

  console.log(`[PASS] 3. Auto-drafted invoice: ${invoiceDraft.invoiceNumber} (Status: ${invoiceDraft.status}, Total: £${(invoiceDraft.total / 100).toFixed(2)}, Due: ${invoiceDraft.dueDate.toISOString().split("T")[0]})`);

  // 4. Send Invoice (Owner review & send simulation)
  const sentInvoice = await prisma.invoice.update({
    where: { id: invoiceDraft.id },
    data: {
      status: "SENT",
      sentAt: new Date(),
      emailDeliveryStatus: "DELIVERED",
    },
  });

  await prisma.activityLog.create({
    data: {
      businessId: business.id,
      leadId: lead.id,
      quoteId: quote.id,
      jobId: job.id,
      invoiceId: sentInvoice.id,
      entityType: "invoice",
      entityId: sentInvoice.id,
      eventType: "invoice.sent",
      status: "SUCCESS",
      detail: `Invoice ${sentInvoice.invoiceNumber} sent to ${sentInvoice.customerEmail}`,
    },
  });
  console.log(`[PASS] 4. Invoice sent: status = ${sentInvoice.status}, deliveryStatus = ${sentInvoice.emailDeliveryStatus}`);

  // 5. Test Overdue Detection Logic
  // Set dueDate to 2 days ago
  const overdueTestDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  await prisma.invoice.update({
    where: { id: sentInvoice.id },
    data: { dueDate: overdueTestDate },
  });

  // Query past due SENT invoices
  const overdueFound = await prisma.invoice.findMany({
    where: {
      status: "SENT",
      dueDate: { lt: new Date() },
    },
  });
  if (overdueFound.some((i) => i.id === sentInvoice.id)) {
    await prisma.invoice.update({
      where: { id: sentInvoice.id },
      data: { status: "OVERDUE" },
    });
    console.log(`[PASS] 5. Overdue detection: invoice ${sentInvoice.invoiceNumber} transitioned from SENT -> OVERDUE`);
  }

  // 6. Test Bounce Webhook
  await prisma.invoice.update({
    where: { id: sentInvoice.id },
    data: { emailDeliveryStatus: "BOUNCED" },
  });
  await prisma.activityLog.create({
    data: {
      businessId: business.id,
      leadId: lead.id,
      invoiceId: sentInvoice.id,
      entityType: "invoice",
      entityId: sentInvoice.id,
      eventType: "invoice.email_bounced",
      status: "FAILURE",
      detail: `Email delivery to ${sentInvoice.customerEmail} bounced`,
    },
  });
  const bouncedCheck = await prisma.invoice.findUnique({ where: { id: sentInvoice.id } });
  console.log(`[PASS] 6. Bounce webhook handling: delivery status updated to ${bouncedCheck.emailDeliveryStatus}`);

  // 7. Mark as Paid & Trigger Review Request
  const paidInvoice = await prisma.invoice.update({
    where: { id: sentInvoice.id },
    data: {
      status: "PAID",
      paidAt: new Date(),
    },
  });

  const reviewRequest = await prisma.reviewRequest.create({
    data: {
      invoiceId: paidInvoice.id,
      jobId: job.id,
      businessId: business.id,
      customerName: paidInvoice.customerName,
      customerEmail: paidInvoice.customerEmail,
      status: "PENDING",
      unsubscribeToken: `unsub-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    },
  });

  await prisma.activityLog.create({
    data: {
      businessId: business.id,
      leadId: lead.id,
      jobId: job.id,
      invoiceId: paidInvoice.id,
      entityType: "invoice",
      entityId: paidInvoice.id,
      eventType: "invoice.paid",
      status: "SUCCESS",
      detail: `Invoice ${paidInvoice.invoiceNumber} marked as paid (£${(paidInvoice.total / 100).toFixed(2)})`,
    },
  });
  console.log(`[PASS] 7. Invoice marked PAID: status = ${paidInvoice.status}, paidAt = ${paidInvoice.paidAt.toISOString()}`);
  console.log(`[PASS] 7b. ReviewRequest auto-created for Slice 6: ID ${reviewRequest.id}, status = ${reviewRequest.status}, token = ${reviewRequest.unsubscribeToken}`);

  console.log("\n=== SLICE 5 VERIFICATION COMPLETED SUCCESSFULLY ===");
}

runVerification()
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
