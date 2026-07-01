-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED');

-- AlterTable
ALTER TABLE "Partner" ADD COLUMN     "category" TEXT,
ADD COLUMN     "contactPerson" TEXT,
ADD COLUMN     "joinedDate" TEXT DEFAULT '-',
ADD COLUMN     "products" TEXT,
ADD COLUMN     "rating" DOUBLE PRECISION DEFAULT 0.0,
ADD COLUMN     "status" "PartnerStatus" NOT NULL DEFAULT 'PENDING';
