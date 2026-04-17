const router = require('express').Router();
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

// POST /api/leads (public — contact form submission)
router.post('/', async (req, res) => {
  const { name, email, phone, message, source } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const { data, error } = await supabase
    .from('leads')
    .insert({ name, email, phone, message, source: source || 'contact_form' })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ success: true, id: data.id });
});

// GET /api/leads (admin)
router.get('/', requireAuth, async (req, res) => {
  const { status, limit = 50, offset = 0 } = req.query;
  let query = supabase.from('leads').select('*', { count: 'exact' });
  if (status) query = query.eq('status', status);
  query = query.order('created_at', { ascending: false }).range(Number(offset), Number(offset) + Number(limit) - 1);
  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, count });
});

// PUT /api/leads/:id (admin — update status)
router.put('/:id', requireAuth, async (req, res) => {
  const { status } = req.body;
  const { data, error } = await supabase.from('leads')
    .update({ status })
    .eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/leads/:id (admin)
router.delete('/:id', requireAuth, async (req, res) => {
  const { error } = await supabase.from('leads').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
