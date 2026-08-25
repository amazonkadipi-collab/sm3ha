# تدقيق workflow المنشور على sm3haa.vercel.app

## Homepage

الصفحة الرئيسية المنشورة كتفتح بنجاح، RTL خدام، والـheader فيه نغمة، الرئيسية، جديد البحث، وتبديل المظهر. نموذج البحث ظاهر، و«راي» موجود كأول رابط في قائمة الكلمات. الرابط هو `/s/%D8%B1%D8%A7%D9%8A`.

## Search

إدخال «راي» في homepage كيحوّل فعلياً إلى `https://sm3haa.vercel.app/s/%D8%B1%D8%A7%D9%8A`، والعنوان كيولي `تحميل راي Mp3 Mp4 — نغمة`. صفحة keyword والـlayout كيبانو، ولكن body كيعرض `جارٍ تجهيز النتائج...` ثم `لا توجد نتائج مطابقة`، بلا cards ولا thumbnails ولا أزرار تحميل/مشاهدة.

## مقارنة المرجع

في المرجع نفس البحث كيحول إلى `/s/راي`، لكن صفحة النتائج كتظهر cards متعددة من metadata YouTube، وكل card فيها thumbnail واسم ومدة ورابط `/media?d=<opaque-token>` وزر مشاهدة. أول نتيجة تختلف بين الطلبات، لذلك خاص NaghmaHub يعتمد على YouTube API أو catalog محفوظ بدل hardcode لنتيجة مرجعية.

## تشخيص أولي

المسار المنشور والـfront link خدامين. الفشل محصور في data layer ديال `catalog.search` على Vercel: إما YouTube quota/key غير متاحة، أو Supabase المنشور ما فيهش metadata لـ«راي»، أو fallback لا يرجع نتائج عند فشل API. خاص فحص network/runtime logs قبل تعديل behavior.

## إعادة التحقق لاحقاً

في إعادة فحص جديدة بتاريخ 2026-08-25، homepage وfront/index ما زالوا خدامين و«راي» ظاهر كأول رابط. البحث حوّل بنجاح إلى `/s/%D8%B1%D8%A7%D9%8A`، لكن الصفحة بقيت في حالة `جارٍ تجهيز النتائج…` أثناء الالتقاط ولم تظهر cards. هذا يؤكد أن routing صحيح، بينما availability ديال data layer ما زالت مرتبطة بـYouTube quota أو بكون catalog المنشور لا يحتوي سجلاً محفوظاً لـ«راي». لا ينبغي اعتبار الصفحة «لا توجد نتائج» نتيجة نهائية قبل انتهاء الطلب.

## نتيجة فعلية في النسخة المنشورة

بعد انتظار اكتمال طلب `/s/راي` ظهرت cards فعلية من YouTube، مع thumbnails وmetadata وأزرار تحميل/مشاهدة. أول نتيجة كانت `Best Of Rai Oriental Compilation 2025 ...` بمعرّف YouTube `LFTW_RVUZTQ`، ورابط التحميل الداخلي `/media?d=d_0ad6097166363cba`.

تم النقر على رابط التحميل الأول، فانتقل المتصفح فعلياً إلى `https://sm3haa.vercel.app/media?d=d_0ad6097166363cba`، لكن الصفحة المنشورة ظهرت فارغة تقريباً، بدون metadata أو زر تحويل. إذن search والـkeyword والـopaque link خدامين، بينما `mediaByToken` لا يجد token الناتج عن YouTube في production؛ وهذا يتطلب تخزين/حل token بطريقة ثابتة قبل الانتقال إلى `/videos_dl`.
