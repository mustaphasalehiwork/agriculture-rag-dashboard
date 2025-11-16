# Docker Deployment Guide

این راهنما شما را برای استقرار پروژه Agriculture RAG Dashboard به همراه N8N روی سرور راهنمایی می‌کند.

## پیش‌نیازها

- Docker و Docker Compose روی سرور نصب شده باشد
- دامنه‌ای که به سرور شما اشاره می‌کند (A record)
- دسترسی SSH به سرور

## مراحل استقرار

### ۱. آماده‌سازی سرور

ابتدا مطمئن شوید که شبکه و volume های مورد نیاز وجود دارند:

```bash
# ایجاد شبکه Traefik
docker network create traefik-network

# ایجاد volume های مورد نیاز
docker volume create traefik_data
docker volume create n8n_data
```

### ۲. تنظیم متغیرهای محیطی

فایل `.env` را ایجاد کنید و متغیرهای زیر را تنظیم کنید:

```bash
cp .env.example .env
```

متغیرهای زیر را با مقادیر واقعی خود جایگزین کنید:

```env
# Domain Configuration
DOMAIN_NAME=yourdomain.com
SUBDOMAIN=n8n
DASHBOARD_SUBDOMAIN=dashboard

# SSL Configuration
SSL_EMAIL=your-email@yourdomain.com

# Timezone Configuration
GENERIC_TIMEZONE=Asia/Tehran

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-here
```

### ۳. ساخت و اجرای سرویس‌ها

```bash
# ساخت و اجرای سرویس‌ها
docker-compose up -d --build

# مشاهده وضعیت سرویس‌ها
docker-compose ps

# مشاهده لاگ‌ها
docker-compose logs -f
```

### ۴. دسترسی به سرویس‌ها

پس از استقرار موفق، شما می‌توانید به سرویس‌های زیر دسترسی داشته باشید:

- **N8N**: `https://n8n.yourdomain.com`
- **Dashboard**: `https://dashboard.yourdomain.com`
- **Traefik Dashboard**: `https://yourdomain.com:8080` (اگر فعال باشد)

## دستورات مفید

### مشاهده لاگ‌های یک سرویس خاص

```bash
# لاگ‌های dashboard
docker-compose logs -f agriculture-rag-dashboard

# لاگ‌های n8n
docker-compose logs -f n8n

# لاگ‌های traefik
docker-compose logs -f traefik
```

### راه‌اندازی مجدد سرویس‌ها

```bash
# راه‌اندازی مجدد تمام سرویس‌ها
docker-compose restart

# راه‌اندازی مجدد سرویس خاص
docker-compose restart agriculture-rag-dashboard
```

### به‌روزرسانی برنامه

```bash
# کشتن سرویس‌ها
docker-compose down

# ساخت و اجرای مجدد با آخرین تغییرات
docker-compose up -d --build
```

### پاکسازی

```bash
# حذف سرویس‌ها و image ها (حفظ volume ها)
docker-compose down --rmi all

# حذف کامل شامل volume ها (احتیاط: داده‌ها حذف می‌شوند)
docker-compose down -v --rmi all
```

## عیب‌یابی

### مشکلات رایج

1. **SSL Certificate Error**: مطمئن شوید که دامنه شما به سرور اشاره می‌کند و DNS تنظیم شده است.

2. **Port Already in Use**: مطمئن شوید که پورت‌های 80 و 443 آزاد هستند.

3. **Memory Issues**: اگر با خطای کمبود حافظه مواجه شدید، می‌توانید swap را روی سرور فعال کنید.

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### مشاهده وضعیت سرویس‌ها

```bash
# مشاهده وضعیت Docker
docker ps

# مشاهده مصرف منابع
docker stats

# ورود به کانتینر برای عیب‌یابی
docker exec -it agriculture-rag-dashboard sh
```

## امنیت

- مطمئن شوید که فایروال سرور فقط پورت‌های 80 و 443 را باز می‌کند
- از رمزهای قوی برای متغیرهای محیطی استفاده کنید
- به‌روزرسانی‌های Docker را به طور منظم نصب کنید

## پشتیبان‌گیری

برای پشتیبان‌گیری از داده‌ها:

```bash
# پشتیبان‌گیری از volume ها
docker run --rm -v n8n_data:/data -v $(pwd):/backup alpine tar czf /backup/n8n-backup.tar.gz -C /data .
docker run --rm -v traefik_data:/data -v $(pwd):/backup alpine tar czf /backup/traefik-backup.tar.gz -C /data .
```

## نظارت

می‌توانید از ابزارهایی مانند UptimeRobot برای نظارت بر در دسترس بودن سرویس‌ها استفاده کنید.