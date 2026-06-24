#!/bin/bash
# =============================================================================
# BetterCV VPS Deploy Script
# Chạy trên VPS Ubuntu 22.04/24.04 sau khi đã clone repo và cấu hình .env
# =============================================================================
set -e

# ── 0. Kiểm tra biến môi trường bắt buộc ────────────────────────────────────
if [ -z "$DOMAIN" ]; then
  echo "❌ Thiếu biến DOMAIN. Chạy: DOMAIN=yourdomain.com bash deploy.sh"
  exit 1
fi
export DOMAIN

EMAIL=${EMAIL:-"admin@${DOMAIN}"}
COMPOSE="docker compose --env-file $(pwd)/.env -f infrastructure/docker/docker-compose.prod.yml"

echo ""
echo "════════════════════════════════════════════════════"
echo "  BetterCV Production Deploy"
echo "  Domain : $DOMAIN"
echo "  Email  : $EMAIL"
echo "════════════════════════════════════════════════════"
echo ""

# ── 1. Cài Docker nếu chưa có ───────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "📦 Cài Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

# ── 2. Tạo swap 2GB nếu RAM < 3GB (tránh OOM khi build) ──────────────────
TOTAL_RAM=$(free -m | awk '/^Mem:/{print $2}')
if [ "$TOTAL_RAM" -lt 3000 ] && [ ! -f /swapfile ]; then
  echo "💾 Tạo swap 2GB (RAM = ${TOTAL_RAM}MB)..."
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ── 3. Cập nhật .env cho production ─────────────────────────────────────────
echo "⚙️  Cập nhật NEXT_PUBLIC_API_URL trong .env..."
sed -i "s|^NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://${DOMAIN}/api|" .env
sed -i "s|^APP_PUBLIC_URL=.*|APP_PUBLIC_URL=https://${DOMAIN}|" .env
sed -i "s|^REDIS_ENABLED=.*|REDIS_ENABLED=true|" .env
sed -i "s|^REDIS_HOST=.*|REDIS_HOST=redis|" .env

# Thêm DOMAIN vào .env nếu chưa có
grep -q "^DOMAIN=" .env || echo "DOMAIN=${DOMAIN}" >> .env

# ── 4. Build & khởi động (giai đoạn 1: HTTP để lấy cert) ────────────────────
echo ""
echo "🐳 Build và start containers (HTTP mode)..."
$COMPOSE down --remove-orphans 2>/dev/null || true
$COMPOSE build --no-cache
$COMPOSE up -d

echo ""
echo "⏳ Chờ containers khởi động (30s)..."
sleep 30
$COMPOSE ps

# ── 5. Lấy SSL Certificate từ Let's Encrypt ─────────────────────────────────
echo ""
echo "🔐 Lấy SSL certificate từ Let's Encrypt..."
$COMPOSE run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN" \
  -d "www.${DOMAIN}" && SSL_OK=true || SSL_OK=false

if [ "$SSL_OK" = "true" ]; then
  echo "✅ SSL certificate đã được cấp!"

  # Thay nginx config sang HTTPS
  echo "🔄 Chuyển sang HTTPS config..."
  DOMAIN="$DOMAIN" envsubst '${DOMAIN}' \
    < infrastructure/docker/nginx.prod.conf.template \
    > infrastructure/docker/nginx.prod.conf

  # Reload nginx
  $COMPOSE exec nginx nginx -s reload
  echo "✅ Nginx đã reload với HTTPS!"
else
  echo "⚠️  SSL chưa lấy được (DNS chưa propagate?). App vẫn chạy HTTP."
  echo "    Chạy lại sau: DOMAIN=$DOMAIN bash deploy.sh --ssl-only"
fi

# ── 6. Chạy database migration ───────────────────────────────────────────────
echo ""
echo "🗄️  Chạy Prisma migration..."
$COMPOSE exec api npx prisma migrate deploy || echo "⚠️  Migration thất bại hoặc không cần thiết"

# ── 7. Kết quả ──────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════"
echo "  ✅ Deploy hoàn thành!"
echo ""
if [ "$SSL_OK" = "true" ]; then
  echo "  🌐 App: https://$DOMAIN"
  echo "  📊 API: https://$DOMAIN/api"
else
  echo "  🌐 App: http://$DOMAIN"
  echo "  📊 API: http://$DOMAIN/api"
fi
echo ""
echo "  📋 Xem logs: docker compose -f infrastructure/docker/docker-compose.prod.yml logs -f"
echo "════════════════════════════════════════════════════"
