-- AlterTable: Add period column to registration_categories
ALTER TABLE "registration_categories" ADD COLUMN "period" TEXT NOT NULL DEFAULT 'early_bird';
