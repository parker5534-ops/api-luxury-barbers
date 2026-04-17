const router = require('express').Router();
const supabase = require('../lib/supabase');

// GET /api/public/site-content
// Returns everything the public site needs in one request
router.get('/site-content', async (req, res) => {
  try {
    const [settings, services, gallery, barbers, testimonials, faqs] = await Promise.all([
      supabase.from('site_settings').select('key, value'),
      supabase.from('services').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('gallery_images').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('barbers').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('testimonials').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('faqs').select('*').eq('is_active', true).order('sort_order'),
    ]);

    // Convert settings array to key-value object
    const settingsMap = {};
    (settings.data || []).forEach(s => { settingsMap[s.key] = s.value; });

    // Don't expose analytics IDs or sensitive keys in public endpoint
    delete settingsMap.ga4_id;
    delete settingsMap.meta_pixel_id;

    res.json({
      settings: settingsMap,
      services: services.data || [],
      gallery: gallery.data || [],
      barbers: barbers.data || [],
      testimonials: testimonials.data || [],
      faqs: faqs.data || [],
    });
  } catch (err) {
    console.error('site-content error:', err);
    res.status(500).json({ error: 'Failed to load site content' });
  }
});

module.exports = router;
