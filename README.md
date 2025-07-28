# TeleBot Creator

منصة متقدمة لإنشاء وإدارة بوتات تليجرام بسهولة وبدون برمجة.

## المميزات

- 🚀 إنشاء بوتات تليجرام بسرعة
- 🔐 نظام مصادقة آمن مع Google OAuth
- 💳 نظام خطط مرن (مجاني ومتقدم)
- 📊 لوحة تحكم شاملة
- 🔒 تشفير البيانات الحساسة
- 📧 نظام إشعارات بالبريد الإلكتروني

## التقنيات المستخدمة

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: Passport.js, Google OAuth 2.0
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Security**: Helmet, Rate Limiting, Data Encryption
- **Email**: Nodemailer

## التثبيت والتشغيل

### المتطلبات

- Node.js (v18 أو أحدث)
- MongoDB
- حساب Google للـ OAuth
- حساب Gmail للإيميلات

### خطوات التثبيت

1. **استنساخ المشروع**
\`\`\`bash
git clone https://github.com/yourusername/telebot-creator.git
cd telebot-creator
\`\`\`

2. **تثبيت التبعيات**
\`\`\`bash
npm install
\`\`\`

3. **إعداد متغيرات البيئة**
\`\`\`bash
cp .env.example .env
\`\`\`

قم بتعديل ملف `.env` وإضافة القيم المطلوبة:

\`\`\`env
MONGO_URL=mongodb://localhost:27017/telebot-creator
ENCRYPTION_KEY=your-32-character-encryption-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
ADMIN_EMAIL=your-admin@gmail.com
ADMIN_EMAIL_PASS=your-app-password
PORT=3000
NODE_ENV=development
\`\`\`

4. **تشغيل المشروع**

للتطوير:
\`\`\`bash
npm run dev
\`\`\`

للإنتاج:
\`\`\`bash
npm start
\`\`\`

## النشر

### Vercel

1. قم بإنشاء حساب على [Vercel](https://vercel.com)
2. ربط المشروع بـ GitHub
3. إضافة متغيرات البيئة في لوحة تحكم Vercel
4. النشر التلقائي عند كل push

### Netlify

1. قم بإنشاء حساب على [Netlify](https://netlify.com)
2. ربط المشروع بـ GitHub
3. إضافة متغيرات البيئة
4. النشر باستخدام Netlify Functions

### Heroku

1. قم بإنشاء حساب على [Heroku](https://heroku.com)
2. إنشاء تطبيق جديد
3. ربط بـ GitHub أو استخدام Heroku CLI
4. إضافة MongoDB Atlas كقاعدة بيانات
5. إضافة متغيرات البيئة

### Docker

\`\`\`bash
# بناء الصورة
docker build -t telebot-creator .

# تشغيل الحاوية
docker run -p 3000:3000 --env-file .env telebot-creator

# أو استخدام docker-compose
docker-compose up -d
\`\`\`

## هيكل المشروع

\`\`\`
telebot-creator/
├── models/           # نماذج قاعدة البيانات
├── routes/           # مسارات API
├── utils/            # وظائف مساعدة
├── public/           # الملفات الثابتة
│   ├── css/         # ملفات التنسيق
│   ├── js/          # ملفات JavaScript
│   └── *.html       # صفحات HTML
├── middleware/       # وسطاء Express
├── server.js         # الملف الرئيسي
├── package.json      # تبعيات المشروع
└── README.md         # هذا الملف
\`\`\`

## الأمان

- تشفير البيانات الحساسة
- حماية من CSRF
- Rate Limiting
- Helmet للحماية من الثغرات الشائعة
- جلسات آمنة

## المساهمة

1. Fork المشروع
2. إنشاء فرع للميزة الجديدة (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push للفرع (`git push origin feature/AmazingFeature`)
5. فتح Pull Request

## الترخيص

هذا المشروع مرخص تحت رخصة MIT - انظر ملف [LICENSE](LICENSE) للتفاصيل.

## الدعم

إذا واجهت أي مشاكل، يرجى فتح [issue](https://github.com/yourusername/telebot-creator/issues) جديد.

## المطور

- **اسمك** - [GitHub](https://github.com/yourusername)
