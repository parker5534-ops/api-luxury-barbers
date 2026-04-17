const router = require('express').Router();
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

// GET /api/services (public)
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('services').select('*').eq('is_active', true).order('sort_order');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/services/all (admin - includes inactive)
router.get('/all', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('services').select('*').order('sort_order');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/services (admin)
router.post('/', requireAuth, async (req, res) => {
  const { name, price, duration, description, category, sort_order } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Name and price required' });
  const { data, error } = await supabase
    .from('services')
    .insert({ name, price, duration, description, category: category || 'haircut', sort_order: sort_order || 0 })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/services/:id (admin)
router.put('/:id', requireAuth, async (req, res) => {
  const { name, price, duration, description, category, sort_order, is_active } = req.body;
  const { data, error } = await supabase
    .from('services')
    .update({ name, price, duration, description, category, sort_order, is_active, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/services/:id (admin)
router.delete('/:id', requireAuth, async (req, res) => {
  const { error } = await supabase.from('services').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
