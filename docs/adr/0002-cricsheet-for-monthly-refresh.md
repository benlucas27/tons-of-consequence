# Use Cricsheet, not ESPNcricinfo Statsguru, as the monthly data source for new centuries

The original ~4,600-innings dataset was scraped from ESPNcricinfo Statsguru, so continuing to scrape Statsguru for new centuries was the obvious next move. It was rejected: Statsguru has no open data license, scraping it monthly forever carries an ongoing ToS/bot-blocking risk, and its HTML table format is exactly the kind of scrape-fragile source that produced this codebase's earlier mojibake encoding bugs.

Chose [Cricsheet](https://cricsheet.org) instead — ball-by-ball match data published under an explicit open-reuse license, as clean JSON, with no scraping involved. Verified live before committing to it: downloaded the current Test archive and confirmed it correctly surfaces real recent centuries (29 found in the gap since the static dataset's cutoff).

**Considered and rejected**: Wikipedia's century list pages (sorted by score rather than date, and missing ball-by-ball detail like balls faced, making "what's new since last month" and strike-rate-based scoring harder).

**Consequences**: the monthly pipeline computes centuries from raw deliveries (summing a batter's runs and balls faced per innings) rather than reading a pre-aggregated stat, which is more code but has no dependency on a third party's own scraping or licensing risk.
