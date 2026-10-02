-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "title" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "previousState" TEXT,
    "newState" TEXT,
    "metadata" TEXT
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "dateOfBirth" DATETIME NOT NULL,
    "accountCreatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "KycCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "reasonFlagged" TEXT NOT NULL,
    "assignedAnalystId" TEXT,
    "identityVerification" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentStatus" TEXT NOT NULL,
    "addressVerification" TEXT NOT NULL,
    "sanctionsScreening" TEXT NOT NULL,
    "pepScreening" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KycCase_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "KycCase_assignedAnalystId_fkey" FOREIGN KEY ("assignedAnalystId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RiskFactor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "description" TEXT,
    CONSTRAINT "RiskFactor_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "KycCase" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "AuditEvent_resourceType_resourceId_idx" ON "AuditEvent"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "AuditEvent_timestamp_idx" ON "AuditEvent"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "KycCase_customerId_key" ON "KycCase"("customerId");

-- CreateIndex
CREATE INDEX "KycCase_status_idx" ON "KycCase"("status");

-- CreateIndex
CREATE INDEX "KycCase_riskLevel_idx" ON "KycCase"("riskLevel");

-- Audit events are append-only: the database itself rejects edits and deletes.
CREATE TRIGGER "AuditEvent_no_update" BEFORE UPDATE ON "AuditEvent"
BEGIN
  SELECT RAISE(ABORT, 'AuditEvent rows are immutable');
END;

CREATE TRIGGER "AuditEvent_no_delete" BEFORE DELETE ON "AuditEvent"
BEGIN
  SELECT RAISE(ABORT, 'AuditEvent rows are immutable');
END;
