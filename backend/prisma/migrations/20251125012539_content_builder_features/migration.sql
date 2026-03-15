-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('TEXT', 'RICH_TEXT', 'NUMBER', 'DATE_TIME', 'MEDIA', 'LOCATION', 'RELATION', 'MULTIPLE_CONTENT', 'BOOLEAN', 'SELECT', 'JSON');

-- CreateTable
CREATE TABLE "single_page" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiId" TEXT NOT NULL,
    "multiLanguage" BOOLEAN NOT NULL DEFAULT false,
    "seoEnabled" BOOLEAN NOT NULL DEFAULT false,
    "workflowEnabled" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "single_page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "multiple_page" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiId" TEXT NOT NULL,
    "multiLanguage" BOOLEAN NOT NULL DEFAULT false,
    "seoEnabled" BOOLEAN NOT NULL DEFAULT false,
    "workflowEnabled" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "multiple_page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "component" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "component_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiId" TEXT NOT NULL,
    "type" "FieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "unique" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "singlePageId" TEXT,
    "multiplePageId" TEXT,
    "componentId" TEXT,
    "validations" JSONB,
    "defaultValue" JSONB,
    "options" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "single_page_content" (
    "id" TEXT NOT NULL,
    "singlePageId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "locale" TEXT DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "single_page_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "multiple_page_entry" (
    "id" TEXT NOT NULL,
    "multiplePageId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "locale" TEXT DEFAULT 'en',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "multiple_page_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "single_page_projectId_idx" ON "single_page"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "single_page_projectId_apiId_key" ON "single_page"("projectId", "apiId");

-- CreateIndex
CREATE INDEX "multiple_page_projectId_idx" ON "multiple_page"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "multiple_page_projectId_apiId_key" ON "multiple_page"("projectId", "apiId");

-- CreateIndex
CREATE INDEX "component_projectId_idx" ON "component"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "component_projectId_apiId_key" ON "component"("projectId", "apiId");

-- CreateIndex
CREATE INDEX "field_singlePageId_idx" ON "field"("singlePageId");

-- CreateIndex
CREATE INDEX "field_multiplePageId_idx" ON "field"("multiplePageId");

-- CreateIndex
CREATE INDEX "field_componentId_idx" ON "field"("componentId");

-- CreateIndex
CREATE UNIQUE INDEX "single_page_content_singlePageId_key" ON "single_page_content"("singlePageId");

-- CreateIndex
CREATE INDEX "multiple_page_entry_multiplePageId_idx" ON "multiple_page_entry"("multiplePageId");

-- AddForeignKey
ALTER TABLE "single_page" ADD CONSTRAINT "single_page_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multiple_page" ADD CONSTRAINT "multiple_page_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component" ADD CONSTRAINT "component_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field" ADD CONSTRAINT "field_singlePageId_fkey" FOREIGN KEY ("singlePageId") REFERENCES "single_page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field" ADD CONSTRAINT "field_multiplePageId_fkey" FOREIGN KEY ("multiplePageId") REFERENCES "multiple_page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field" ADD CONSTRAINT "field_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "component"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "single_page_content" ADD CONSTRAINT "single_page_content_singlePageId_fkey" FOREIGN KEY ("singlePageId") REFERENCES "single_page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multiple_page_entry" ADD CONSTRAINT "multiple_page_entry_multiplePageId_fkey" FOREIGN KEY ("multiplePageId") REFERENCES "multiple_page"("id") ON DELETE CASCADE ON UPDATE CASCADE;
