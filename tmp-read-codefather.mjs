const base = process.env.SUPABASE_URL.replace(/\/+$/, '');
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const slug = 'codefather-interview-2071400704039190529';
const url = `${base}/rest/v1/interview_questions?select=slug,metadata&slug=eq.${slug}`;
const resp = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}`, 'Accept-Profile': 'public' } });
const rows = await resp.json();
const meta = rows[0]?.metadata ?? {};
console.log(JSON.stringify({
  slug: rows[0]?.slug,
  answerVariants: (meta.answerVariants || []).slice(0, 2),
  contentSections: (meta.contentSections || []).slice(0, 2).map((x) => ({ heading: x.heading, body: String(x.body).slice(0, 80) }))
}, null, 2));
