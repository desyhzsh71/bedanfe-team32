-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('SINGLE_PAGE', 'MULTIPLE_PAGE');

-- CreateTable
CREATE TABLE "workflow" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relatedTo" TEXT NOT NULL,
    "keyApprovalStage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_stage" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "highlightColor" TEXT NOT NULL DEFAULT '#E91E63',
    "rolesAllowed" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_stage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_assignment" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "singlePageId" TEXT,
    "multiplePageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_workflow_stage" (
    "id" TEXT NOT NULL,
    "workflowStageId" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "contentId" TEXT NOT NULL,
    "approvedBy" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_workflow_stage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workflow_organizationId_idx" ON "workflow"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_organizationId_name_key" ON "workflow"("organizationId", "name");

-- CreateIndex
CREATE INDEX "workflow_stage_workflowId_idx" ON "workflow_stage"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_stage_workflowId_name_key" ON "workflow_stage"("workflowId", "name");

-- CreateIndex
CREATE INDEX "workflow_assignment_workflowId_idx" ON "workflow_assignment"("workflowId");

-- CreateIndex
CREATE INDEX "workflow_assignment_singlePageId_idx" ON "workflow_assignment"("singlePageId");

-- CreateIndex
CREATE INDEX "workflow_assignment_multiplePageId_idx" ON "workflow_assignment"("multiplePageId");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_assignment_workflowId_singlePageId_key" ON "workflow_assignment"("workflowId", "singlePageId");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_assignment_workflowId_multiplePageId_key" ON "workflow_assignment"("workflowId", "multiplePageId");

-- CreateIndex
CREATE INDEX "content_workflow_stage_workflowStageId_idx" ON "content_workflow_stage"("workflowStageId");

-- CreateIndex
CREATE INDEX "content_workflow_stage_contentType_contentId_idx" ON "content_workflow_stage"("contentType", "contentId");

-- CreateIndex
CREATE UNIQUE INDEX "content_workflow_stage_contentType_contentId_key" ON "content_workflow_stage"("contentType", "contentId");

-- AddForeignKey
ALTER TABLE "workflow" ADD CONSTRAINT "workflow_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_stage" ADD CONSTRAINT "workflow_stage_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_assignment" ADD CONSTRAINT "workflow_assignment_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_assignment" ADD CONSTRAINT "workflow_assignment_singlePageId_fkey" FOREIGN KEY ("singlePageId") REFERENCES "single_page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_assignment" ADD CONSTRAINT "workflow_assignment_multiplePageId_fkey" FOREIGN KEY ("multiplePageId") REFERENCES "multiple_page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_workflow_stage" ADD CONSTRAINT "content_workflow_stage_workflowStageId_fkey" FOREIGN KEY ("workflowStageId") REFERENCES "workflow_stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_workflow_stage" ADD CONSTRAINT "content_workflow_stage_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
