const router = require('express').Router();
const supabase = require('../lib/supabase');
const cloudinary = require('../lib/cloudinary');
const { requireAuth } = require('../middleware/auth');

// GET /api/gallery
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('gallery_images').select('*').eq('is_active', true).order('sort_order');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/gallery/all (admin)
router.get('/all', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('gallery_images').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/gallery (admin — receives Cloudinary URL after upload)
router.post('/', requireAuth, async (req, res) => {
  const { url, thumbnail_url, public_id, caption, category } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });
  const { data, error } = await supabase
    .from('gallery_images')
    .insert({ url, thumbnail_url, public_id, caption, category: category || 'haircut' })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/gallery/:id (admin)
router.put('/:id', requireAuth, async (req, res) => {
  const { caption, category, sort_order, is_active } = req.body;
  const { data, error } = await supabase
    .from('gallery_images')
    .update({ caption, category, sort_order, is_active })
    .eq('id', req.params.id)
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/gallery/:id (admin)
router.delete('/:id', requireAuth, async (req, res) => {
  const { data: img } = await supabase.from('gallery_images').select('public_id').eq('id', req.params.id).single();
  if (img?.public_id) {
    await cloudinary.uploader.destroy(img.public_id).catch(() => {});
  }
  const { error } = await supabase.from('gallery_images').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
