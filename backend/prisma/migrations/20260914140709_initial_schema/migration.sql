-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subsection" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Subsection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Field" (
    "id" TEXT NOT NULL,
    "subsectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "commentText" TEXT,
    "commentType" TEXT NOT NULL,
    "category" INTEGER,
    "answerType" TEXT,
    "order" INTEGER NOT NULL,
    "options" TEXT,
    "unitOptions" TEXT,
    "recommendation" TEXT,
    "defaultValue" TEXT,
    "defaultValue2" TEXT,
    "defaultUnitType" TEXT,
    "estimateMin" DOUBLE PRECISION,
    "estimateMax" DOUBLE PRECISION,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "simpleFormat" BOOLEAN NOT NULL DEFAULT false,
    "disablePhotos" BOOLEAN NOT NULL DEFAULT false,
    "uses" TEXT,

    CONSTRAINT "Field_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportIssue" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "sourceRow" INTEGER,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sourceData" TEXT,

    CONSTRAINT "ImportIssue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Section_templateId_idx" ON "Section"("templateId");

-- CreateIndex
CREATE INDEX "Subsection_sectionId_idx" ON "Subsection"("sectionId");

-- CreateIndex
CREATE INDEX "Field_subsectionId_idx" ON "Field"("subsectionId");

-- CreateIndex
CREATE INDEX "Photo_fieldId_idx" ON "Photo"("fieldId");

-- CreateIndex
CREATE INDEX "ImportIssue_templateId_idx" ON "ImportIssue"("templateId");

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subsection" ADD CONSTRAINT "Subsection_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Field" ADD CONSTRAINT "Field_subsectionId_fkey" FOREIGN KEY ("subsectionId") REFERENCES "Subsection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportIssue" ADD CONSTRAINT "ImportIssue_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;
