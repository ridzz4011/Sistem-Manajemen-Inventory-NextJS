/*
  Warnings:

  - The values [STOCK_ADJUSTMENT] on the enum `ApprovalType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ApprovalType_new" AS ENUM ('NEW_ITEM', 'NEW_VENDOR', 'STOCK_IN', 'STOCK_OUT', 'STOCK_OPNAME');
ALTER TABLE "ApprovalRequest" ALTER COLUMN "type" TYPE "ApprovalType_new" USING ("type"::text::"ApprovalType_new");
ALTER TYPE "ApprovalType" RENAME TO "ApprovalType_old";
ALTER TYPE "ApprovalType_new" RENAME TO "ApprovalType";
DROP TYPE "public"."ApprovalType_old";
COMMIT;
