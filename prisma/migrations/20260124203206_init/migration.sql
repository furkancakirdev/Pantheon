-- CreateTable
CREATE TABLE "Stock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kod" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "sektor" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Fundamental" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stockId" INTEGER NOT NULL,
    "kapanis" REAL,
    "fk" REAL,
    "pddd" REAL,
    "fdFavok" REAL,
    "roe" REAL,
    "borcOzkaynak" REAL,
    "piyasaDegeri" REAL,
    "yabanciOran" REAL,
    "tarih" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Fundamental_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Score" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stockId" INTEGER NOT NULL,
    "erdincSkor" INTEGER,
    "wonderkidSkor" INTEGER,
    "teknikSinyal" TEXT,
    "gerekceler" TEXT,
    "uyarilar" TEXT,
    "tarih" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Score_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Fund" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kod" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "tur" TEXT,
    "kurucu" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FundReturn" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fundId" INTEGER NOT NULL,
    "gunlukGetiri" REAL,
    "haftalikGetiri" REAL,
    "aylikGetiri" REAL,
    "yillikGetiri" REAL,
    "fonBuyuklugu" REAL,
    "tarih" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FundReturn_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SentimentData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kaynak" TEXT NOT NULL,
    "hesap" TEXT,
    "icerik" TEXT NOT NULL,
    "skor" REAL,
    "label" TEXT,
    "ilgiliHisse" TEXT,
    "tarih" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stockId" INTEGER,
    "tip" TEXT NOT NULL,
    "baslik" TEXT NOT NULL,
    "mesaj" TEXT NOT NULL,
    "okundu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Alert_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketSnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "xu100" REAL,
    "xu100Degisim" REAL,
    "xu030" REAL,
    "xu030Degisim" REAL,
    "dolarTry" REAL,
    "euroTry" REAL,
    "altin" REAL,
    "tarih" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stockKod" TEXT NOT NULL,
    "moduleName" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "details" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Analysis_stockKod_fkey" FOREIGN KEY ("stockKod") REFERENCES "Stock" ("kod") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CouncilDecision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stockKod" TEXT NOT NULL,
    "finalVerdict" TEXT NOT NULL,
    "consensus" INTEGER NOT NULL,
    "votes" JSONB NOT NULL,
    "aiExplanation" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CouncilDecision_stockKod_fkey" FOREIGN KEY ("stockKod") REFERENCES "Stock" ("kod") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Stock_kod_key" ON "Stock"("kod");

-- CreateIndex
CREATE INDEX "Fundamental_stockId_tarih_idx" ON "Fundamental"("stockId", "tarih");

-- CreateIndex
CREATE INDEX "Score_stockId_tarih_idx" ON "Score"("stockId", "tarih");

-- CreateIndex
CREATE UNIQUE INDEX "Fund_kod_key" ON "Fund"("kod");

-- CreateIndex
CREATE INDEX "FundReturn_fundId_tarih_idx" ON "FundReturn"("fundId", "tarih");

-- CreateIndex
CREATE INDEX "SentimentData_kaynak_tarih_idx" ON "SentimentData"("kaynak", "tarih");

-- CreateIndex
CREATE INDEX "SentimentData_ilgiliHisse_idx" ON "SentimentData"("ilgiliHisse");

-- CreateIndex
CREATE INDEX "Alert_okundu_createdAt_idx" ON "Alert"("okundu", "createdAt");

-- CreateIndex
CREATE INDEX "MarketSnapshot_tarih_idx" ON "MarketSnapshot"("tarih");

-- CreateIndex
CREATE INDEX "Analysis_stockKod_moduleName_idx" ON "Analysis"("stockKod", "moduleName");

-- CreateIndex
CREATE INDEX "Analysis_createdAt_idx" ON "Analysis"("createdAt");

-- CreateIndex
CREATE INDEX "CouncilDecision_stockKod_idx" ON "CouncilDecision"("stockKod");

-- CreateIndex
CREATE INDEX "CouncilDecision_createdAt_idx" ON "CouncilDecision"("createdAt");
