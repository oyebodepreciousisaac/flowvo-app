import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

async function verifyPassword(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("\n==================================================");
  console.log("🚀 FLOWVO SLICE 7 VERIFICATION: Dashboard & Hardening");
  console.log("==================================================\n");

  const timestamp = Date.now();
  const testEmail = `slice7-owner-${timestamp}@test.com`;
  const initialPassword = "InitialPassword123!";
  const updatedPassword = "NewSecretPassword456!";

  // 1. Business & User Creation with Initial Password
  console.log("1. Creating test business and user...");
  const passwordHash = await hashPassword(initialPassword);

  const business = await prisma.business.create({
    data: {
      name: "Apex Heating & Electrical",
      slug: generateSlug(`Apex ${timestamp}`),
      email: testEmail,
      quoteFollowUpDelayDays: 3,
      reviewReminderDelayDays: 4,
      users: {
        create: {
          email: testEmail,
          passwordHash,
          name: "Dave Miller",
        },
      },
    },
    include: { users: true },
  });

  const user = business.users[0];
  console.log(`   ✓ Business created: ${business.name} (ID: ${business.id})`);
  console.log(`   ✓ User created: ${user.email} (ID: ${user.id})`);

  // 2. Test Password Change Logic
  console.log("\n2. Verifying password update and hashing...");
  const isInitialValid = await verifyPassword(initialPassword, user.passwordHash);
  if (!isInitialValid) throw new Error("Initial password verification failed!");
  console.log("   ✓ Initial password verified");

  const newHash = await hashPassword(updatedPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  const refreshedUser = await prisma.user.findUnique({ where: { id: user.id } });
  const isOldRejected = await verifyPassword(initialPassword, refreshedUser.passwordHash);
  const isNewAccepted = await verifyPassword(updatedPassword, refreshedUser.passwordHash);

  if (isOldRejected || !isNewAccepted) {
    throw new Error("Password update verification failed!");
  }
  console.log("   ✓ New password verified and old password properly rejected");

  // 3. Test Full Settings & Automation Delays
  console.log("\n3. Testing settings & custom automation delays...");
  const updatedBusiness = await prisma.business.update({
    where: { id: business.id },
    data: {
      paymentDetails: "Bank: Barclays Bank UK | Acc: 87654321 | Sort: 20-00-00",
      quoteFollowUpDelayDays: 5,
      reviewReminderDelayDays: 2,
      googleReviewUrl: "https://g.page/r/apex-heating/review",
    },
  });

  if (
    updatedBusiness.quoteFollowUpDelayDays !== 5 ||
    updatedBusiness.reviewReminderDelayDays !== 2 ||
    !updatedBusiness.paymentDetails?.includes("Barclays")
  ) {
    throw new Error("Settings update failed to persist delays or bank details!");
  }
  console.log(`   ✓ quoteFollowUpDelayDays: ${updatedBusiness.quoteFollowUpDelayDays} days`);
  console.log(`   ✓ reviewReminderDelayDays: ${updatedBusiness.reviewReminderDelayDays} days`);
  console.log(`   ✓ Bank & Google Review details saved successfully`);

  // 4. Populate Entities for Dashboard Action Strip
  console.log("\n4. Populating entities across all severity levels...");
  const now = new Date();

  // (a) Overdue invoice (Severity 1: Red)
  const overdueInvoice = await prisma.invoice.create({
    data: {
      businessId: business.id,
      customerName: "Mrs. Higgins",
      customerEmail: "higgins@example.com",
      invoiceNumber: "INV-VERIFY-001",
      lineItems: JSON.stringify([{ description: "Emergency Pipe Repair", totalPence: 22000 }]),
      subtotal: 22000,
      total: 22000,
      status: "OVERDUE",
      dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
  });
  console.log(`   ✓ Severity 1 (Red): Overdue Invoice ${overdueInvoice.invoiceNumber}`);

  // (b) Bounced email invoice (Severity 2: Red)
  const bouncedInvoice = await prisma.invoice.create({
    data: {
      businessId: business.id,
      customerName: "Tom Walker",
      customerEmail: "invalid-bad-email@example.com",
      invoiceNumber: "INV-VERIFY-002",
      lineItems: JSON.stringify([{ description: "Radiator valve replacement", totalPence: 8500 }]),
      subtotal: 8500,
      total: 8500,
      status: "SENT",
      emailDeliveryStatus: "BOUNCED",
      dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`   ✓ Severity 2 (Red): Bounced Invoice ${bouncedInvoice.invoiceNumber}`);

  // (c) Draft invoice awaiting send (Severity 3: Amber)
  const draftInvoice = await prisma.invoice.create({
    data: {
      businessId: business.id,
      customerName: "Claire Evans",
      customerEmail: "claire@example.com",
      invoiceNumber: "INV-VERIFY-003",
      lineItems: JSON.stringify([{ description: "Boiler Service Certificate", totalPence: 12000 }]),
      subtotal: 12000,
      total: 12000,
      status: "DRAFT",
      dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`   ✓ Severity 3 (Amber): Draft Invoice awaiting send ${draftInvoice.invoiceNumber}`);

  // (d) Stalled quote > 7 days (Severity 4: Amber)
  const quoteLead = await prisma.lead.create({
    data: {
      businessId: business.id,
      customerName: "George Palmer",
      email: "george@example.com",
      phone: "07700900111",
      serviceType: "Full House Rewiring",
      description: "Rewiring 3 bed semi-detached",
      status: "QUOTED",
    },
  });

  const stalledQuote = await prisma.quote.create({
    data: {
      businessId: business.id,
      leadId: quoteLead.id,
      lineItems: JSON.stringify([{ description: "Rewiring quote", totalPence: 350000 }]),
      subtotal: 350000,
      total: 350000,
      status: "SENT",
      sentAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
      quoteToken: `verify-quote-${timestamp}`,
    },
  });
  console.log(`   ✓ Severity 4 (Amber): Stalled quote sent 9 days ago (Quote ID: ${stalledQuote.id})`);

  // (e) New lead awaiting contact (Severity 5: Teal)
  const newLead = await prisma.lead.create({
    data: {
      businessId: business.id,
      customerName: "Sarah Connor",
      email: "sarah@example.com",
      phone: "07700900222",
      serviceType: "Heat Pump Installation",
      description: "Looking for quote on air source heat pump",
      status: "NEW",
    },
  });
  console.log(`   ✓ Severity 5 (Teal): New Lead awaiting contact (${newLead.customerName})`);

  // (f) Active job
  const job = await prisma.job.create({
    data: {
      businessId: business.id,
      customerName: "Mark Hughes",
      customerEmail: "mark@example.com",
      customerPhone: "07700900333",
      description: "Commercial boiler annual inspection and safety certification",
      amount: 45000,
      status: "IN_PROGRESS",
      scheduledDate: new Date(),
    },
  });
  console.log(`   ✓ Active Job in progress: ${job.description}`);

  // 5. Query and Assert Dashboard Aggregates
  console.log("\n5. Querying Dashboard Action Strip & KPI aggregates...");

  const [
    overdueInvoices,
    deliveryFailures,
    draftInvoices,
    stalledQuotes,
    newLeads,
    activeLeadsCount,
    openQuotesCount,
    jobsInProgressCount,
    unpaidInvoicesCount,
  ] = await Promise.all([
    prisma.invoice.findMany({ where: { businessId: business.id, status: "OVERDUE" } }),
    prisma.invoice.findMany({ where: { businessId: business.id, emailDeliveryStatus: "BOUNCED" } }),
    prisma.invoice.findMany({ where: { businessId: business.id, status: "DRAFT" } }),
    prisma.quote.findMany({
      where: {
        businessId: business.id,
        status: "SENT",
        sentAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.lead.findMany({ where: { businessId: business.id, status: "NEW" } }),
    prisma.lead.count({ where: { businessId: business.id, status: { in: ["NEW", "CONTACTED", "QUOTED"] } } }),
    prisma.quote.count({ where: { businessId: business.id, status: "SENT" } }),
    prisma.job.count({ where: { businessId: business.id, status: { in: ["SCHEDULED", "IN_PROGRESS"] } } }),
    prisma.invoice.count({ where: { businessId: business.id, status: { in: ["DRAFT", "SENT", "OVERDUE"] } } }),
  ]);

  console.log(`   * Action Strip Items:`);
  console.log(`     - [Severity 1 - Red] Overdue: ${overdueInvoices.length} (Expected: 1)`);
  console.log(`     - [Severity 2 - Red] Delivery failures: ${deliveryFailures.length} (Expected: 1)`);
  console.log(`     - [Severity 3 - Amber] Draft invoices: ${draftInvoices.length} (Expected: 1)`);
  console.log(`     - [Severity 4 - Amber] Stalled quotes: ${stalledQuotes.length} (Expected: 1)`);
  console.log(`     - [Severity 5 - Teal] New leads: ${newLeads.length} (Expected: 1)`);

  console.log(`   * Summary KPI Counts:`);
  console.log(`     - Active Leads: ${activeLeadsCount} (Expected: 2)`);
  console.log(`     - Open Quotes: ${openQuotesCount} (Expected: 1)`);
  console.log(`     - Jobs In Progress: ${jobsInProgressCount} (Expected: 1)`);
  console.log(`     - Unpaid Invoices: ${unpaidInvoicesCount} (Expected: 3)`);

  if (
    overdueInvoices.length !== 1 ||
    deliveryFailures.length !== 1 ||
    draftInvoices.length !== 1 ||
    stalledQuotes.length !== 1 ||
    newLeads.length !== 1 ||
    activeLeadsCount !== 2 ||
    openQuotesCount !== 1 ||
    jobsInProgressCount !== 1 ||
    unpaidInvoicesCount !== 3
  ) {
    throw new Error("Dashboard aggregation counts mismatch!");
  }

  // 6. Test Activity Log with Automated vs Manual icons
  console.log("\n6. Verifying Activity Log audit records...");
  const manualLog = await prisma.activityLog.create({
    data: {
      businessId: business.id,
      entityType: "invoice",
      entityId: overdueInvoice.id,
      eventType: "invoice.paid",
      status: "SUCCESS",
      detail: "Payment marked manually by owner",
    },
  });

  const autoLog = await prisma.activityLog.create({
    data: {
      businessId: business.id,
      entityType: "quote",
      entityId: stalledQuote.id,
      eventType: "quote.followup_sent",
      status: "SUCCESS",
      detail: "Automated follow-up sent after 5 days",
    },
  });

  console.log(`   ✓ Manual event recorded: ${manualLog.eventType} (✎ Manual / Owner)`);
  console.log(`   ✓ Automated event recorded: ${autoLog.eventType} (⚡ Flowvo automation)`);

  // 7. Verify Health DB Connectivity
  console.log("\n7. Verifying /api/health check database query...");
  const healthCheck = await prisma.$queryRaw`SELECT 1 as result`;
  if (!healthCheck) throw new Error("Health check query failed!");
  console.log("   ✓ Database connection check passed");

  console.log("\n==================================================");
  console.log("🎉 SLICE 7 VERIFICATION COMPLETE: ALL CHECKS PASSED!");
  console.log("==================================================\n");
}

main()
  .catch((err) => {
    console.error("❌ Verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
