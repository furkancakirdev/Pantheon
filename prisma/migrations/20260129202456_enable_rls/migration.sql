-- Enable Row Level Security on all tables
-- Pantheon Trading OS - Public Read-Only Policies

ALTER TABLE "Fundamental" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FundReturn" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Analysis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Stock" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Score" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Fund" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SentimentData" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MarketSnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Alert" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Portfolio" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PortfolioPosition" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PortfolioTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Watchlist" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WatchlistItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CouncilDecision" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Public Read-Only Policies
-- Anyone can READ data, but no one can MODIFY through API

CREATE POLICY "Public read Fundamental" ON "Fundamental" FOR SELECT USING (true);
CREATE POLICY "Public read FundReturn" ON "FundReturn" FOR SELECT USING (true);
CREATE POLICY "Public read Analysis" ON "Analysis" FOR SELECT USING (true);
CREATE POLICY "Public read Stock" ON "Stock" FOR SELECT USING (true);
CREATE POLICY "Public read Score" ON "Score" FOR SELECT USING (true);
CREATE POLICY "Public read Fund" ON "Fund" FOR SELECT USING (true);
CREATE POLICY "Public read SentimentData" ON "SentimentData" FOR SELECT USING (true);
CREATE POLICY "Public read MarketSnapshot" ON "MarketSnapshot" FOR SELECT USING (true);
CREATE POLICY "Public read Alert" ON "Alert" FOR SELECT USING (true);
CREATE POLICY "Public read Portfolio" ON "Portfolio" FOR SELECT USING (true);
CREATE POLICY "Public read PortfolioPosition" ON "PortfolioPosition" FOR SELECT USING (true);
CREATE POLICY "Public read PortfolioTransaction" ON "PortfolioTransaction" FOR SELECT USING (true);
CREATE POLICY "Public read Watchlist" ON "Watchlist" FOR SELECT USING (true);
CREATE POLICY "Public read WatchlistItem" ON "WatchlistItem" FOR SELECT USING (true);
CREATE POLICY "Public read CouncilDecision" ON "CouncilDecision" FOR SELECT USING (true);

-- User table policies (anyone can register, read, update)
CREATE POLICY "Public read User" ON "User" FOR SELECT USING (true);
CREATE POLICY "User insert" ON "User" FOR INSERT WITH CHECK (true);
CREATE POLICY "User update own" ON "User" FOR UPDATE USING (true);

-- Session table policies (for authentication)
CREATE POLICY "Public read Session" ON "Session" FOR SELECT USING (true);
CREATE POLICY "Session insert" ON "Session" FOR INSERT WITH CHECK (true);
CREATE POLICY "Session delete own" ON "Session" FOR DELETE USING (true);
