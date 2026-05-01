-- AlterTable
ALTER TABLE "Contract" ADD COLUMN "fileMimeType" TEXT;
ALTER TABLE "Contract" ADD COLUMN "fileName" TEXT;
ALTER TABLE "Contract" ADD COLUMN "fileSize" INTEGER;
ALTER TABLE "Contract" ADD COLUMN "originalFileName" TEXT;
ALTER TABLE "Contract" ADD COLUMN "uploadedAt" DATETIME;
