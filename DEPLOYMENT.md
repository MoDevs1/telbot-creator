# نشر المشروع على Vercel

## الخطوات المطلوبة:

### 1. تحضير المشروع

تأكد من وجود الملفات التالية:
- `vercel.json` - إعدادات Vercel
- `package.json` - التبعيات
- `server.js` - الخادم الرئيسي

### 2. رفع المشروع على GitHub

\`\`\`bash
git init
git add .
git commit -m "Initial commit for Vercel deployment"
git branch -M main
git remote add origin https://github.com/username/telebot-creator.git
git push -u origin main
\`\`\`

### 3. إنشاء حساب Vercel

1. اذهب إلى [vercel.com](https://vercel.com)
2. سجل دخول بحساب GitHub
3. اضغط "New Project"

### 4. ربط المشروع

1. اختر المشروع من GitHub
2. اضغط "Import"
3. تأكد من الإعدادات:
   - Framework Preset: Other
   - Build Command: `npm run build`
   - Output Directory: (leave empty)
   - Install Command: `npm install`

### 5. إضافة متغيرات البيئة

في لوحة تحكم Vercel، اذهب إلى Settings > Environment Variables وأضف:

\`\`\`
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/telebot-creator
ENCRYPTION_KEY=your-32-character-encryption-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-app.vercel.app/auth/google/callback
ADMIN_EMAIL=your-admin@gmail.com
ADMIN_EMAIL_PASS=your-app-password
SESSION_SECRET=your-session-secret
BASE_URL=https://your-app.vercel.app
NODE_ENV=production
\`\`\`

### 6. إعداد قاعدة البيانات

استخدم MongoDB Atlas:
1. اذهب إلى [mongodb.com/atlas](https://mongodb.com/atlas)
2. أنشئ cluster جديد
3. احصل على connection string
4. أضفه في متغير `MONGO_URL`

### 7. إعداد Google OAuth

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com)
2. أنشئ مشروع جديد
3. فعل Google+ API
4. أنشئ OAuth 2.0 credentials
5. أضف Authorized redirect URIs:
   - `https://your-app.vercel.app/auth/google/callback`

### 8. النشر

1. اضغط "Deploy" في Vercel
2. انتظر حتى ينتهي النشر
3. اختبر الموقع

## نصائح مهمة:

1. **الأمان**: لا تضع المفاتيح السرية في الكود
2. **قاعدة البيانات**: استخدم MongoDB Atlas للإنتاج
3. **الدومين**: يمكنك ربط دومين مخصص لاحقاً
4. **المراقبة**: استخدم Vercel Analytics لمراقبة الأداء

## استكشاف الأخطاء:

### خطأ في قاعدة البيانات:
- تأكد من صحة MONGO_URL
- تأكد من السماح للـ IP في MongoDB Atlas

### خطأ في Google OAuth:
- تأكد من صحة GOOGLE_CLIENT_ID و GOOGLE_CLIENT_SECRET
- تأكد من إضافة redirect URI الصحيح

### خطأ في الجلسات:
- تأكد من وجود SESSION_SECRET
- تأكد من إعدادات الكوكيز للإنتاج
