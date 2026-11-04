# Monopoli Blox — Vercel + Firebase (Google)
Frontend statis di Vercel, "server" = Firebase Realtime Database + Auth. Tanpa backend yang perlu dirawat.

## 1. Siapkan Firebase (gratis / Spark)
1. https://console.firebase.google.com → Add project.
2. Build → **Realtime Database** → Create (pilih region terdekat, mis. Singapore). Mode locked.
3. Build → **Authentication** → Sign-in method → aktifkan **Anonymous** dan **Google**.
4. Project settings → Your apps → Web (</>) → salin config ke `public/config.js`.
5. Realtime Database → **Rules** → tempel isi `database.rules.json`, ganti `GANTI_EMAIL_ADMIN@gmail.com` dengan email Google adminmu → Publish.

## 2. Deploy ke Vercel
- Lewat GitHub: push folder ini → vercel.com → Add New Project → Import. (Vercel membaca `vercel.json`, tanpa build.)
- Atau CLI: `npm i -g vercel` lalu `vercel --prod` di folder ini.
- Setelah dapat domain (mis. `monopoli.vercel.app`): Firebase → Authentication → Settings → **Authorized domains** → tambahkan domain itu (wajib agar login Google admin jalan).

## 3. Pakai
- Game: `https://domainmu.vercel.app/`  — Buat Ruang, bagikan kode 4 huruf, host menekan Mulai (2-6 pemain).
- Admin: `https://domainmu.vercel.app/admin` — masuk Google (email admin). Remote dadu (antrian per pemain / semua), mode dadu global, tambah uang, teleport.

## Catatan keamanan
Logika game berjalan di browser pemain (transaksi Firebase). Pengaturan dadu hanya bisa DITULIS admin (dikunci rules), tetapi pemain yang paham devtools bisa mengubah state-nya sendiri. Cocok untuk main bareng teman; untuk anti-cheat penuh, pindahkan logika ke Cloud Functions.

## Audio
`public/audio.js` membuat musik latar (loop chiptune ceria) dan efek suara (dadu, langkah, beli, bangun, sewa, kartu, penjara, giliranmu, bangkrut, menang) langsung di browser lewat Web Audio API — tanpa file mp3. Ada tombol 🎵 / 🔊 di pojok kanan bawah (tersimpan di perangkat). Musik mulai setelah klik pertama karena aturan autoplay browser. Volume diatur di `audio.js` (`musicG.gain` & `sfxG.gain`).
