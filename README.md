# 🎄 Yılbaşı Çekilişi

Bir araya gelmeden yılbaşı çekilişi (Secret Santa). Owner çekilişi oluşturur ve katılım linkini paylaşır. Katılımcılar isim, mail ve dilek listesiyle katılır. Owner tek tuşla çekilişi yapar ve herkes kime hediye alacağını mailinden öğrenir. Eşleşmeleri owner dahil kimse sitede göremez.

**Özellikler:** dilek listesi · birbirine çıkmaması gereken kişiler (çiftler vb.) · TR/EN dil desteği · katılımcının kendi kaydını düzenleme veya silme linki · başarısız maili tekrar gönderme · **"Ne alacağımı bilmiyorum"**: mini anket ve yapay zeka (Claude) ile hediye önerileri (`/fikir`; çekiliş mailindeki linkle gelince sana çıkan kişinin dilek listesi otomatik eklenir, IP başına saatte 10 istek).

## Yerelde çalıştırma

```bash
npm install
npm run dev
```

Hiçbir ayar gerekmez:
- `DATABASE_URL` yoksa veritabanı olarak PGlite kullanılır (işletim sisteminin temp klasöründe tutulur).
- `SMTP_HOST` yoksa mailler gönderilmez, `.dev-mails/` klasörüne HTML dosyası olarak yazılır.

Testler: `npm test` (çekiliş algoritması)

## Yayına alma (Vercel)

1. **Veritabanı:** [neon.tech](https://neon.tech) üzerinde ücretsiz bir proje aç. Pooled connection string'i kopyala (`postgres://...`). Tablolar ilk istekte otomatik oluşturulur.
2. **Mail (Gmail):** Google hesabında 2 adımlı doğrulamayı aç. *Google Hesabı → Güvenlik → Uygulama şifreleri* bölümünden bir uygulama şifresi oluştur. Gmail'in günlük gönderim limiti yaklaşık 500 maildir.
3. **Vercel:** projeyi GitHub'a gönder. [vercel.com](https://vercel.com) üzerinde *Import Project* ile ekle ve şu ortam değişkenlerini gir (bkz. `.env.example`):
   - `DATABASE_URL`, `APP_URL` (ör. `https://senin-projen.vercel.app`)
   - `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`
   - `ANTHROPIC_API_KEY`: hediye önerileri için ([console.anthropic.com](https://console.anthropic.com) → API Keys)
4. Deploy et. Siteye gir, çekiliş oluştur ve linki paylaş.

## Nasıl çalışır?

| Link | Kim için |
|---|---|
| `/e/<slug>` | Herkese açık katılım sayfası (sadece isimler görünür) |
| `/e/<slug>/admin?key=…` | Owner paneli. Gizli anahtar veritabanında hash'li tutulur |
| `/e/<slug>/me?token=…` | Katılımcının kendi kaydı. Katılınca mail ile gelir |

Çekiliş `src/lib/draw.ts` içinde yapılır. Rastgele sıralı backtracking kullanır: kimse kendine çıkmaz, hariç tutulan çiftler birbirine çıkmaz, geçerli bir dağılım varsa mutlaka bulunur. En az 3 katılımcı gerekir. Çekilişten sonra katılım kapanır.
