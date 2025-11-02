-- CreateIndex
CREATE INDEX "News_link_idx" ON "News"("link");

-- CreateIndex
CREATE INDEX "News_posted_idx" ON "News"("posted");

-- CreateIndex
CREATE INDEX "News_link_posted_idx" ON "News"("link", "posted");

-- CreateIndex
CREATE INDEX "RssSource_active_idx" ON "RssSource"("active");
