/* ============================================================
   API HELPER — Otakudesu API (Auto-Scan Tanpa Link Web Otakudesu)
   ============================================================ */
(function () {
    'use strict';

    var cache = {};

    function cfg() {
        return window.ANIME_API || {};
    }

    function isDemo() {
        return cfg().demo === true;
    }

    function esc(value) {
        return String(value === undefined || value === null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function readField(obj, path) {
        if (!obj || !path) return '';
        var value = path.split('.').reduce(function (o, key) {
            return o ? o[key] : '';
        }, obj);
        return value === undefined || value === null ? '' : value;
    }

    function unwrap(data, path) {
        if (!path) return data;
        var value = path.split('.').reduce(function (o, key) {
            return o ? o[key] : undefined;
        }, data);
        return value === undefined ? data : value;
    }

    function pickArray(response, path) {
        var rows = unwrap(response, path);

        if (!Array.isArray(rows) && rows && typeof rows === 'object') {
            var keys = Object.keys(rows);
            for (var i = 0; i < keys.length; i++) {
                if (Array.isArray(rows[keys[i]])) {
                    rows = rows[keys[i]];
                    break;
                }
            }
        }

        return Array.isArray(rows) ? rows : [];
    }

    function flattenRows(rows) {
        var groupKeys = ['animeList', 'list', 'batchList'];
        if (!Array.isArray(rows) || !rows.length || typeof rows[0] !== 'object') return rows;

        for (var k = 0; k < groupKeys.length; k++) {
            var key = groupKeys[k];
            if (!Array.isArray(rows[0][key])) continue;
            var out = [];
            for (var j = 0; j < rows.length; j++) {
                if (Array.isArray(rows[j][key])) out = out.concat(rows[j][key]);
            }
            return out;
        }
        return rows;
    }

    function pickArraySmart(response, path) {
        var rows = pickArray(response, path);
        if (rows.length) return rows;

        var alternatif = [
            'data.ongoing.animeList',
            'data.completed.animeList',
            'data.ongoing_anime',
            'data.complete_anime',
            'data.animeList',
            'data.list',
            'data'
        ];
        for (var i = 0; i < alternatif.length; i++) {
            rows = pickArray(response, alternatif[i]);
            if (rows.length) return rows;
        }
        return [];
    }

    function buildUrl(endpointKey, params, query) {
        var c = cfg();
        var path = (c.endpoints && c.endpoints[endpointKey]) || '/';
        var rest = {};

        if (params) {
            Object.keys(params).forEach(function (key) {
                path = path.split(':' + key).join(encodeURIComponent(params[key]));
            });
        }

        if (query) {
            Object.keys(query).forEach(function (key) {
                var value = query[key];
                if (value === undefined || value === null || value === '') return;

                // Endpoint /search/:q memakai kata kunci sebagai bagian path.
                if (path.indexOf(':' + key) !== -1) {
                    path = path.split(':' + key).join(encodeURIComponent(value));
                } else {
                    rest[key] = value;
                }
            });
        }

        // Kalau config search sempat bukan /search/:q, tetap paksa format yang benar.
        if (endpointKey === 'search' && query && query.q && path.indexOf('/search/') === -1) {
            path = '/search/' + encodeURIComponent(query.q);
            delete rest.q;
        }

        var url = c.baseUrl + (c.basePath || '') + path;
        var parts = [];
        Object.keys(rest).forEach(function (key) {
            parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(rest[key]));
        });

        if (parts.length) {
            url += (url.indexOf('?') === -1 ? '?' : '&') + parts.join('&');
        }

        return url;
    }

    function request(endpointKey, params, query) {
        var c = cfg();
        var url = buildUrl(endpointKey, params, query);

        if (cache[url]) return cache[url];

        var headers = { 'Accept': 'application/json' };
        Object.keys(c.headers || {}).forEach(function (key) {
            headers[key] = c.headers[key];
        });

        if (c.apiKey) {
            headers['Authorization'] = 'Bearer ' + c.apiKey;
        }

        var promise = fetch(url, { headers: headers }).then(function (response) {
            if (!response.ok) {
                throw new Error('HTTP ' + response.status + ' (' + url + ')');
            }
            return response.json();
        }).catch(function (error) {
            delete cache[url];
            throw error;
        });

        cache[url] = promise;
        return promise;
    }

    function normalizeGenres(genres) {
        if (!genres) return '';

        if (Array.isArray(genres)) {
            return genres.map(function (genre) {
                if (genre && typeof genre === 'object') {
                    return genre.name || genre.title || genre.slug || '';
                }
                return genre;
            }).filter(Boolean).join(', ');
        }

        if (typeof genres === 'object') {
            return Object.keys(genres).map(function (key) {
                return genres[key];
            }).join(', ');
        }

        return String(genres);
    }

    function posterHi(url) {
        if (!url) return '';
        return String(url)
            .replace(/(\.(?:jpg|jpeg|png|webp))-\d+x\d+\.(?:jpg|jpeg|png|webp)(?=\?|#|$)/i, '$1')
            .replace(/-\d+x\d+(?=\.[a-zA-Z0-9]+(?:\?|#|$))/i, '');
    }

    function renderCard(item) {
        var f = cfg().fields || {};
        var id = readField(item, f.id) || item.slug || item.animeId || item.id || '';
        var title = readField(item, f.title) || 'Tanpa Judul';
        var poster = readField(item, f.poster) || item.thumb || item.poster || '';
        var status = readField(item, f.status) || item.release_day || item.last_release_date || 'Anime';
        var genres = normalizeGenres(readField(item, f.genres)) || item.newest_release_date || 'Sub Indo';
        var episodes = readField(item, f.episodes) || item.episode_count || item.total_episode || '';
        var rating = readField(item, f.rating) || item.score || '';

        var detailUrl = './anime-details.html?id=' + encodeURIComponent(id);
        var placeholder = './img/poster-placeholder.svg';
        var posterFull = poster ? posterHi(poster) : placeholder;
        var fallback = poster ? "this.onerror=null;this.src='" + placeholder + "'" : '';

        var html = '<div class="col-lg-4 col-md-6 col-sm-6">';
        html += '<div class="product__item">';
        html += '<a class="product__item__pic" href="' + detailUrl + '">';
        html += '<img src="' + esc(posterFull) + '" alt="' + esc(title) + '" loading="lazy"' +
            ' data-anime-id="' + esc(id) + '"' +
            (fallback ? ' onerror="' + fallback + '"' : '') + '>';
        if (episodes) html += '<div class="ep">' + esc(episodes) + '</div>';
        if (rating) html += '<div class="view"><i class="fa fa-star"></i> ' + esc(rating) + '</div>';
        html += '</a>';
        html += '<div class="product__item__text">';
        html += '<ul><li>' + esc(status) + '</li><li>' + esc(genres) + '</li></ul>';
        html += '<h5><a href="' + detailUrl + '">' + esc(title) + '</a></h5>';
        html += '</div></div></div>';

        return html;
    }

    function renderSidebarCard(item) {
        var f = cfg().fields || {};
        var id = readField(item, f.id) || item.slug || item.animeId || item.id || '';
        var title = readField(item, f.title) || 'Tanpa Judul';
        var poster = readField(item, f.poster) || item.thumb || item.poster || '';
        var episodes = readField(item, f.episodes) || item.episode_count || item.total_episode || '';
        var rating = readField(item, f.rating) || item.score || '';
        var detailUrl = './anime-details.html?id=' + encodeURIComponent(id);
        var posterFull = posterHi(poster);

        var html = '<a class="product__sidebar__view__item set-bg" href="' + detailUrl + '"';
        if (poster) html += ' style="background-image:url(&quot;' + esc(posterFull) + '&quot;);display:block;"';
        else html += ' style="display:block;"';
        html += '>';
        if (episodes) html += '<div class="ep">' + esc(episodes) + '</div>';
        if (rating) html += '<div class="view"><i class="fa fa-star"></i> ' + esc(rating) + '</div>';
        html += '<h5><span>' + esc(title) + '</span></h5>';
        html += '</a>';
        return html;
    }

    function pickRenderer(type) {
        return type === 'sidebar' ? renderSidebarCard : renderCard;
    }

    function statusHtml(message) {
        return '<div class="col-lg-12"><p class="api-status">' + esc(message) + '</p></div>';
    }

    function errorHtml(error) {
        return statusHtml('Gagal memuat data: ' + error.message);
    }

    function demoData(key) {
        return (window.ANIME_DEMO || {})[key];
    }

    // ---------- Halaman depan ----------
    function sectionData(section) {
        if (isDemo()) {
            return Promise.resolve(demoData(section.demoKey) || []);
        }

        return request(section.endpoint || 'home').then(function (response) {
            return pickArraySmart(response, section.dataPath || cfg().dataPath);
        });
    }

    function loadSections() {
        (cfg().sections || []).forEach(function (section) {
            var box = document.querySelector(section.container);
            if (!box) return;

            box.innerHTML = statusHtml('Memuat data...');

            sectionData(section).then(function (rows) {
                if (section.limit) rows = rows.slice(0, section.limit);

                if (!rows.length) {
                    box.innerHTML = statusHtml('Belum ada data.');
                    return;
                }

                var render = pickRenderer(section.type);
                box.innerHTML = rows.map(render).join('');
            }).catch(function (error) {
                box.innerHTML = errorHtml(error);
            });
        });
    }

    // ---------- Hero slider (beranda) ----------
    function loadHero($slider, init) {
        if (!$slider || !$slider.length) {
            if (typeof init === 'function') init();
            return;
        }

        var promise;
        if (isDemo()) {
            promise = Promise.resolve(demoData('trending') || demoData('popular') || demoData('list') || []);
        } else {
            promise = request('home').then(function (response) {
                return pickArraySmart(response, 'data.ongoing.animeList');
            });
        }

        promise.then(function (rows) {
            if (!Array.isArray(rows) || !rows.length) {
                if (typeof init === 'function') init();
                return;
            }

            rows = rows.slice(0, 3);
            var f = cfg().fields || {};
            var html = rows.map(function (item, i) {
                var id = readField(item, f.id) || item.slug || item.id || '';
                var title = readField(item, f.title) || 'Anime';
                var poster = readField(item, f.poster) || item.thumb || item.poster || '';
                var desc = readField(item, f.description) || 'Tonton anime sub Indo terbaru dan terpopuler.';
                var label = item.current_episode || (i === 0 ? 'Trending' : i === 1 ? 'Populer' : 'Terbaru');
                var detailUrl = './anime-details.html?id=' + encodeURIComponent(id);
                var bg = posterHi(poster);

                var slide = '<div class="hero__items set-bg"';
                if (bg) slide += ' style="background-image:url(&quot;' + esc(bg) + '&quot;)"';
                slide += ' data-setbg="' + esc(bg) + '">';
                slide += '<div class="row"><div class="col-lg-7"><div class="hero__text">';
                slide += '<div class="label">' + esc(label) + '</div>';
                slide += '<h2>' + esc(title) + '</h2>';
                slide += '<p>' + esc(String(desc).slice(0, 140)) + (String(desc).length > 140 ? '...' : '') + '</p>';
                slide += '<a href="' + detailUrl + '"><span>Lihat Detail</span> <i class="fa fa-angle-right"></i></a>';
                slide += '</div></div></div></div>';
                return slide;
            }).join('');

            $slider.html(html);
            if (typeof init === 'function') init();
        }).catch(function () {
            if (typeof init === 'function') init();
        });
    }

    // ---------- Recently Updated (home) ----------
    function loadRecentlyUpdated(row, onDone) {
        if (!row) { if (typeof onDone === 'function') onDone(); return; }

        row.innerHTML = statusHtml('Memuat anime terbaru...');

        listData({ endpoint: 'recent', dataPath: 'data.animeList', limit: 0 }).then(function (rows) {
            if (!rows.length) {
                row.innerHTML = statusHtml('Belum ada data.');
                if (typeof onDone === 'function') onDone();
                return;
            }

            rows = rows.slice(0, 8);
            row.innerHTML = rows.map(renderCard).join('');
            if (typeof onDone === 'function') onDone();
        }).catch(function (error) {
            row.innerHTML = errorHtml(error);
            if (typeof onDone === 'function') onDone();
        });
    }

    // ---------- Halaman katalog ----------
    function listData(options) {
        options = options || {};

        if (isDemo()) {
            return Promise.resolve(demoData(options.demoKey || 'list') || []);
        }

        return request(
            options.endpoint || 'list',
            options.params,
            options.query
        ).then(function (response) {
            var rows = pickArraySmart(response, options.dataPath || cfg().dataPath);
            return flattenRows(rows);
        });
    }

    function renderRows(target, options, onDone) {
        target.innerHTML = statusHtml('Memuat data dari API...');

        return listData(options).then(function (semua) {
            var total = semua.length;
            var rows = semua;

            if (options.offset) rows = rows.slice(options.offset);
            if (options.limit) rows = rows.slice(0, options.limit);

            if (!rows.length) {
                target.innerHTML = statusHtml('Belum ada data.');
                if (typeof onDone === 'function') onDone(rows, total);
                return;
            }

            var render = pickRenderer(options.type);
            target.innerHTML = rows.map(render).join('');
            if (typeof onDone === 'function') onDone(rows, total);
        }).catch(function (error) {
            target.innerHTML = errorHtml(error);
            if (typeof onDone === 'function') onDone([], 0);
        });
    }

    function loadList(containerSelector, options, onDone) {
        var box = document.querySelector(containerSelector);
        if (box) return renderRows(box, options || {}, onDone);
    }

    function loadBindings() {
        var nodes = document.querySelectorAll('[data-api-endpoint]');

        Array.prototype.forEach.call(nodes, function (el) {
            renderRows(el, {
                endpoint: el.getAttribute('data-api-endpoint'),
                dataPath: el.getAttribute('data-api-path') || cfg().dataPath,
                demoKey: el.getAttribute('data-api-demo') || 'list',
                limit: parseInt(el.getAttribute('data-api-limit'), 10) || 0,
                type: el.getAttribute('data-api-type') || 'card'
            });
        });
    }

    function bindSearch() {
        var forms = document.querySelectorAll('[data-api-search]');

        Array.prototype.forEach.call(forms, function (form) {
            form.addEventListener('submit', function (event) {
                event.preventDefault();

                var input = form.querySelector('input[name="q"]') || form.querySelector('input');
                var target = form.getAttribute('data-api-target');
                if (!target) return;

                loadList(target, {
                    endpoint: form.getAttribute('data-api-endpoint') || 'list',
                    query: { q: input ? input.value : '' }
                });
            });
        });
    }

    // ---------- Halaman detail ----------
    function getDetailId() {
        return new URLSearchParams(window.location.search).get('id');
    }

    function setText(selector, value) {
        var el = document.querySelector(selector);
        if (el && value !== '' && value !== undefined && value !== null) {
            el.textContent = Array.isArray(value) ? value.join(', ') : value;
        }
    }

    function fillDetail(item, id) {
        var f = cfg().fields || {};
        var title = readField(item, f.title) || item.japanese_title || 'Tanpa Judul';
        var poster = readField(item, f.poster) || item.thumb || item.poster;
        var description = readField(item, f.description) || item.sinopsis || '';
        var genres = normalizeGenres(readField(item, f.genres));
        var status = readField(item, f.status) || item.type || '';
        var epList = item.episode_lists || item.episodeList || item.episodes || [];
        var epCount = item.episode_count || (Array.isArray(epList) ? epList.length : '');
        var rating = readField(item, f.rating) || item.score || '';
        var releaseDate = item.release_date || item.aired || '';

        setText('#detailTitle', title);
        setText('#detailDescription', description);
        setText('#detailStatus', status);
        setText('#detailGenres', genres);
        setText('#detailEpisodes', epCount);
        setText('#detailRating', rating);
        setText('#detailYear', releaseDate);

        var posterEl = document.querySelector('#detailPoster');
        if (posterEl && poster) {
            posterEl.style.backgroundImage = 'url("' + posterHi(poster) + '")';
        }

        var watchEl = document.querySelector('#detailWatch');
        if (watchEl && id) {
            watchEl.href = './anime-watching.html?anime=' + encodeURIComponent(id);
        }

        var episodeBox = document.querySelector('#detailEpisodeList');
        if (episodeBox) {
            episodeBox.innerHTML = '';
            var epTitle = document.createElement('div');
            epTitle.className = 'section-title';
            epTitle.innerHTML = '<h5>Daftar Episode</h5>';
            episodeBox.appendChild(epTitle);

            if (!Array.isArray(epList) || !epList.length) {
                var empty = document.createElement('p');
                empty.className = 'api-status';
                empty.textContent = 'Daftar episode belum tersedia.';
                episodeBox.appendChild(empty);
            } else {
                epList.forEach(function (ep) {
                    var a = document.createElement('a');
                    var epSlug = ep.slug || ep.episode_slug || ep.episodeId || ep.id || '';
                    var label = ep.episode || ep.title || epSlug;
                    a.href = './anime-watching.html?anime=' + encodeURIComponent(id) + (epSlug ? '&ep=' + encodeURIComponent(epSlug) : '');
                    a.textContent = label;
                    episodeBox.appendChild(a);
                });
            }
        }
    }

    function loadDetail() {
        var id = getDetailId();
        if (!id) return;

        var promise;
        if (isDemo()) {
            promise = Promise.resolve(demoData('detail') || {});
        } else {
            promise = request('detail', { id: id }).then(function (response) {
                return unwrap(response, cfg().dataPath);
            });
        }

        promise.then(function (item) {
            fillDetail(item || {}, id);
        }).catch(function (error) {
            console.error('Gagal memuat detail:', error);
        });
    }

    // ---------- Pemindai Rekursif Semua Link Video (Blokir Link Web Otakudesu) ----------
    function collectOtakudesuServers(data) {
        var options = [];
        var seen = {};

        function addOption(label, url) {
            if (!url || typeof url !== 'string' || url.indexOf('http') !== 0) return;
            var lower = url.toLowerCase();
            // Blokir URL ke web utama Otakudesu, API internal, atau file gambar
            if (lower.indexOf('otakudesu') !== -1 || lower.indexOf('sankavollerei.web.id') !== -1 || /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(lower)) return;
            if (seen[url]) return;
            seen[url] = true;
            options.push({ label: label, url: url });
        }

        var mainStream = data.stream_url || data.streamUrl || data.defaultStreamingUrl || data.url;
        if (mainStream) {
            addOption('Stream Utama (Default)', mainStream);
        }

        function scanNode(node, contextLabel) {
            if (!node) return;
            if (Array.isArray(node)) {
                node.forEach(function (item, idx) {
                    var itemLabel = '';
                    if (item && typeof item === 'object') {
                        itemLabel = item.resolution || item.quality || item.provider || item.name || item.title || '';
                    }
                    var nextCtx = [contextLabel, itemLabel].filter(Boolean).join(' - ') || ('Server ' + (idx + 1));
                    scanNode(item, nextCtx);
                });
                return;
            }
            if (typeof node === 'object') {
                var directUrl = node.stream_url || node.url || node.href || node.link || '';
                if (typeof directUrl === 'string' && directUrl.indexOf('http') === 0) {
                    var label = contextLabel || node.provider || node.name || node.title || 'Mirror';
                    addOption(label, directUrl);
                }

                Object.keys(node).forEach(function (key) {
                    // Lewati otakudesu_url, navigasi episode, dan gambar
                    if (key === 'otakudesu_url' || key === 'previous_episode' || key === 'next_episode' || key === 'anime' || key === 'poster' || key === 'thumb') return;
                    var val = node[key];
                    var keyLabel = /^(mp4|mkv|360p|480p|720p|1080p|\d+p)$/i.test(key) ? key.toUpperCase() : '';
                    var nextCtx = [contextLabel, keyLabel].filter(Boolean).join(' ');
                    if (typeof val === 'string' && val.indexOf('http') === 0) {
                        addOption([nextCtx, key].filter(Boolean).join(' - '), val);
                    } else if (typeof val === 'object' && val !== null) {
                        scanNode(val, nextCtx);
                    }
                });
            }
        }

        scanNode(data, '');
        return options;
    }

    function setPlayerUrl(url, iframeWrap, iframeEl, noticeEl) {
        iframeEl.removeAttribute('sandbox');
        iframeEl.src = url;
        iframeWrap.style.display = 'block';

        if (noticeEl) {
            noticeEl.innerHTML = 'Pilih resolusi/server lain di bawah jika player memblokir embed atau kualitas kurang HD. ' +
                '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-left:8px;padding:5px 12px;background:#e53637;color:#fff;border-radius:4px;font-weight:700;text-decoration:none;">' +
                '<i class="fa fa-external-link"></i> Buka di Tab Baru</a>';
        }
    }

    function loadEpisodeVideo(episodeSlug, noticeEl, serverWrap, iframeWrap, iframeEl) {
        if (noticeEl) noticeEl.textContent = 'Memuat video & daftar resolusi Otakudesu...';
        request('episode', { episodeId: episodeSlug }).then(function (res) {
            var data = unwrap(res, cfg().dataPath) || {};
            var title = data.episode || data.title || episodeSlug;
            setText('.breadcrumb__links span', title);

            var options = collectOtakudesuServers(data);

            if (options.length) {
                var bestIdx = 0;
                for (var i = 0; i < options.length; i++) {
                    var lbl = options[i].label.toLowerCase();
                    var u = options[i].url.toLowerCase();
                    if ((lbl.indexOf('720') !== -1 || lbl.indexOf('blogger') !== -1 || lbl.indexOf('pdrain') !== -1) && u.indexOf('desustream') === -1) {
                        bestIdx = i;
                        break;
                    }
                }

                setPlayerUrl(options[bestIdx].url, iframeWrap, iframeEl, noticeEl);

                if (serverWrap) {
                    serverWrap.style.display = 'block';
                    var html = '<div class="section-title"><h5>Pilih Resolusi / Server</h5></div>';
                    options.forEach(function (opt, idx) {
                        html += '<a href="#" class="srv-btn' + (idx === bestIdx ? ' active' : '') + '" data-url="' + esc(opt.url) + '">' + esc(opt.label) + '</a>';
                    });
                    serverWrap.innerHTML = html;

                    serverWrap.querySelectorAll('.srv-btn').forEach(function (btn) {
                        btn.addEventListener('click', function (e) {
                            e.preventDefault();
                            serverWrap.querySelectorAll('.srv-btn').forEach(function (b) { b.classList.remove('active'); });
                            btn.classList.add('active');
                            setPlayerUrl(btn.getAttribute('data-url'), iframeWrap, iframeEl, noticeEl);
                        });
                    });
                }
            } else if (noticeEl) {
                noticeEl.textContent = 'Link streaming & pilihan resolusi tidak ditemukan untuk episode ini.';
            }
        }).catch(function (err) {
            if (noticeEl) noticeEl.textContent = 'Gagal memuat video: ' + err.message;
        });
    }

    function loadWatch() {
        var params = new URLSearchParams(window.location.search);
        var animeSlug = params.get('anime') || params.get('id');
        var episodeSlug = params.get('ep') || params.get('episode');

        var iframeWrap = document.getElementById('iframePlayerWrap');
        var iframeEl = document.getElementById('videoIframe');
        var noticeEl = document.getElementById('watchNotice');
        var epWrap = document.getElementById('episodeList');
        var serverWrap = document.getElementById('serverList');

        if (!iframeWrap || !iframeEl) return;

        if (!animeSlug && !episodeSlug) {
            if (noticeEl) noticeEl.textContent = 'Pilih anime dari halaman detail untuk mulai menonton.';
            return;
        }

        if (animeSlug) {
            request('detail', { id: animeSlug }).then(function (res) {
                var data = unwrap(res, cfg().dataPath) || {};
                var episodes = data.episode_lists || data.episodeList || data.episodes || [];

                if (!Array.isArray(episodes) || !episodes.length) {
                    if (noticeEl) noticeEl.textContent = 'Daftar episode tidak ditemukan.';
                    return;
                }

                var defaultEp = episodes[episodes.length - 1];
                var activeEp = episodeSlug || defaultEp.slug || defaultEp.episode_slug || defaultEp.episodeId;

                if (epWrap) {
                    var html = '<div class="section-title"><h5>List Episode</h5></div>';
                    episodes.forEach(function (ep) {
                        var epSlug = ep.slug || ep.episode_slug || ep.episodeId || ep.id;
                        var label = ep.episode || ep.title || epSlug;
                        var isActive = epSlug === activeEp ? ' active' : '';
                        html += '<a href="?anime=' + encodeURIComponent(animeSlug) + '&ep=' + encodeURIComponent(epSlug) + '" class="' + isActive + '">' + esc(label) + '</a>';
                    });
                    epWrap.innerHTML = html;
                }

                loadEpisodeVideo(activeEp, noticeEl, serverWrap, iframeWrap, iframeEl);
            }).catch(function (err) {
                if (noticeEl) noticeEl.textContent = 'Gagal memuat episode: ' + err.message;
            });
        } else if (episodeSlug) {
            loadEpisodeVideo(episodeSlug, noticeEl, serverWrap, iframeWrap, iframeEl);
        }
    }

    window.AnimeAPI = {
        fetch: request,
        readField: readField,
        renderCard: renderCard,
        loadSections: loadSections,
        loadHero: loadHero,
        loadRecentlyUpdated: loadRecentlyUpdated,
        loadList: loadList,
        loadBindings: loadBindings,
        bindSearch: bindSearch,
        loadDetail: loadDetail,
        loadWatch: loadWatch
    };
})();