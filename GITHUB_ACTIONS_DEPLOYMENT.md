# GitHub Actions CI/CD Deployment Guide

این راهنما به شما کمک می‌کند تا پروژه Agriculture RAG Dashboard را به صورت خودکار از طریق GitHub Actions روی سرور خود deploy کنید.

## 📋 پیش‌نیازها

- یک سرور با Ubuntu 20.04 یا بالاتر
- دامنه‌ای که به سرور شما اشاره می‌کند (A و AAAA records)
- دسترسی SSH با sudo privileges به سرور
- یک repository در GitHub

## 🚀 مراحل راه‌اندازی

### مرحله ۱: آماده‌سازی سرور

ابتدا به سرور خود متصل شوید و اسکریپت setup را اجرا کنید:

```bash
# اگر از قبل clone نکرده‌اید
git clone https://github.com/YOUR_USERNAME/agriculture-rag-dashboard.git
cd agriculture-rag-dashboard

# اجرای اسکریپت setup
chmod +x scripts/setup-server.sh
./scripts/setup-server.sh
```

این اسکریپت موارد زیر را انجام می‌دهد:
- نصب Docker و Docker Compose
- ایجاد networks و volumes مورد نیاز
- تنظیم firewall
- ایجاد اسکریپت‌های کاربردی

**مهم:** پس از اجرای اسکریپت، از سرور خارج شده و دوباره وارد شوید تا Docker group فعال شود.

### مرحله ۲: تنظیم SSH Keys برای GitHub Actions

#### ۲.۱ ایجاد SSH Key Pair روی سرور:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github-actions
# یا با RSA:
# ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/github-actions
```

#### ۲.۲ افزودن Public Key به authorized_keys:

```bash
cat ~/.ssh/github-actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/github-actions
chmod 644 ~/.ssh/github-actions.pub
```

#### ۲.۳ تست اتصال SSH:

```bash
ssh -i ~/.ssh/github-actions $USER@localhost
```

### مرحله ۳: تنظیمات GitHub Repository

#### ۳.۱ افزودن Deploy Key:

1. به GitHub repository خود بروید
2. `Settings` → `Deploy Keys` → `Add deploy key`
3. Public key را از سرور کپی کنید: `cat ~/.ssh/github-actions.pub`
4. عنوانی مثل "Server Deploy Key" وارد کنید
5. تیک `Allow write access` را بزنید

#### ۳.۲ تنظیم GitHub Secrets:

به `Settings` → `Secrets and variables` → `Actions` بروید و secrets زیر را اضافه کنید:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SERVER_HOST` | IP address یا domain سرور | `123.45.67.89` یا `yourdomain.com` |
| `SERVER_USER` | نام کاربری سرور | `ubuntu` یا `root` |
| `SSH_PRIVATE_KEY` | Private key content | `cat ~/.ssh/github-actions` |

#### ۳.۳ افزودن Environment Variables:

همچنین متغیرهای محیطی زیر را اضافه کنید (مقادیر را با داده‌های واقعی خود جایگزین کنید):

```bash
# Domain Configuration
DOMAIN_NAME=yourdomain.com
SUBDOMAIN=n8n
DASHBOARD_SUBDOMAIN=dashboard

# SSL Configuration
SSL_EMAIL=your-email@yourdomain.com

# Timezone Configuration
GENERIC_TIMEZONE=Asia/Tehran

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
SESSION_SECRET=your_32_character_random_secret
JWT_SECRET=your_jwt_secret_key_here
```

### مرحله ۴: پیکربندی DNS

مطمئن شوید DNS records زیر تنظیم شده باشند:

```
Type    Name                    Value
A       n8n                     YOUR_SERVER_IP
A       dashboard               YOUR_SERVER_IP
A       @                       YOUR_SERVER_IP (optional)
```

اگر از Cloudflare استفاده می‌کنید، مطمئن شوید که proxy (orange cloud) خاموش باشد یا SSL mode روی Full قرار گرفته باشد.

### مرحله ۵: اولین Deployment

پس از تنظیمات بالا، هر بار که به branch `main` push کنید، deployment به صورت خودکار انجام می‌شود:

