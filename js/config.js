/* ============================================================
   KONFIGURASI API  —  OTAKUDESU (SANKA VOLLEREI)
   ============================================================ */

window.ANIME_API = {

    /* false = langsung ambil data live dari API Otakudesu */
    demo: false,

    /* Base URL API (tanpa / di akhir) */
    baseUrl: 'https://www.sankavollerei.web.id',

    /* Prefix path sesuai dokumentasi Otakudesu API */
    basePath: '/anime',

    /* API key / token (kosongkan jika tidak butuh) */
    apiKey: '',

    /* Header tambahan (opsional) */
    headers: {},

    /* Endpoint API sesuai dokumentasi Otakudesu */
    endpoints: {
        home:        '/home',
        all:         '/unlimited',
        recent:      '/ongoing-anime',
        ongoing:     '/ongoing-anime',
        completed:   '/complete-anime',
        popular:     '/complete-anime',
        movies:      '/complete-anime',
        list:        '/unlimited',
        schedule:    '/schedule',
        genres:      '/genre',
        byGenre:     '/genre/:genreId',
        search:      '/search/:q',
        detail:      '/anime/:id',
        episode:     '/episode/:episodeId',
        video:       '/episode/:episodeId'
    },

    /* Pembungkus utama response API */
    dataPath: 'data',

    /* Nama field disesuaikan dengan struktur JSON Otakudesu */
    fields: {
        id:          'animeId',
        title:       'title',
        poster:      'poster',
        description: 'synopsis',
        genres:      'genreList',
        status:      'status',
        episodes:    'episodes',
        rating:      'score',
        releaseDate: 'aired',
        video:       'stream_url'
    },

    /* Bagian di halaman depan (index.html) disesuaikan dengan JSON /anime/home */
    sections: [
        { container: '#trendingGrid', demoKey: 'trending', endpoint: 'home', dataPath: 'data.ongoing.animeList',  limit: 6 },
        { container: '#popularGrid',  demoKey: 'popular',  endpoint: 'home', dataPath: 'data.completed.animeList', limit: 6 },
        { container: '#recentGrid',   demoKey: 'recent',   endpoint: 'home', dataPath: 'data.ongoing.animeList',  limit: 6 },
        { container: '#liveGrid',     demoKey: 'live',     endpoint: 'home', dataPath: 'data.completed.animeList', limit: 6 }
    ]
};