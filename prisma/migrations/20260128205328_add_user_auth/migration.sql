-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "isim" TEXT NOT NULL,
    "aciklama" TEXT,
    "bakiye" REAL NOT NULL DEFAULT 0,
    "durum" TEXT NOT NULL DEFAULT 'AKTIF',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Portfolio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PortfolioPosition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "portfolioId" TEXT NOT NULL,
    "hisseKod" TEXT NOT NULL,
    "hisseAd" TEXT,
    "adet" REAL NOT NULL,
    "alimFiyati" REAL NOT NULL,
    "toplamMaliyet" REAL NOT NULL,
    "guncelFiyat" REAL,
    "guncelDeger" REAL,
    "karZarar" REAL,
    "karZararYuzde" REAL,
    "alimTarihi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "satistami" BOOLEAN NOT NULL DEFAULT false,
    "satisTarihi" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PortfolioPosition_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PortfolioTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "portfolioId" TEXT NOT NULL,
    "hisseKod" TEXT NOT NULL,
    "islemTipi" TEXT NOT NULL,
    "adet" REAL NOT NULL,
    "fiyat" REAL NOT NULL,
    "toplam" REAL NOT NULL,
    "not" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PortfolioTransaction_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Watchlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "isim" TEXT NOT NULL,
    "aciklama" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WatchlistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "watchlistId" TEXT NOT NULL,
    "hisseKod" TEXT NOT NULL,
    "hisseAd" TEXT,
    "hedefFiyat" REAL,
    "alarmFiyat" REAL,
    "notlar" TEXT,
    "eklenmeTarihi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WatchlistItem_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "Watchlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Portfolio_durum_idx" ON "Portfolio"("durum");

-- CreateIndex
CREATE INDEX "Portfolio_userId_idx" ON "Portfolio"("userId");

-- CreateIndex
CREATE INDEX "PortfolioPosition_portfolioId_idx" ON "PortfolioPosition"("portfolioId");

-- CreateIndex
CREATE INDEX "PortfolioPosition_hisseKod_idx" ON "PortfolioPosition"("hisseKod");

-- CreateIndex
CREATE INDEX "PortfolioPosition_satistami_idx" ON "PortfolioPosition"("satistami");

-- CreateIndex
CREATE INDEX "PortfolioTransaction_portfolioId_idx" ON "PortfolioTransaction"("portfolioId");

-- CreateIndex
CREATE INDEX "PortfolioTransaction_hisseKod_idx" ON "PortfolioTransaction"("hisseKod");

-- CreateIndex
CREATE INDEX "PortfolioTransaction_createdAt_idx" ON "PortfolioTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "Watchlist_userId_idx" ON "Watchlist"("userId");

-- CreateIndex
CREATE INDEX "WatchlistItem_watchlistId_idx" ON "WatchlistItem"("watchlistId");

-- CreateIndex
CREATE INDEX "WatchlistItem_hisseKod_idx" ON "WatchlistItem"("hisseKod");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistItem_watchlistId_hisseKod_key" ON "WatchlistItem"("watchlistId", "hisseKod");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");
