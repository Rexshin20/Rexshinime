/* ============================================================
   DATA CONTOH (dipakai kalau js/config.js -> demo: true)
   Nanti kalau API kamu sudah siap, set demo: false
   dan file ini tidak dipakai lagi.
   ============================================================ */
(function () {
    'use strict';

    function make(prefix, folder, file, count, genre) {
        var rows = [];
        for (var i = 1; i <= count; i++) {
            rows.push({
                id: prefix + '-' + i,
                title: 'Judul Anime Contoh ' + i,
                poster: 'img/' + folder + '/' + file + '-' + (((i - 1) % 6) + 1) + '.jpg',
                description: 'Ini data contoh. Ganti sumber datanya di js/config.js supaya kelihatan anime asli dari API kamu.',
                genres: [genre, 'Fantasy'],
                status: i % 3 === 0 ? 'Completed' : 'Ongoing',
                episodes: String(6 + i),
                rating: (7 + (i % 3) * 0.5).toFixed(1),
                release_date: '2026'
            });
        }
        return rows;
    }

    window.ANIME_DEMO = {
        trending: make('trend', 'trending', 'trend', 6, 'Action'),
        popular: make('pop', 'popular', 'popular', 6, 'Adventure'),
        recent: make('recent', 'recent', 'recent', 6, 'Comedy'),
        live: make('live', 'live', 'live', 6, 'Drama'),
        list: make('list', 'trending', 'trend', 12, 'Action'),

        detail: {
            id: 'trend-1',
            title: 'Judul Anime Contoh 1',
            poster: 'img/anime/details-pic.jpg',
            description: 'Ini halaman detail contoh. Begitu API kamu diisi di js/config.js, semua teks, poster, genre, status, dan rating akan otomatis diambil dari API.',
            genres: ['Action', 'Adventure', 'Fantasy'],
            status: 'Ongoing',
            episodes: '12',
            rating: '8.5',
            release_date: '2026'
        }
    };
})();
