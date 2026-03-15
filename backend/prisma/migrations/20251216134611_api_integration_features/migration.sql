-- CreateEnum
CREATE TYPE "AccessScope" AS ENUM ('CUSTOM', 'FULL_ACCESS', 'READ_ONLY');

-- CreateEnum
CREATE TYPE "TokenStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateTable
CREATE TABLE "api_token" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "token" TEXT NOT NULL,
    "tokenPrefix" TEXT NOT NULL,
    "validityPeriod" INTEGER NOT NULL,
    "accessScope" "AccessScope" NOT NULL DEFAULT 'CUSTOM',
    "status" "TokenStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "api_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_token_permissions" (
    "id" TEXT NOT NULL,
    "apiTokenId" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_token_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_token_usage_log" (
    "id" TEXT NOT NULL,
    "apiTokenId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "ipAddress" TEXT,
    "statusCode" INTEGER NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_token_usage_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_token_token_key" ON "api_token"("token");

-- CreateIndex
CREATE INDEX "api_token_organizationId_idx" ON "api_token"("organizationId");

-- CreateIndex
CREATE INDEX "api_token_status_idx" ON "api_token"("status");

-- CreateIndex
CREATE INDEX "api_token_token_idx" ON "api_token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "api_token_organizationId_name_key" ON "api_token"("organizationId", "name");

-- CreateIndex
CREATE INDEX "api_token_permissions_apiTokenId_idx" ON "api_token_permissions"("apiTokenId");

-- CreateIndex
CREATE UNIQUE INDEX "api_token_permissions_apiTokenId_resource_action_key" ON "api_token_permissions"("apiTokenId", "resource", "action");

-- CreateIndex
CREATE INDEX "api_token_usage_log_apiTokenId_idx" ON "api_token_usage_log"("apiTokenId");

-- CreateIndex
CREATE INDEX "api_token_usage_log_createdAt_idx" ON "api_token_usage_log"("createdAt");

-- AddForeignKey
ALTER TABLE "api_token" ADD CONSTRAINT "api_token_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_token_permissions" ADD CONSTRAINT "api_token_permissions_apiTokenId_fkey" FOREIGN KEY ("apiTokenId") REFERENCES "api_token"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_token_usage_log" ADD CONSTRAINT "api_token_usage_log_apiTokenId_fkey" FOREIGN KEY ("apiTokenId") REFERENCES "api_token"("id") ON DELETE CASCADE ON UPDATE CASCADE;
