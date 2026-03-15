/*
  Warnings:

  - A unique constraint covering the columns `[customDomain]` on the table `project` will be added. If there are existing duplicate values, this will fail.
  - Made the column `createdAt` on table `organization` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `organization` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `organization_member` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `organization_member` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProjectRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER', 'SEO_MANAGER', 'COLLABORATOR');

-- AlterTable
ALTER TABLE "organization" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "organization_member" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "project" ADD COLUMN     "customDomain" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "project_collaborator" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" "ProjectRole" NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_collaborator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_collaborator_projectId_idx" ON "project_collaborator"("projectId");

-- CreateIndex
CREATE INDEX "project_collaborator_userId_idx" ON "project_collaborator"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "project_collaborator_projectId_userId_key" ON "project_collaborator"("projectId", "userId");

-- CreateIndex
CREATE INDEX "organization_ownerId_idx" ON "organization"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "project_customDomain_key" ON "project"("customDomain");

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_collaborator" ADD CONSTRAINT "project_collaborator_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_collaborator" ADD CONSTRAINT "project_collaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
