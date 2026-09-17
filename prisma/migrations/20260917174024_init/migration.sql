-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('PENDING', 'ISSUED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CheckInStatus" AS ENUM ('NOT_CHECKED_IN', 'CHECKED_IN');

-- CreateEnum
CREATE TYPE "SpeakerRole" AS ENUM ('KEYNOTE', 'SPEAKER', 'PANELIST');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('CONFERENCE', 'KEYNOTE', 'PANEL', 'WORKSHOP', 'NETWORKING', 'BREAK', 'AFTER_PARTY', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('PAYSTACK', 'MANUAL');

-- CreateEnum
CREATE TYPE "PaymentRecordStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "registration_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "price" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registration_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendees" (
    "id" TEXT NOT NULL,
    "attendeeId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "organisation" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentReference" TEXT,
    "paymentAmount" DOUBLE PRECISION,
    "paymentCurrency" TEXT NOT NULL DEFAULT 'NGN',
    "paidAt" TIMESTAMP(3),
    "ticketReference" TEXT,
    "ticketStatus" "TicketStatus" NOT NULL DEFAULT 'PENDING',
    "checkInStatus" "CheckInStatus" NOT NULL DEFAULT 'NOT_CHECKED_IN',
    "checkInTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "attendeeId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'PAYSTACK',
    "reference" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "PaymentRecordStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "rawPayload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "attendeeId" TEXT NOT NULL,
    "ticketReference" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'PENDING',
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_ins" (
    "id" TEXT NOT NULL,
    "attendeeId" TEXT NOT NULL,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedInBy" TEXT,
    "device" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "speakers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "organisation" TEXT NOT NULL DEFAULT '',
    "biography" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT,
    "role" "SpeakerRole" NOT NULL DEFAULT 'SPEAKER',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "speakers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programme_sessions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "sessionType" "SessionType" NOT NULL DEFAULT 'OTHER',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programme_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faqs" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attendees_attendeeId_key" ON "attendees"("attendeeId");

-- CreateIndex
CREATE UNIQUE INDEX "attendees_email_key" ON "attendees"("email");

-- CreateIndex
CREATE UNIQUE INDEX "attendees_paymentReference_key" ON "attendees"("paymentReference");

-- CreateIndex
CREATE UNIQUE INDEX "attendees_ticketReference_key" ON "attendees"("ticketReference");

-- CreateIndex
CREATE INDEX "attendees_email_idx" ON "attendees"("email");

-- CreateIndex
CREATE INDEX "attendees_attendeeId_idx" ON "attendees"("attendeeId");

-- CreateIndex
CREATE INDEX "attendees_paymentReference_idx" ON "attendees"("paymentReference");

-- CreateIndex
CREATE INDEX "attendees_ticketReference_idx" ON "attendees"("ticketReference");

-- CreateIndex
CREATE INDEX "attendees_categoryId_idx" ON "attendees"("categoryId");

-- CreateIndex
CREATE INDEX "attendees_paymentStatus_idx" ON "attendees"("paymentStatus");

-- CreateIndex
CREATE INDEX "attendees_checkInStatus_idx" ON "attendees"("checkInStatus");

-- CreateIndex
CREATE UNIQUE INDEX "payments_attendeeId_key" ON "payments"("attendeeId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_reference_key" ON "payments"("reference");

-- CreateIndex
CREATE INDEX "payments_reference_idx" ON "payments"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_attendeeId_key" ON "tickets"("attendeeId");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_ticketReference_key" ON "tickets"("ticketReference");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_qrToken_key" ON "tickets"("qrToken");

-- CreateIndex
CREATE INDEX "tickets_qrToken_idx" ON "tickets"("qrToken");

-- CreateIndex
CREATE INDEX "tickets_ticketReference_idx" ON "tickets"("ticketReference");

-- CreateIndex
CREATE UNIQUE INDEX "check_ins_attendeeId_key" ON "check_ins"("attendeeId");

-- CreateIndex
CREATE INDEX "check_ins_attendeeId_idx" ON "check_ins"("attendeeId");

-- CreateIndex
CREATE INDEX "speakers_role_idx" ON "speakers"("role");

-- CreateIndex
CREATE INDEX "speakers_displayOrder_idx" ON "speakers"("displayOrder");

-- CreateIndex
CREATE INDEX "speakers_active_idx" ON "speakers"("active");

-- CreateIndex
CREATE INDEX "programme_sessions_displayOrder_idx" ON "programme_sessions"("displayOrder");

-- CreateIndex
CREATE INDEX "programme_sessions_active_idx" ON "programme_sessions"("active");

-- CreateIndex
CREATE INDEX "faqs_displayOrder_idx" ON "faqs"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- AddForeignKey
ALTER TABLE "attendees" ADD CONSTRAINT "attendees_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "registration_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES "attendees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES "attendees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES "attendees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
