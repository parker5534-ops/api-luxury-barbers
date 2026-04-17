const router = require('express').Router();
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('testimonials').select('*').eq('is_active', true).order('sort_order');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/all', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('testimonials').select('*').order('sort_order');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', requireAuth, async (req, res) => {
  const { name, rating, text, source, sort_order } = req.body;
  if (!name || !text) return res.status(400).json({ error: 'Name and text required' });
  const { data, error } = await supabase.from('testimonials')
    .insert({ name, rating: rating || 5, text, source: source || 'google', sort_order: sort_order || 0 })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/:id', requireAuth, async (req, res) => {
  const { name, rating, text, source, sort_order, is_active } = req.body;
  const { data, error } = await supabase.from('testimonials')
    .update({ name, rating, text, source, sort_order, is_active, updated_at: new Date().toISOString() })
    .eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const { error } = await supabase.from('testimonials').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
