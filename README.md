# نشر محتجز خصومات العملاء على Vercel

هذه النسخة مهيأة للنشر على Vercel كالتالي:

- الواجهة تعمل كملفات Static داخل `vercel_public`.
- مسارات الحفظ الحالية تظل كما هي:
  - `/api/withheld/state`
  - `/api/withheld/info`
- الحفظ المركزي على Vercel يحفظ الحسابات وإعدادات العملاء فقط.
- آخر DATA أو Snapshot كبير يظل محفوظاً محلياً داخل متصفح كل مستخدم لتجنب حد Vercel الخاص بحجم الطلب والرد.

## 1. تجهيز ملفات النشر

شغل:

```powershell
npm run build:vercel
```

هذا ينسخ فقط:

- `customer_withheld_discounts_may_dynamic.html`
- `customer_withheld_discounts_may_dynamic.xlsx`

إلى مجلد `vercel_public`.

## 2. إنشاء مشروع Vercel

1. ادخل على Vercel.
2. أنشئ Project جديد من هذا المجلد أو من GitHub.
3. تأكد أن Build Command هو:

```text
npm run build:vercel
```

4. Output Directory:

```text
vercel_public
```

## 3. إضافة التخزين الدائم

من Vercel Marketplace أضف Redis/Upstash Redis للمشروع، ثم أضف Environment Variables:

```text
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

اختياري:

```text
WITHHELD_STATE_KEY=egypt-gold-withheld-state-v1
WITHHELD_ADMIN_PASSWORD=1234
```

## 4. نقل الحسابات والإعدادات الحالية

بعد ضبط متغيرات Redis محلياً:

```powershell
$env:UPSTASH_REDIS_REST_URL="ضع الرابط هنا"
$env:UPSTASH_REDIS_REST_TOKEN="ضع التوكن هنا"
npm run vercel:push-state
```

هذا ينقل الحسابات وإعدادات العملاء فقط، ولا ينقل snapshots الكبيرة.

## 5. النشر

لو تستخدم Vercel CLI:

```powershell
npm i -g vercel
vercel login
vercel --prod
```

بعد النشر، افتح رابط Vercel، ثم ابعته للمحاسبين كنص عادي.

## ملاحظات مهمة

- كلمات السر النصية لا يتم إرسالها في API نسخة اللايف. لو احتجت كلمة سر محاسب، غيرها من شاشة الأدمن.
- أي تعديلات في إعدادات العملاء تظل محفوظة مركزياً.
- رفع DATA كبير يظل داخل متصفح المستخدم؛ لو عايز DATA الشهر الجديد تكون افتراضية لكل الناس، أعد توليد HTML ثم أعد النشر.
