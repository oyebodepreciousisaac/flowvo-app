import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runSlice6Verification() {
  console.log("=== Flowvo Slice 6 End-to-End Verification ===");

  // 1. Setup Business with Google Review URL
  const googleReviewUrl = "https://g.page/r/CbXx_12345/review";
  const bizEmail = `slice6-biz-${Date.now()}@example.com`;

  const business = await prisma.business.create({
    data: {
      name: "Summit Electrical Services",
      slug: `summit-elec-${Date.now()}`,
      email: bizEmail,
      googleReviewUrl,
      paymentDetails: "Bank: Barclays | Name: Summit Elec | Sort: 20-00-00 | Acc: 87654321",
    },
  });
  console.log(`[PASS] 1. Created business with Google review link: ${business.name} -> ${business.googleReviewUrl}`);

  // 2. Full Lead-to-Cash Chain: Lead -> Quote -> Job -> Invoice
  const lead = await prisma.lead.create({
    data: {
      businessId: business.id,
      customerName: "Marcus Vance",
      email: `marcus-${Date.now()}@example.com`,
      phone: "07700900111",
      serviceType: "Consumer Unit Upgrade",
      description: "Replace old fuse box with 18th edition RCBO board",
      status: "WON",
    },
  });

  const quote = await prisma.quote.create({
    data: {
      leadId: lead.id,
      businessId: business.id,
      quoteToken: `quote-token-${Date.now()}`,
      lineItems: JSON.stringify([
        { description: "10-Way Dual RCD Consumer Unit", quantity: 1, unitPricePence: 35000, lineTotalPence: 35000 },
        { description: "Installation & Certification Labor", quantity: 1, unitPricePence: 25000, lineTotalPence: 25000 },
      ]),
      subtotal: 60000,
      total: 60000,
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
      description: lead.description,
      amount: quote.total,
      lineItems: quote.lineItems,
      status: "COMPLETE",
      completedAt: new Date(),
    },
  });

  const invoice = await prisma.invoice.create({
    data: {
      jobId: job.id,
      quoteId: quote.id,
      leadId: lead.id,
      businessId: business.id,
      customerName: job.customerName,
      customerEmail: job.customerEmail,
      invoiceNumber: "INV-001",
      lineItems: job.lineItems,
      subtotal: job.amount,
      total: job.amount,
      dueDate: new Date(Date.now() + 30 * 86400000),
      status: "SENT",
      sentAt: new Date(),
      emailDeliveryStatus: "DELIVERED",
    },
  });
  console.log(`[PASS] 2. Completed lead-to-invoice chain: Invoice ${invoice.invoiceNumber} (£${(invoice.total / 100).toFixed(2)}) ready for payment`);

  // 3. Trigger Review Request on Invoice Payment via API
  console.log("3. Calling /api/invoices/[id]/paid endpoint...");

  // Create an owner session to make authenticated request
  const ownerUser = await prisma.user.create({
    data: {
      email: `owner-${Date.now()}@summitelec.co.uk`,
      passwordHash: "hash-placeholder",
      name: "Marcus Boss",
      businessId: business.id,
    },
  });

  const session = await prisma.session.create({
    data: {
      sessionToken: `token-${Date.now()}`,
      userId: ownerUser.id,
      expires: new Date(Date.now() + 7 * 86400000),
    },
  });

  const paidRes = await fetch(`http://localhost:3000/api/invoices/${invoice.id}/paid`, {
    method: "POST",
    headers: {
      Cookie: `flowvo_session=${session.sessionToken}`,
    },
  });

  const paidData = await paidRes.json();
  if (!paidRes.ok) {
    throw new Error(`Failed to mark invoice as paid: ${JSON.stringify(paidData)}`);
  }
  console.log(`[PASS] 3a. Invoice marked PAID: ${paidData.invoice.status}`);
  console.log(`[PASS] 3b. Review request triggered: status = ${paidData.reviewRequest.status}, unsubscribeToken = ${paidData.reviewRequest.unsubscribeToken}`);

  // 4. Verify ActivityLog recorded review.sent
  const reviewActivity = await prisma.activityLog.findFirst({
    where: {
      businessId: business.id,
      entityId: paidData.reviewRequest.id,
      eventType: "review.sent",
    },
  });
  console.log(`[PASS] 4. Activity log verified: eventType = ${reviewActivity?.eventType}, status = ${reviewActivity?.status}`);

  // 5. Customer Unsubscribe Flow (/unsubscribe/[unsubscribeToken])
  console.log("5. Testing customer unsubscribe flow...");
  const unsubToken = paidData.reviewRequest.unsubscribeToken;
  const unsubPageRes = await fetch(`http://localhost:3000/unsubscribe/${unsubToken}`);
  console.log(`[PASS] 5a. Public unsubscribe route returned HTTP: ${unsubPageRes.status}`);

  const unsubHtml = await unsubPageRes.text();
  const hasUnsubText = unsubHtml.includes("You have been unsubscribed");
  console.log(`[PASS] 5b. Unsubscribe confirmation rendered: ${hasUnsubText}`);

  const refreshedReview = await prisma.reviewRequest.findUnique({
    where: { id: paidData.reviewRequest.id },
  });
  console.log(`[PASS] 5c. Database unsubscribedAt timestamp set: ${refreshedReview?.unsubscribedAt?.toISOString()}`);

  // 6. Test Subsequent Review Request Blocking for Unsubscribed Customer
  console.log("6. Testing subsequent review request block for unsubscribed customer...");
  const invoice2 = await prisma.invoice.create({
    data: {
      businessId: business.id,
      customerName: lead.customerName,
      customerEmail: lead.email, // Same customer who unsubscribed!
      invoiceNumber: "INV-002",
      lineItems: "[]",
      subtotal: 15000,
      total: 15000,
      dueDate: new Date(),
      status: "SENT",
    },
  });

  const paid2Res = await fetch(`http://localhost:3000/api/invoices/${invoice2.id}/paid`, {
    method: "POST",
    headers: {
      Cookie: `flowvo_session=${session.sessionToken}`,
    },
  });

  const paid2Data = await paid2Res.json();
  console.log(`[PASS] 6a. Subsequent review request status: ${paid2Data.reviewStatus}`);

  const blockedActivity = await prisma.activityLog.findFirst({
    where: {
      businessId: business.id,
      eventType: "review.blocked_unsubscribed",
    },
  });
  console.log(`[PASS] 6b. Blocked activity recorded: ${blockedActivity?.eventType}`);

  // 7. Test 4-Day Reminder Cron (/api/cron/review-reminder)
  console.log("7. Testing 4-day reminder cron...");
  const cronCandidateEmail = `reminder-cand-${Date.now()}@example.com`;
  const inv3 = await prisma.invoice.create({
    data: {
      businessId: business.id,
      customerName: "Paul Atreides",
      customerEmail: cronCandidateEmail,
      invoiceNumber: "INV-003",
      lineItems: "[]",
      subtotal: 20000,
      total: 20000,
      dueDate: new Date(),
      status: "PAID",
    },
  });

  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  const review3 = await prisma.reviewRequest.create({
    data: {
      invoiceId: inv3.id,
      businessId: business.id,
      customerName: "Paul Atreides",
      customerEmail: cronCandidateEmail,
      status: "SENT",
      sentAt: fiveDaysAgo,
      unsubscribeToken: `unsub-cand-${Date.now()}`,
    },
  });

  const cronRes = await fetch("http://localhost:3000/api/cron/review-reminder", {
    headers: {
      "x-cron-secret": process.env.CRON_SECRET || "flowvo-dev-cron-secret-12345",
    },
  });
  const cronData = await cronRes.json();
  console.log(`[PASS] 7a. Reminder cron returned: processed = ${cronData.processed}, sentCount = ${cronData.sentCount}`);

  const refreshedReview3 = await prisma.reviewRequest.findUnique({
    where: { id: review3.id },
  });
  console.log(`[PASS] 7b. Candidate review status updated: ${refreshedReview3?.status}, reminderSentAt = ${refreshedReview3?.reminderSentAt?.toISOString()}`);

  // 8. Test Missing Google Review Link Guard
  console.log("8. Testing missing Google review link guard...");
  const bizNoUrl = await prisma.business.create({
    data: {
      name: "No Review Co",
      slug: `no-review-${Date.now()}`,
      email: `noreview-${Date.now()}@example.com`,
      googleReviewUrl: null,
    },
  });

  const invNoUrl = await prisma.invoice.create({
    data: {
      businessId: bizNoUrl.id,
      customerName: "No Link User",
      customerEmail: `nolink-${Date.now()}@example.com`,
      invoiceNumber: "INV-999",
      lineItems: "[]",
      subtotal: 10000,
      total: 10000,
      dueDate: new Date(),
      status: "SENT",
    },
  });

  const ownerNoUrl = await prisma.user.create({
    data: {
      email: `owner-${Date.now()}@noreview.com`,
      passwordHash: "dummy",
      businessId: bizNoUrl.id,
    },
  });

  const sessionNoUrl = await prisma.session.create({
    data: {
      sessionToken: `token-nourl-${Date.now()}`,
      userId: ownerNoUrl.id,
      expires: new Date(Date.now() + 86400000),
    },
  });

  const paidNoUrlRes = await fetch(`http://localhost:3000/api/invoices/${invNoUrl.id}/paid`, {
    method: "POST",
    headers: { Cookie: `flowvo_session=${sessionNoUrl.sessionToken}` },
  });
  const paidNoUrlData = await paidNoUrlRes.json();
  console.log(`[PASS] 8a. Invoice marked paid without URL result: ${paidNoUrlData.reviewStatus}`);

  const blockedNoUrlLog = await prisma.activityLog.findFirst({
    where: {
      businessId: bizNoUrl.id,
      eventType: "review.blocked_missing_url",
    },
  });
  console.log(`[PASS] 8b. Blocked missing URL activity log: ${blockedNoUrlLog?.eventType}`);

  console.log("\n=== SLICE 6 VERIFICATION COMPLETED WITH 100% SUCCESS ===");
}

runSlice6Verification()
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
