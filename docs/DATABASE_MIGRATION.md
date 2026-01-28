# Database Migration Guide: SQLite → PostgreSQL

## Overview

Pantheon Trading OS şu anda SQLite kullanıyor. Production deployment için PostgreSQL'e geçiş gereklidir.

## Neden PostgreSQL?

- **Serverless Deployment**: Vercel serverless fonksiyonları ile uyumlu
- **Concurrent Connections**: Çoklu istekleri daha iyi yönetir
- **Scalability**: Production ortamda ölçeklenebilirlik sağlar
- **Managed Services**: Supabase, Neon, Vercel Postgres gibi managed servisler

## Önerilen PostgreSQL Servisleri

### 1. Vercel Postgres (Önerilen)
- Vercel ile tam entegre
- Otomatik backup
- Serverless optimized
- Ücretsiz tier mevcut

### 2. Neon
- Serverless PostgreSQL
- Branching desteği
- Ücretsiz tier mevcut
- Kolay kurulum

### 3. Supabase
- Open source
- Built-in auth ve storage
- Ücretsiz tier mevcut
- Ekstra özellikler sunar

### 4. Railway
- Kolay deployment
- Ücretsiz tier mevcut
- Basit arayüz

## Migration Adımları

### Adım 1: PostgreSQL Veritabanı Oluşturun

```bash
# Örnek: Vercel Postgres
vercel postgres create

# Veya Neon kullanarak
# https://neon.tech/signup
```

### Adım 2: Prisma Schema Güncelleme

`prisma/schema.prisma` dosyasını güncelleyin:

```prisma
// Önceki (SQLite):
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// Sonra (PostgreSQL):
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Adım 3: Prisma Client Yeniden Oluşturun

```bash
pnpm prisma generate
```

### Adım 4: Migration Oluşturun

```bash
pnpm prisma migrate dev --name init
```

### Adım 5: Production Migration

```bash
pnpm prisma migrate deploy
```

## Vercel Postgres ile Entegrasyon

### Kurulum

```bash
# Vercel CLI kurulumu
npm i -g vercel

# Proje bağlantısı
vercel link

# Postgres oluşturma
vercel postgres create

# Environment variable otomatik ekleme
vercel env pull .env.local
```

### Schema Migration

```bash
# Migration oluşturma
vercel postgres migrate

# Production'da çalıştırma
vercel env pull .env.production
pnpm prisma migrate deploy
```

## Environment Variables

Production için aşağı değişkenleri Vercel dashboard'da ekleyin:

```bash
DATABASE_URL=postgresql://user:password@host:5432/database
```

## Veri Taşıma (Opsiyonel)

Mevcut SQLite verilerinizi PostgreSQL'e taşımak için:

```bash
# SQLite verilerini export et
sqlite3 prisma/data/pantheon.db .dump > backup.sql

# PostgreSQL'e import et
psql -h host -U user -d database < backup.sql
```

veya Prisma kullanarak:

```bash
# Prisma seed kullanarak
pnpm prisma db seed
```

## Test

Migration sonrası test edin:

```bash
# Database bağlantısını test et
pnpm prisma studio

# Migration durumunu kontrol et
pnpm prisma migrate status
```

## Notlar

1. **Backup**: Migration öncesi mutlaka backup alın
2. **Test Environment**: Önce staging/test ortamında deneyin
3. **Downtime**: Migration sırasında kısa süreli kesinti olabilir
4. **Rollback**: Sorun olursa geri dönme planınız olsun

## Sorun Giderme

### Connection Issues

```bash
# Connection string'i kontrol edin
echo $DATABASE_URL

# Firewall ayarlarını kontrol edin
# PostgreSQL port (5432) açık olmalı
```

### Migration Errors

```bash
# Force reset (DİKKAT: Verileri siler!)
pnpm prisma migrate reset

# Debug mode
DEBUG="prisma:*" pnpm prisma migrate deploy
```

## Kaynaklar

- [Prisma PostgreSQL](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Neon](https://neon.tech/docs)
- [Supabase](https://supabase.com/docs)
