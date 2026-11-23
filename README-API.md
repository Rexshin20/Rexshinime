# Cara Pasang API Sendiri

Semua pengaturan API ada di **`js/config.js`**. File lain tidak perlu diubah.

## 1. Struktur file

```
js/config.js      <- tempat kamu isi API (base URL, key, endpoint, nama field)
js/api.js         <- helper fetch + render (jangan diedit)
js/demo-data.js   <- data contoh, dipakai saat demo: true
index.html        <- baris anime di halaman depan
categories.html   <- halaman katalog
anime-details.html<- halaman detail
```

## 2. Saat pertama kali buka

`config.js` masih memakai `demo: true`, jadi web menampilkan **data contoh**.
Setelah API kamu siap, ubah:

```js
demo: false,
baseUrl: 'https://api.domain-kamu.com',
basePath: '',   // misal '/anime/provider-kamu' kalau semua endpoint pakai prefix
```

## 3. Endpoint

Sesuaikan dengan dokumentasi API kamu:

```js
endpoints: {
    home:     '/home',
    list:     '/anime',
    detail:   '/anime/:id',
    episodes: '/anime/:id/episodes',
    video:    '/episode/:episodeId'
}
```

`:id` dan `:episodeId` otomatis diganti saat dipanggil.

Kalau API butuh key/token:

```js
apiKey: 'TOKEN_KAMU',
// atau kalau format headernya lain:
headers: { 'X-API-Key': 'TOKEN_KAMU' }
```

## 4. Nama field

Kalau nama field di JSON API kamu beda, ubah bagian `fields`:

```js
fields: {
    id:          'id',        // misal API pakai 'animeId'
    title:       'title',
    poster:      'poster',    // misal API pakai 'cover_image'
    description: 'description',
    genres:      'genres',    // boleh array atau string
    status:      'status',
    episodes:    'episodes',
    rating:      'rating',    // misal API pakai 'score'
    releaseDate: 'release_date',
    video:       'video'
}
```

Bisa juga pakai path bersarang, misal `id: 'info.animeId'`.

## 5. Bagian halaman depan

`config.js` punya `sections` untuk mengatur baris anime di `index.html`:

```js
sections: [
    {
        container: '#trendingGrid',      // kotak di HTML
        demoKey: 'trending',             // data contoh
        endpoint: 'home',                // endpoint API
        dataPath: 'data.trending',       // lokasi array di JSON
        limit: 6
    }
]
```

`dataPath` bisa menunjuk ke dalam object, contoh:

```js
dataPath: 'data.items'          // { "data": { "items": [...] } }
dataPath: 'data.recent.animeList'
```

Kalau API kamu mengembalikan array langsung, `dataPath: ''`.

## 6. Response yang dibungkus

Kalau response-nya `{ "status": "success", "data": {...} }`, set:

```js
dataPath: 'data'
```

## 7. Jalankan

Jangan buka HTML dengan double-click. Jalankan local server:

```powershell
cd D:\anime-v1.0.0
python -m http.server 8000
```

Buka `http://localhost:8000/index.html`.

## 8. Menambah bagian / endpoint baru

Misalnya API kamu punya endpoint: home, terbaru, ongoing, tamat, populer, movie,
semua anime, jadwal rilis, semua genre, by genre, pencarian, batch,
detail anime, detail episode, detail batch, dan link server.
Semuanya cukup ditambahkan di `endpoints`:

```js
endpoints: {
    home:        '/path-ke/home',
    recent:      '/path-ke/terbaru',
    ongoing:     '/path-ke/ongoing',
    completed:   '/path-ke/tamat',
    popular:     '/path-ke/populer',
    movies:      '/path-ke/movie',
    list:        '/path-ke/semua-anime',
    schedule:    '/path-ke/jadwal-rilis',
    genres:      '/path-ke/genre',
    byGenre:     '/path-ke/genre/:genreId',
    search:      '/path-ke/pencarian',
    batch:       '/path-ke/batch',
    detail:      '/path-ke/anime/:id',
    episode:     '/path-ke/episode/:episodeId',
    batchDetail: '/path-ke/batch/:batchId',
    server:      '/path-ke/server/:serverId'
}
```

`:genreId`, `:id`, `:episodeId`, `:batchId`, `:serverId` otomatis diganti
saat endpoint dipanggil.

### Menampilkan endpoint di halaman

Cukup tambah blok HTML dengan atribut `data-api-endpoint` — **tanpa ubah JS**:

```html
<div class="row"
     data-api-endpoint="ongoing"
     data-api-path="data.ongoing"
     data-api-limit="6">
</div>
```

- `data-api-endpoint` → nama endpoint di `endpoints`
- `data-api-path` → lokasi array di JSON
- `data-api-limit` → jumlah kartu

### Pencarian

```html
<form data-api-search data-api-target="#apiList" data-api-endpoint="search">
    <input name="q" placeholder="Cari anime...">
</form>
```

Atau panggil manual dari JS:

```js
AnimeAPI.loadList('#apiList', {
    endpoint: 'ongoing',
    dataPath: 'data.ongoing',
    limit: 6
});

AnimeAPI.loadList('#apiList', {
    endpoint: 'search',
    query: { q: 'naruto' }
});
```

## 9. Catatan

- Halaman yang sudah tersambung ke API: **home**, **katalog**, **detail**.
- Player video di `anime-watching.html` masih memakai file MP4/YouTube lokal
  yang diatur di `js/main.js` (`EPISODES`).
- Gunakan API/konten yang kamu punya haknya. Jangan pakai sumber bajakan.
