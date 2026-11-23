/*  ---------------------------------------------------
    Theme Name: Anime
    Description: Anime video tamplate
    Author: Colorib
    Author URI: https://colorib.com/
    Version: 1.0
    Created: Colorib
---------------------------------------------------------  */

'use strict';

(function ($) {

    /*------------------
        Preloader
    --------------------*/
    $(window).on('load', function () {
        $(".loader").fadeOut();
        $("#preloder").delay(200).fadeOut("slow");

        /*------------------
            FIlter
        --------------------*/
        $('.filter__controls li').on('click', function () {
            $('.filter__controls li').removeClass('active');
            $(this).addClass('active');
        });
        if ($('.filter__gallery').length > 0) {
            var containerEl = document.querySelector('.filter__gallery');
            var mixer = mixitup(containerEl);
        }
    });

    /*------------------
        Background Set
    --------------------*/
    $('.set-bg').each(function () {
        var bg = $(this).data('setbg');
        $(this).css('background-image', 'url(' + bg + ')');
    });

    // Search model
    $('.search-switch').on('click', function (e) {
        e.preventDefault();
        $('.search-model').fadeIn(400);
    });

    $('.search-close-switch').on('click', function () {
        $('.search-model').fadeOut(400, function () {
            $('#search-input').val('');
        });
    });

    $('.search-model-form').on('submit', function (e) {
        e.preventDefault();
        var q = $('#search-input').val().trim();
        if (!q) return;

        if ($('#apiList').length && window.AnimeAPI) {
            window.AnimeAPI.loadList('#apiList', {
                endpoint: 'search',
                query: { q: q }
            });
            $('.search-model').fadeOut(400);
        } else {
            window.location.href = './categories.html?q=' + encodeURIComponent(q);
        }
    });

    // Pencarian cepat di beranda (lebih mudah dipakai pengunjung awam)
    $('#homeSearchForm').on('submit', function (e) {
        e.preventDefault();
        var q = $('#homeSearchInput').val().trim();
        if (!q) return;
        window.location.href = './categories.html?q=' + encodeURIComponent(q);
    });

    /*------------------
		Navigation
	--------------------*/
    $(".mobile-menu").slicknav({
        prependTo: '#mobile-menu-wrap',
        allowParentLinks: true
    });

    /*------------------
		Hero Slider
	--------------------*/
    var hero_s = $(".hero__slider");
    var heroInit = function () {
        hero_s.owlCarousel({
            loop: true,
            margin: 0,
            items: 1,
            dots: true,
            nav: true,
            navText: ["<span class='arrow_carrot-left'></span>", "<span class='arrow_carrot-right'></span>"],
            animateOut: 'fadeOut',
            animateIn: 'fadeIn',
            smartSpeed: 1200,
            autoHeight: false,
            autoplay: true,
            mouseDrag: false
        });
    };

    if (hero_s.length && window.AnimeAPI && window.AnimeAPI.loadHero) {
        window.AnimeAPI.loadHero(hero_s, heroInit);
    } else if (hero_s.length) {
        heroInit();
    }

    /*------------------
        Niceselect
    --------------------*/
    $('select').niceSelect();

    /*------------------
        Scroll To Top
    --------------------*/
    $("#scrollToTopButton").click(function() {
        $("html, body").animate({ scrollTop: 0 }, "slow");
        return false;
    });

    /*------------------
        Data anime dari API (js/config.js)
    --------------------*/
    // Seluruh kartu anime bisa diklik (bukan cuma judulnya)
    $(document).on('click', '.product__item', function (event) {
        if ($(event.target).closest('a').length) return;

        var url = $(this).find('h5 a').attr('href');
        if (url && url !== '#') {
            window.location.href = url;
        }
    });

    if (window.AnimeAPI) {
        // Halaman depan: baris-baris anime (dari config.sections)
        window.AnimeAPI.loadSections();

        // Bandung "Recently Updated"
        window.AnimeAPI.loadRecentlyUpdated &&
            window.AnimeAPI.loadRecentlyUpdated(document.getElementById('recentlyUpdated'));

        // Kotak yang punya atribut data-api-endpoint
        window.AnimeAPI.loadBindings();

        // Form pencarian dengan atribut data-api-search
        window.AnimeAPI.bindSearch();

        // Halaman katalog + pagination
        if ($('#apiList').length) {
            var params = new URLSearchParams(window.location.search);
            var q = params.get('q');
            var filter = params.get('filter');
            var catalogPage = 1;

            if (filter) {
                var valid = $('#apiFilterSelect option').filter(function () {
                    return $(this).val() === filter;
                }).length;
                if (valid) $('#apiFilterSelect').val(filter);
            }

            var catalogEndpoint = $('#apiFilterSelect').val() || 'all';
            var PAGE_SIZE = 25;

            function renderPagination(page, hasNext) {
                var start = 1, end = 5;
                if (page > 3) {
                    start = page - 2;
                    end = page + 2;
                }
                if (!hasNext) {
                    end = page;
                    start = Math.max(1, page - 4);
                }

                var html = '<a href="#" data-page="' + (page - 1) + '"' +
                    (page <= 1 ? ' class="disabled"' : '') + '><i class="fa fa-angle-left"></i></a>';

                for (var i = start; i <= end; i++) {
                    html += '<a href="#" data-page="' + i + '"' +
                        (i === page ? ' class="current-page"' : '') + '>' + i + '</a>';
                }

                html += '<a href="#" data-page="' + (page + 1) + '"' +
                    (hasNext ? '' : ' class="disabled"') + '><i class="fa fa-angle-right"></i></a>';

                $('#apiPagination').html(html);
            }

            function loadCatalog() {
                var options = { endpoint: catalogEndpoint };
                var clientPaged = catalogEndpoint === 'all';

                if (q) {
                    options.endpoint = 'search';
                    options.query = { q: q };
                } else if (clientPaged) {
                    // /unlimited mengembalikan semua anime sekaligus → potong di browser.
                    options.dataPath = 'data.list';
                    options.offset = (catalogPage - 1) * PAGE_SIZE;
                    options.limit = PAGE_SIZE;
                } else {
                    options.query = { page: catalogPage };
                }

                window.AnimeAPI.loadList('#apiList', options, function (rows, total) {
                    var punyaHalamanBerikut;
                    if (clientPaged) {
                        punyaHalamanBerikut = (total || rows.length) > catalogPage * PAGE_SIZE;
                    } else {
                        punyaHalamanBerikut = !q && rows.length >= PAGE_SIZE;
                    }
                    renderPagination(catalogPage, punyaHalamanBerikut);
                });
            }

            if (q) $('#search-input').val(q);
            loadCatalog();

            $('#apiFilterSelect').on('change', function () {
                catalogEndpoint = $(this).val();
                catalogPage = 1;
                loadCatalog();
            });

            $(document).on('click', '#apiPagination a', function (event) {
                event.preventDefault();
                if ($(this).hasClass('disabled')) return;
                catalogPage = parseInt($(this).attr('data-page'), 10) || 1;
                loadCatalog();
                $('html, body').animate({ scrollTop: $('#apiList').offset().top - 80 }, 300);
            });
        }

        // Halaman detail
        if ($('#detailTitle').length) {
            window.AnimeAPI.loadDetail();
        }

        // Halaman nonton (anime-watching.html)
        if ($('#iframePlayerWrap').length && window.AnimeAPI.loadWatch) {
            window.AnimeAPI.loadWatch();
        }
    }

})(jQuery);