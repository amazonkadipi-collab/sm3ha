# تدقيق workflow المنشور على sm3haa.vercel.app

## Homepage

الصفحة الرئيسية المنشورة كتفتح بنجاح، RTL خدام، والـheader فيه نغمة، الرئيسية، جديد البحث، وتبديل المظهر. نموذج البحث ظاهر، و«راي» موجود كأول رابط في قائمة الكلمات. الرابط هو `/s/%D8%B1%D8%A7%D9%8A`.

## Search

إدخال «راي» في homepage كيحوّل فعلياً إلى `https://sm3haa.vercel.app/s/%D8%B1%D8%A7%D9%8A`، والعنوان كيولي `تحميل راي Mp3 Mp4 — نغمة`. صفحة keyword والـlayout كيبانو، ولكن body كيعرض `جارٍ تجهيز النتائج...` ثم `لا توجد نتائج مطابقة`، بلا cards ولا thumbnails ولا أزرار تحميل/مشاهدة.

## مقارنة المرجع

في المرجع نفس البحث كيحول إلى `/s/راي`، لكن صفحة النتائج كتظهر cards متعددة من metadata YouTube، وكل card فيها thumbnail واسم ومدة ورابط `/media?d=<opaque-token>` وزر مشاهدة. أول نتيجة تختلف بين الطلبات، لذلك خاص NaghmaHub يعتمد على YouTube API أو catalog محفوظ بدل hardcode لنتيجة مرجعية.

## تشخيص أولي

المسار المنشور والـfront link خدامين. الفشل محصور في data layer ديال `catalog.search` على Vercel: إما YouTube quota/key غير متاحة، أو Supabase المنشور ما فيهش metadata لـ«راي»، أو fallback لا يرجع نتائج عند فشل API. خاص فحص network/runtime logs قبل تعديل behavior.
