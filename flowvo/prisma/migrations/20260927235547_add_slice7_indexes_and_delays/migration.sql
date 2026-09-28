-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Business" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "googleReviewUrl" TEXT,
    "paymentDetails" TEXT,
    "quoteFollowUpDelayDays" INTEGER NOT NULL DEFAULT 3,
    "reviewReminderDelayDays" INTEGER NOT NULL DEFAULT 4,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Business" ("createdAt", "email", "googleReviewUrl", "id", "name", "paymentDetails", "phone", "slug", "updatedAt") SELECT "createdAt", "email", "googleReviewUrl", "id", "name", "paymentDetails", "phone", "slug", "updatedAt" FROM "Business";
DROP TABLE "Business";
ALTER TABLE "new_Business" RENAME TO "Business";
CREATE UNIQUE INDEX "Business_slug_key" ON "Business"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Invoice_businessId_status_dueDate_idx" ON "Invoice"("businessId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "Job_businessId_status_scheduledDate_idx" ON "Job"("businessId", "status", "scheduledDate");

-- CreateIndex
CREATE INDEX "Lead_businessId_status_idx" ON "Lead"("businessId", "status");

-- CreateIndex
CREATE INDEX "Quote_businessId_status_sentAt_idx" ON "Quote"("businessId", "status", "sentAt");

-- CreateIndex
CREATE INDEX "ReviewRequest_businessId_status_sentAt_idx" ON "ReviewRequest"("businessId", "status", "sentAt");
