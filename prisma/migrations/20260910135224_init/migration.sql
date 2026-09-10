-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('HOST', 'GUEST');

-- CreateEnum
CREATE TYPE "SplitType" AS ENUM ('EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('ACTIVE', 'LOCKED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "shareCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "currencyMinorUnits" SMALLINT NOT NULL DEFAULT 2,
    "hostTokenHash" TEXT NOT NULL,
    "status" "TripStatus" NOT NULL DEFAULT 'ACTIVE',
    "maxMembers" SMALLINT NOT NULL DEFAULT 25,
    "createdByIpHash" TEXT,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "purgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'GUEST',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "paidByMemberId" TEXT NOT NULL,
    "createdByMemberId" TEXT NOT NULL,
    "splitType" "SplitType" NOT NULL,
    "category" TEXT,
    "notes" TEXT,
    "spentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseSplit" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "shareBps" INTEGER,
    "shareWeight" SMALLINT,

    CONSTRAINT "ExpenseSplit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "fromMemberId" TEXT NOT NULL,
    "toMemberId" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "method" TEXT,
    "note" TEXT,
    "recordedByMemberId" TEXT,
    "confirmedByMemberId" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "actorMemberId" TEXT,
    "action" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Trip_shareCode_key" ON "Trip"("shareCode");

-- CreateIndex
CREATE UNIQUE INDEX "Trip_hostTokenHash_key" ON "Trip"("hostTokenHash");

-- CreateIndex
CREATE INDEX "Trip_expiresAt_idx" ON "Trip"("expiresAt");

-- CreateIndex
CREATE INDEX "Trip_status_expiresAt_idx" ON "Trip"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Member_tokenHash_key" ON "Member"("tokenHash");

-- CreateIndex
CREATE INDEX "Member_tripId_idx" ON "Member"("tripId");

-- CreateIndex
CREATE INDEX "Member_tripId_role_idx" ON "Member"("tripId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "Member_tripId_name_key" ON "Member"("tripId", "name");

-- CreateIndex
CREATE INDEX "Expense_tripId_createdAt_idx" ON "Expense"("tripId", "createdAt");

-- CreateIndex
CREATE INDEX "Expense_paidByMemberId_idx" ON "Expense"("paidByMemberId");

-- CreateIndex
CREATE INDEX "Expense_createdByMemberId_idx" ON "Expense"("createdByMemberId");

-- CreateIndex
CREATE INDEX "ExpenseSplit_memberId_idx" ON "ExpenseSplit"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseSplit_expenseId_memberId_key" ON "ExpenseSplit"("expenseId", "memberId");

-- CreateIndex
CREATE INDEX "Settlement_tripId_status_idx" ON "Settlement"("tripId", "status");

-- CreateIndex
CREATE INDEX "Settlement_fromMemberId_idx" ON "Settlement"("fromMemberId");

-- CreateIndex
CREATE INDEX "Settlement_toMemberId_idx" ON "Settlement"("toMemberId");

-- CreateIndex
CREATE INDEX "ActivityLog_tripId_createdAt_idx" ON "ActivityLog"("tripId", "createdAt");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_paidByMemberId_fkey" FOREIGN KEY ("paidByMemberId") REFERENCES "Member"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_createdByMemberId_fkey" FOREIGN KEY ("createdByMemberId") REFERENCES "Member"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseSplit" ADD CONSTRAINT "ExpenseSplit_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseSplit" ADD CONSTRAINT "ExpenseSplit_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_fromMemberId_fkey" FOREIGN KEY ("fromMemberId") REFERENCES "Member"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_toMemberId_fkey" FOREIGN KEY ("toMemberId") REFERENCES "Member"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_recordedByMemberId_fkey" FOREIGN KEY ("recordedByMemberId") REFERENCES "Member"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_confirmedByMemberId_fkey" FOREIGN KEY ("confirmedByMemberId") REFERENCES "Member"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_actorMemberId_fkey" FOREIGN KEY ("actorMemberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Hand-added: constraints the Prisma schema language cannot express.
-- Keep these when regenerating this migration.
-- ---------------------------------------------------------------------------

-- Money is always positive. A zero-amount expense is a data-entry bug.
ALTER TABLE "Expense"
  ADD CONSTRAINT "Expense_amount_positive" CHECK ("amountMinor" > 0);

-- A split may be zero (a member excluded from this expense) but never negative.
ALTER TABLE "ExpenseSplit"
  ADD CONSTRAINT "ExpenseSplit_amount_nonneg" CHECK ("amountMinor" >= 0),
  ADD CONSTRAINT "ExpenseSplit_bps_range" CHECK ("shareBps" IS NULL OR ("shareBps" >= 0 AND "shareBps" <= 10000)),
  ADD CONSTRAINT "ExpenseSplit_weight_positive" CHECK ("shareWeight" IS NULL OR "shareWeight" > 0);

-- Nobody settles a debt with themselves, and nobody transfers zero.
ALTER TABLE "Settlement"
  ADD CONSTRAINT "Settlement_amount_positive" CHECK ("amountMinor" > 0),
  ADD CONSTRAINT "Settlement_not_self" CHECK ("fromMemberId" <> "toMemberId");

-- ISO-4217 exponents are 0, 2 or 3 in practice.
ALTER TABLE "Trip"
  ADD CONSTRAINT "Trip_minor_units_sane" CHECK ("currencyMinorUnits" IN (0, 2, 3)),
  ADD CONSTRAINT "Trip_max_members_positive" CHECK ("maxMembers" > 0);

-- Exactly one HOST per trip. A partial unique index is the only way to say
-- this in Postgres, and Prisma has no syntax for it.
CREATE UNIQUE INDEX "Member_one_host_per_trip"
  ON "Member" ("tripId") WHERE "role" = 'HOST';

-- ---------------------------------------------------------------------------
-- Hand-added: make every Member-referencing FK DEFERRABLE INITIALLY DEFERRED.
--
-- Why this is required, and why NO ACTION alone is not enough:
--
--   `DELETE FROM "Trip"` cascades to Member, Expense, Settlement and
--   ActivityLog. ExpenseSplit is reached only through Expense's own cascade.
--   Postgres runs each cascade as a nested statement and checks a plain
--   NO ACTION constraint at the end of the statement that triggered it — so
--   when Member rows are removed, ExpenseSplit rows still reference them and
--   the delete aborts. RESTRICT fails the same way, only sooner.
--
--   Deferring the check to COMMIT lets the whole cascade finish first. The
--   protection is retained: deleting a single Member who still has expenses
--   fails at commit rather than at the statement, which is what we want.
-- ---------------------------------------------------------------------------

ALTER TABLE "Expense"
  DROP CONSTRAINT "Expense_paidByMemberId_fkey",
  ADD  CONSTRAINT "Expense_paidByMemberId_fkey"
       FOREIGN KEY ("paidByMemberId") REFERENCES "Member"("id")
       ON DELETE NO ACTION ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
  DROP CONSTRAINT "Expense_createdByMemberId_fkey",
  ADD  CONSTRAINT "Expense_createdByMemberId_fkey"
       FOREIGN KEY ("createdByMemberId") REFERENCES "Member"("id")
       ON DELETE NO ACTION ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "ExpenseSplit"
  DROP CONSTRAINT "ExpenseSplit_memberId_fkey",
  ADD  CONSTRAINT "ExpenseSplit_memberId_fkey"
       FOREIGN KEY ("memberId") REFERENCES "Member"("id")
       ON DELETE NO ACTION ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "Settlement"
  DROP CONSTRAINT "Settlement_fromMemberId_fkey",
  ADD  CONSTRAINT "Settlement_fromMemberId_fkey"
       FOREIGN KEY ("fromMemberId") REFERENCES "Member"("id")
       ON DELETE NO ACTION ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
  DROP CONSTRAINT "Settlement_toMemberId_fkey",
  ADD  CONSTRAINT "Settlement_toMemberId_fkey"
       FOREIGN KEY ("toMemberId") REFERENCES "Member"("id")
       ON DELETE NO ACTION ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
  DROP CONSTRAINT "Settlement_recordedByMemberId_fkey",
  ADD  CONSTRAINT "Settlement_recordedByMemberId_fkey"
       FOREIGN KEY ("recordedByMemberId") REFERENCES "Member"("id")
       ON DELETE NO ACTION ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
  DROP CONSTRAINT "Settlement_confirmedByMemberId_fkey",
  ADD  CONSTRAINT "Settlement_confirmedByMemberId_fkey"
       FOREIGN KEY ("confirmedByMemberId") REFERENCES "Member"("id")
       ON DELETE NO ACTION ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
