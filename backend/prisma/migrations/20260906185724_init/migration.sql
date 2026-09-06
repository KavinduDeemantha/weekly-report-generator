-- CreateEnum
CREATE TYPE "Role" AS ENUM ('TEAM_MEMBER', 'MANAGER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'NEEDS_CORRECTION', 'APPROVED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ReviewAction" AS ENUM ('REQUEST_CHANGES', 'APPROVED');

-- CreateEnum
CREATE TYPE "TimeEntryType" AS ENUM ('DEVELOPMENT', 'TESTING', 'MEETINGS', 'DOCUMENTATION', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'TEAM_MEMBER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_versions" (
    "id" UUID NOT NULL,
    "reportId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "notes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_tasks" (
    "id" UUID NOT NULL,
    "reportVersionId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "priority" "TaskPriority" NOT NULL,
    "plannedPercentage" INTEGER NOT NULL,
    "actualPercentage" INTEGER NOT NULL,
    "status" "TaskStatus" NOT NULL,
    "plannedHours" DOUBLE PRECISION,
    "actualHours" DOUBLE PRECISION,
    "deliverable" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "next_week_tasks" (
    "id" UUID NOT NULL,
    "reportVersionId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "next_week_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blockers" (
    "id" UUID NOT NULL,
    "reportVersionId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "isKeyIssue" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blockers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" UUID NOT NULL,
    "reportVersionId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "isKeyAchievement" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_entries" (
    "id" UUID NOT NULL,
    "reportVersionId" UUID NOT NULL,
    "type" "TimeEntryType" NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "reportId" UUID NOT NULL,
    "reportVersionId" UUID NOT NULL,
    "reviewerId" UUID NOT NULL,
    "action" "ReviewAction" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "projects_name_key" ON "projects"("name");

-- CreateIndex
CREATE INDEX "projects_isActive_idx" ON "projects"("isActive");

-- CreateIndex
CREATE INDEX "reports_userId_idx" ON "reports"("userId");

-- CreateIndex
CREATE INDEX "reports_projectId_idx" ON "reports"("projectId");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "reports_weekStart_idx" ON "reports"("weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "reports_userId_weekStart_key" ON "reports"("userId", "weekStart");

-- CreateIndex
CREATE INDEX "report_versions_reportId_idx" ON "report_versions"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "report_versions_reportId_versionNumber_key" ON "report_versions"("reportId", "versionNumber");

-- CreateIndex
CREATE INDEX "report_tasks_reportVersionId_idx" ON "report_tasks"("reportVersionId");

-- CreateIndex
CREATE INDEX "next_week_tasks_reportVersionId_idx" ON "next_week_tasks"("reportVersionId");

-- CreateIndex
CREATE INDEX "blockers_reportVersionId_idx" ON "blockers"("reportVersionId");

-- CreateIndex
CREATE INDEX "blockers_isResolved_idx" ON "blockers"("isResolved");

-- CreateIndex
CREATE INDEX "achievements_reportVersionId_idx" ON "achievements"("reportVersionId");

-- CreateIndex
CREATE INDEX "time_entries_reportVersionId_idx" ON "time_entries"("reportVersionId");

-- CreateIndex
CREATE INDEX "reviews_reportId_idx" ON "reviews"("reportId");

-- CreateIndex
CREATE INDEX "reviews_reportVersionId_idx" ON "reviews"("reportVersionId");

-- CreateIndex
CREATE INDEX "reviews_reviewerId_idx" ON "reviews"("reviewerId");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_versions" ADD CONSTRAINT "report_versions_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_tasks" ADD CONSTRAINT "report_tasks_reportVersionId_fkey" FOREIGN KEY ("reportVersionId") REFERENCES "report_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "next_week_tasks" ADD CONSTRAINT "next_week_tasks_reportVersionId_fkey" FOREIGN KEY ("reportVersionId") REFERENCES "report_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blockers" ADD CONSTRAINT "blockers_reportVersionId_fkey" FOREIGN KEY ("reportVersionId") REFERENCES "report_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_reportVersionId_fkey" FOREIGN KEY ("reportVersionId") REFERENCES "report_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_reportVersionId_fkey" FOREIGN KEY ("reportVersionId") REFERENCES "report_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reportVersionId_fkey" FOREIGN KEY ("reportVersionId") REFERENCES "report_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
