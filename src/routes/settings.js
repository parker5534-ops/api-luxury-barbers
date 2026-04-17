const router = require('express').Router();
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

// GET /api/settings (admin — returns all settings including analytics IDs)
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('site_settings').select('key, value').order('key');
  if (error) return res.status(500).json({ error: error.message });
  const map = {};
  (data || []).forEach(s => { map[s.key] = s.value; });
  res.json(map);
});

// PUT /api/settings (admin — upsert multiple keys at once)
router.put('/', requireAuth, async (req, res) => {
  const updates = req.body; // { key: value, key: value, ... }
  if (!updates || typeof updates !== 'object') return res.status(400).json({ error: 'Invalid payload' });

  const rows = Object.entries(updates).map(([key, value]) => ({
    key,
    value: value === null || value === undefined ? '' : String(value),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('site_settings')
    .upsert(rows, { onConflict: 'key' });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// PUT /api/settings/:key (admin — update single key)
router.put('/:key', requireAuth, async (req, res) => {
  const { value } = req.body;
  const { data, error } = await supabase
    .from('site_settings')
    .upsert({ key: req.params.key, value: String(value ?? ''), updated_at: new Date().toISOString() }, { onConflict: 'key' })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
