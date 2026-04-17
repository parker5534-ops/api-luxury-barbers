const router = require('express').Router();
const supabase = require('../lib/supabase');

const ALLOWED_EVENTS = ['book_click', 'call_click', 'instagram_click', 'facebook_click', 'tiktok_click', 'form_submit', 'gallery_view', 'page_view'];

// POST /api/track/event  (public — no auth)
router.post('/event', async (req, res) => {
  const { event_type, event_source, session_id, metadata } = req.body;

  if (!event_type || !ALLOWED_EVENTS.includes(event_type)) {
    return res.status(400).json({ error: 'Invalid event type' });
  }

  // Fire and forget — respond immediately, save in background
  res.json({ success: true });

  supabase.from('analytics_events').insert({
    event_type,
    event_source,
    session_id,
    metadata: metadata || null,
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
  }).then(() => {}).catch(console.error);
});

module.exports = router;
