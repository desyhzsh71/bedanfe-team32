/*
  Warnings:

  - The values [SEO_MANAGER,COLLABORATOR] on the enum `ProjectRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProjectRole_new" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'EDITOR', 'REVIEWER', 'AUTHOR', 'CONTRIBUTOR', 'VIEWER');
ALTER TABLE "project_collaborator" ALTER COLUMN "role" TYPE "ProjectRole_new" USING ("role"::text::"ProjectRole_new");
ALTER TYPE "ProjectRole" RENAME TO "ProjectRole_old";
ALTER TYPE "ProjectRole_new" RENAME TO "ProjectRole";
DROP TYPE "public"."ProjectRole_old";
COMMIT;

-- AlterTable
ALTER TABLE "media_folders" ALTER COLUMN "parentId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "project" ALTER COLUMN "organizationId" DROP NOT NULL;
