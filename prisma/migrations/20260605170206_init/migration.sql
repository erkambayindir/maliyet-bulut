-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "calculationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "kdvRate" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "generalMarkup" DECIMAL(5,2) NOT NULL DEFAULT 25,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PozLibrary" (
    "id" TEXT NOT NULL,
    "pozNo" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL(18,4) NOT NULL,
    "year" TEXT NOT NULL,
    "institutionName" TEXT NOT NULL,
    "fascicleName" TEXT,

    CONSTRAINT "PozLibrary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectPoz" (
    "id" TEXT NOT NULL,
    "pozNo" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(18,4) NOT NULL,
    "customPrice" DECIMAL(18,4),
    "markupPercent" DECIMAL(5,2) NOT NULL DEFAULT 25.0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "workGroupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectPoz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetrajRow" (
    "id" TEXT NOT NULL,
    "projectPozId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "adet" DECIMAL(18,4) NOT NULL DEFAULT 1,
    "en" DECIMAL(18,4) NOT NULL DEFAULT 1,
    "boy" DECIMAL(18,4) NOT NULL DEFAULT 1,
    "yukseklik" DECIMAL(18,4) NOT NULL DEFAULT 1,
    "computedQty" DECIMAL(18,4) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetrajRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemirajRow" (
    "id" TEXT NOT NULL,
    "projectPozId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cap" INTEGER NOT NULL,
    "uzunluk" DECIMAL(18,4) NOT NULL,
    "adet" DECIMAL(18,4) NOT NULL,
    "weightPerMeter" DECIMAL(18,6) NOT NULL,
    "computedKg" DECIMAL(18,4) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemirajRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisItem" (
    "id" TEXT NOT NULL,
    "parentPozId" TEXT NOT NULL,
    "childPozId" TEXT NOT NULL,
    "quantityFactor" DECIMAL(18,6) NOT NULL,
    "unit" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AnalysisItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PozLibrary_pozNo_idx" ON "PozLibrary"("pozNo");

-- CreateIndex
CREATE INDEX "PozLibrary_institutionName_year_idx" ON "PozLibrary"("institutionName", "year");

-- CreateIndex
CREATE UNIQUE INDEX "PozLibrary_pozNo_year_institutionName_key" ON "PozLibrary"("pozNo", "year", "institutionName");

-- AddForeignKey
ALTER TABLE "WorkGroup" ADD CONSTRAINT "WorkGroup_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "WorkGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkGroup" ADD CONSTRAINT "WorkGroup_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPoz" ADD CONSTRAINT "ProjectPoz_workGroupId_fkey" FOREIGN KEY ("workGroupId") REFERENCES "WorkGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetrajRow" ADD CONSTRAINT "MetrajRow_projectPozId_fkey" FOREIGN KEY ("projectPozId") REFERENCES "ProjectPoz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemirajRow" ADD CONSTRAINT "DemirajRow_projectPozId_fkey" FOREIGN KEY ("projectPozId") REFERENCES "ProjectPoz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisItem" ADD CONSTRAINT "AnalysisItem_parentPozId_fkey" FOREIGN KEY ("parentPozId") REFERENCES "PozLibrary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisItem" ADD CONSTRAINT "AnalysisItem_childPozId_fkey" FOREIGN KEY ("childPozId") REFERENCES "PozLibrary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
