// Cloudflare Turnstile verification middleware for registration

async function verifyTurnstile(req, res, next) {
  try {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    const token = req.body?.captchaToken || req.body?.['cf-turnstile-response'];

    if (!secret) {
      console.warn('TURNSTILE_SECRET_KEY not set; skipping captcha verification');
      return next();
    }

    if (!token) {
      return res.status(400).json({ message: 'Captcha token is required.' });
    }

    const form = new URLSearchParams();
    form.append('secret', secret);
    form.append('response', token);
    if (req.ip) form.append('remoteip', req.ip);

    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    });
    const data = await resp.json();

    if (!data.success) {
      return res.status(400).json({ message: 'Captcha verification failed.' });
    }
    return next();
  } catch (err) {
    console.error('Captcha verification error:', err);
    return res.status(500).json({ message: 'Captcha verification error.' });
  }
}

module.exports = verifyTurnstile;