```bash
git add .
git commit -m "Setup GitHub Actions deployment"
git push origin main
```

می‌توانید فرآیند deployment را در `Actions` tab در GitHub مشاهده کنید.

## 📁 ساختار فایل‌های مرتبط با Deployment

```
agriculture-rag-dashboard/
├── .github/workflows/
│   └── deploy.yml              # GitHub Actions workflow
├── scripts/
│   └── setup-server.sh         # Server setup script
├── Dockerfile                  # Docker image definition
├── docker-compose.yml          # Development compose file
├── docker-compose.prod.yml     # Production compose file
├── .dockerignore               # Docker ignore rules
├── .env.example                # Environment variables template
├── .env.production             # Production environment template
└── GITHUB_ACTIONS_DEPLOYMENT.md # This guide
```

## 🛠️ اسکریپت‌های کاربردی روی سرور

### مشاهده وضعیت سرویس‌ها:
```bash
~/check-services.sh
```

### پشتیبان‌گیری دستی:
```bash
~/backup-docker-data.sh
```

### به‌روزرسانی سیستم و کانتینرها:
```bash
~/update-system.sh
```

### مشاهده لاگ‌ها:
```bash
cd ~/agriculture-rag-dashboard
docker-compose -f docker-compose.prod.yml logs -f agriculture-rag-dashboard
docker-compose -f docker-compose.prod.yml logs -f n8n
docker-compose -f docker-compose.prod.yml logs -f traefik
```

## 🔧 عیب‌یابی

### مشکل: SSH Permission Denied
```bash
# روی سرور:
chmod 600 ~/.ssh/github-actions
chmod 644 ~/.ssh/github-actions.pub
chmod 700 ~/.ssh
```

### مشکل: Docker Permission Denied
```bash
# روی سرور:
sudo usermod -aG docker $USER
# سپس logout و دوباره login کنید
```

### مشکل: SSL Certificate Error
- DNS records را بررسی کنید
- مطمئن شوید port 80 و 443 باز هستند
  ```bash
  sudo ufw status
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  ```

### مشکل: Build Failure
- لاگ‌های GitHub Actions را بررسی کنید
- مطمئن شوید تمام secrets به درستی تنظیم شده‌اند

### مشاهده منابع مصرفی:
```bash
docker stats
htop
df -h
```

## 🔒 Security Considerations

1. **Strong Passwords**: از رمزهای قوی برای متغیرهای محیطی استفاده کنید
2. **Regular Updates**: سیستم و Docker را به‌روز نگه دارید
3. **Firewall**: فقط پورت‌های ضروری را باز کنید
4. **Monitoring**: از اسکریپت‌های monitoring به طور منظم استفاده کنید
5. **Backups**: از پشتیبان‌گیری خودکار مطمئن شوید

## 📊 Monitoring

### Health Checks:
```bash
# Health status all containers
docker ps --format "table {{.Names}}\t{{.Status}}"

# Specific service health
curl -f https://dashboard.yourdomain.com || echo "Dashboard is down"
curl -f https://n8n.yourdomain.com || echo "N8N is down"
```

### Alerts:
می‌توانید از سرویس‌هایی مانند UptimeRobot برای monitoring استفاده کنید:
- `https://dashboard.yourdomain.com`
- `https://n8n.yourdomain.com`

## 🔄 Rollback

اگر نیاز به rollback داشتید:

```bash
cd ~/agriculture-rag-dashboard
git checkout PREVIOUS_COMMIT_TAG
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

## 📝 نکات تکمیلی

1. **Custom Domain**: اگر از subdomain های دیگری استفاده می‌کنید، docker-compose.prod.yml را به‌روز کنید
2. **Database**: اگر نیاز به database دارید، می‌توانید PostgreSQL را به docker-compose اضافه کنید
3. **Redis**: برای caching می‌توانید Redis container اضافه کنید
4. **Backups**: پشتیبان‌ها در `~/backups` ذخیره می‌شوند
5. **Logs**: Docker logs در `~/logs` ذخیره می‌شوند

با این راهنما، پروژه شما به صورت خودکار deploy می‌شود و می‌توانید روی توسعه تمرکز کنید! 🎉