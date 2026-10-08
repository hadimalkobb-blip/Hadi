/* =====================================================================================
   5.0 · «الثورة»: what is new, in one place
   ===================================================================================== */
const APP_VERSION = '٥٫٠';
const V50 = [
  { go: 'tja', ic: 'bulb', t: 'أكاديمية التجويد', d: `${ARN(TJD.spots.length)} موضعًا في السورة، لكلٍّ منها «لماذا هذا الحكم؟» و«لماذا ليس غيره؟»، وست ألعاب.` },
  { go: 'coach', ic: 'atom', t: 'مدرّبك الذكي', d: 'يعرف متى تبدأ كل آية بالابتعاد فينبّهك قبلها، ويبني جلسة دقيقتين أو خمس أو ربع ساعة، والألعاب تتكيّف معك.' },
  { go: 'prophets', ic: 'lantern', t: 'ليل الأنبياء وضحاهم', d: 'يوسف ويونس وأم موسى وأيوب وإبراهيم والهجرة، وأدعية الأنبياء، وحكاية قبل النوم، وقصة الجمعة.' },
  { go: 'wordle', ic: 'grid', t: 'كلمة الضحى اليومية', d: 'كلمةٌ من السورة كل يوم للجميع، ست محاولات، ونتيجة تشاركها بلا كشف.' },
  { go: 'escape', ic: 'key', t: 'خمس ألعاب جديدة', d: 'غرفة الهروب، والقافلة، وحروف تتلاقى، والكلمات المتقاطعة، و«شو الآية؟» للعيلة.' },
  { go: 'deeds', ic: 'heart', t: 'ليش الدين جميل؟', d: 'عشر بطاقات من الصحيحين والسنن، وفعلٌ صغير لليوم.' },
  { go: 'duhapr', ic: 'sun', t: 'ركعتا الضحى', d: 'عدّادٌ لك وحدك، والحديث، ووقتها في مدينتك.' },
  { go: 'settings', ic: 'backup', t: 'نسختك الاحتياطية', d: 'احفظ رحلتك في ملف وأرجعها متى شئت، في الإعدادات.' },
];
function openWhatsNew() {
  S.seen50 = 1; save();
  const L = Gx.open('wnv', `الجديد في ${APP_VERSION}`, 'sparkle');
  html(L.body, `<div class="tjwrap"><div class="wnhero"><span class="eyebrow">الإصدار ${APP_VERSION} · «الثورة»</span><h2>رحلة الضحى، من جديد</h2><p class="muted">كل ما خُطّط لـ٤٫٤ و٤٫٥ و٤٫٦ في إصدارٍ واحد، ومعه أكاديمية التجويد وألعابٌ جديدة.</p></div>
    ${V50.map(x => `<button class="card wnitem" data-go="${x.go}"><span class="gi">${ic(x.ic)}</span><span class="grow"><b>${x.t}</b><span class="dim">${x.d}</span></span>${ic('chev')}</button>`).join('')}</div>`);
}
function whatsNewCard() {
  if (S.seen50) return '';
  return `<button class="card wncard" data-go="whatsnew"><span class="gi">${ic('sparkle')}</span><span class="grow"><span class="eyebrow">جديد في ${APP_VERSION} · «الثورة»</span><b>أكاديمية التجويد، ومدرّبٌ ذكي، وليل الأنبياء وضحاهم، وألعاب جديدة</b></span>${ic('chev')}</button>`;
}
V50_ROUTES.whatsnew = openWhatsNew;
