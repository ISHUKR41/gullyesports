#!/bin/bash
# GULLYESPORTS SEO Verification Script
# Run this script to verify SEO implementation status

echo "🔍 GULLYESPORTS SEO Verification Tool"
echo "====================================="
echo ""

# Check if running from correct directory
if [ ! -f "dist/index.html" ]; then
    echo "❌ Error: Please run this script from the frontend directory"
    echo "   Current directory: $(pwd)"
    exit 1
fi

echo "✅ Directory structure verified"
echo ""

# Check required files
echo "📋 Checking required SEO files..."
FILES=(
    "dist/sitemap.xml"
    "dist/robots.txt"
    "dist/blog/index.html"
    "dist/blog/how-to-win-bgmi-solo-tournaments.html"
    "dist/blog/free-fire-vs-bgmi-which-game-offers-better-earnings.html"
    "dist/blog/esports-tournaments-india-guide.html"
    "dist/blog/how-to-earn-real-money-from-mobile-gaming-in-india.html"
    "dist/blog/bgmi-sensitivity-settings-for-pro-players.html"
    "dist/blog/free-fire-character-tier-list-best-loadouts.html"
    "dist/blog/cod-mobile-weapon-guide-best-guns-for-tournaments.html"
    "dist/blog/esports-career-path-india-from-player-to-pro.html"
    "dist/blog/how-to-avoid-cheaters-mobile-esports-tournaments.html"
    "dist/blog/mobile-gaming-setup-guide-competitive-play.html"
    "dist/blog/tournament-psychology-how-to-handle-pressure.html"
    "dist/blog/best-mobile-devices-bgmi-free-fire-cod-tournaments.html"
    "dist/blog/how-to-stream-tournament-matches-youtube-twitch.html"
    "dist/blog/esports-tournament-rules-fair-play-guidelines.html"
    "dist/blog/future-mobile-esports-india-trends-predictions.html"
)

MISSING_FILES=0
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (MISSING)"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

echo ""
echo "📊 SEO Implementation Status:"
echo "============================"

# Count blog articles
BLOG_COUNT=$(ls -1 dist/blog/*.html 2>/dev/null | wc -l)
echo "📝 Blog articles created: $BLOG_COUNT/15"

# Check sitemap entries
SITEMAP_ENTRIES=$(grep -c "<loc>" dist/sitemap.xml 2>/dev/null || echo "0")
echo "🗺️  Sitemap entries: $SITEMAP_ENTRIES"

# Check for structured data
STRUCTURED_DATA=$(grep -c "application/ld+json" dist/index.html 2>/dev/null || echo "0")
echo "📊 Structured data implementation: $STRUCTURED_DATA instances"

# Check for PWA elements
SERVICE_WORKER=$(grep -c "serviceWorker" dist/index.html 2>/dev/null || echo "0")
echo "📱 PWA service worker: $SERVICE_WORKER instances"

# Check for Core Web Vitals optimizations
LAZY_LOADING=$(grep -c "loading=\"lazy\"" dist/index.html 2>/dev/null || echo "0")
echo "⚡ Lazy loading implementation: $LAZY_LOADING instances"

echo ""
echo "🚀 Next Steps:"
echo "============="

if [ $MISSING_FILES -eq 0 ] && [ $BLOG_COUNT -ge 15 ]; then
    echo "✅ All files present - Ready for Phase 3 (Search Console Setup)"
    echo "📋 Follow the SEO_PHASE3_GUIDE.md for Google Search Console configuration"
    echo "📈 Expected results: Indexing within 1-2 weeks, rankings improvement in 1-3 months"
else
    echo "⚠️  Some files are missing - Complete Phase 2.1 first"
    echo "📝 Required: 15 blog articles in dist/blog/ directory"
    echo "📄 Check file paths and ensure all HTML files are created"
fi

echo ""
echo "💡 Pro Tips:"
echo "• Submit sitemap.xml to Google Search Console immediately"
echo "• Monitor Core Web Vitals in Search Console dashboard"
echo "• Start content marketing and link building activities"
echo "• Track keyword rankings for 'Gully Esports' and related terms"
echo "• Maintain consistent blog publishing schedule (1-2 articles/week)"

echo ""
echo "🎯 Success Metrics to Track:"
echo "• Indexed pages growth (target: 50+ pages)"
echo "• Organic search impressions increase"
echo "• 'Gully Esports' keyword ranking position"
echo "• Core Web Vitals scores (LCP < 2.5s, CLS < 0.1)"
echo "• Domain Authority improvement to 30+"

echo ""
echo "Complete! Run this script weekly to monitor SEO progress."