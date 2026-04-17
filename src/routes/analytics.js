const router = require('express').Router();
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

// GET /api/analytics/overview
router.get('/overview', requireAuth, async (req, res) => {
  const { days = 30 } = req.query;
  const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000).toISOString();

  try {
    const [eventsRes, leadsRes, totalEventsRes] = await Promise.all([
      // Events in period grouped by type
      supabase.from('analytics_events')
        .select('event_type')
        .gte('created_at', since),
      // Leads in period
      supabase.from('leads')
        .select('id, created_at')
        .gte('created_at', since),
      // All time total
      supabase.from('analytics_events').select('id', { count: 'exact', head: true }),
    ]);

    const events = eventsRes.data || [];
    const leads = leadsRes.data || [];

    // Aggregate by type
    const byType = {};
    events.forEach(e => { byType[e.event_type] = (byType[e.event_type] || 0) + 1; });

    res.json({
      period_days: Number(days),
      total_events: events.length,
      all_time_events: totalEventsRes.count || 0,
      leads_count: leads.length,
      by_type: byType,
      book_clicks: byType['book_click'] || 0,
      call_clicks: byType['call_click'] || 0,
      instagram_clicks: byType['instagram_click'] || 0,
      form_submits: byType['form_submit'] || 0,
    });
  } catch (err) {
    console.error('analytics error:', err);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

// GET /api/analytics/events (paginated event log)
router.get('/events', requireAuth, async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  const { data, error, count } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, count });
});

module.exports = router;
