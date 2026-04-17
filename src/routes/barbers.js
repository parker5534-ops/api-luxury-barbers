const router = require('express').Router();
const supabase = require('../lib/supabase');
const cloudinary = require('../lib/cloudinary');
const { requireAuth } = require('../middleware/auth');

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('barbers').select('*').eq('is_active', true).order('sort_order');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/all', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('barbers').select('*').order('sort_order');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', requireAuth, async (req, res) => {
  const { name, title, bio, specialties, phone, instagram, photo_url, photo_public_id, sort_order } = req.body;
  if (!name || !title) return res.status(400).json({ error: 'Name and title required' });
  const { data, error } = await supabase.from('barbers')
    .insert({ name, title, bio, specialties, phone, instagram, photo_url, photo_public_id, sort_order: sort_order || 0 })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/:id', requireAuth, async (req, res) => {
  const { name, title, bio, specialties, phone, instagram, photo_url, photo_public_id, sort_order, is_active } = req.body;
  const { data, error } = await supabase.from('barbers')
    .update({ name, title, bio, specialties, phone, instagram, photo_url, photo_public_id, sort_order, is_active, updated_at: new Date().toISOString() })
    .eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const { data: barber } = await supabase.from('barbers').select('photo_public_id').eq('id', req.params.id).single();
  if (barber?.photo_public_id) {
    await cloudinary.uploader.destroy(barber.photo_public_id).catch(() => {});
  }
  const { error } = await supabase.from('barbers').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
