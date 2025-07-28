# استخدام Node.js الرسمي
FROM node:18-alpine

# تعيين مجلد العمل
WORKDIR /app

# نسخ ملفات package
COPY package*.json ./

# تثبيت التبعيات
RUN npm ci --only=production

# نسخ باقي الملفات
COPY . .

# إنشاء مستخدم غير root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# تغيير ملكية الملفات
RUN chown -R nextjs:nodejs /app
USER nextjs

# فتح البورت
EXPOSE 3000

# تشغيل التطبيق
CMD ["npm", "start"]
