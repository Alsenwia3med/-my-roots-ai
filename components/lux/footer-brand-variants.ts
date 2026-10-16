/** Footer concept list (kept out of the client component so server pages can read it). */
export const VARIANTS = [
  { id: "white", name: "01 · White Classic", desc: "أبيض نظيف، إضاءة ناعمة تتبع الماوس، سهم صغير يظهر قبل الرابط" },
  { id: "turq", name: "02 · Turquoise", desc: "خلفية تركوازية فاتحة بنقاط ناعمة، ولمعة بيضاء تتبع الماوس" },
  { id: "green", name: "03 · Emerald", desc: "أخضر زمردي فاتح بتدرج هادئ، وروابط تنزاح وتتلون بالأخضر" },
  { id: "hairline", name: "04 · White Hairline", desc: "أبيض بأعمدة تفصلها خطوط رفيعة، والعمود تحت الماوس يمتلئ شريطه العلوي" },
  { id: "center", name: "05 · White Centered", desc: "أبيض بتكوين مركزي، والخط تحت الرابط يتمدد من المنتصف" },
  { id: "wipeW", name: "06 · White → Turquoise", desc: "أبيض، وعند دخول الماوس يتحول اللون إلى تركوازي بدائرة تتوسع من مكان المؤشر" },
  { id: "wipeT", name: "07 · Turquoise → White", desc: "تركوازي، وعند دخول الماوس ينقلب إلى أبيض بدائرة تتوسع من المؤشر" },
  { id: "cards", name: "08 · White Cards", desc: "أبيض، الأعمدة كروت ناعمة ترتفع عند المرور وشريطها العلوي يمتلئ" },
  { id: "index", name: "09 · White Index", desc: "أبيض، أعمدة مرقّمة بأرقام رفيعة كبيرة تتلون وتتحرك عند المرور" },
  { id: "pills", name: "10 · White Pills", desc: "أبيض، كل رابط يضيء كحبة ناعمة عند المرور مع نقاط تظهر قرب الماوس" },
] as const;
export type VariantId = (typeof VARIANTS)[number]["id"];
