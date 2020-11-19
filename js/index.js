async function getData(url) {
    return fetch(url).then(response => response.json());
}

function accordionComponent(name, getContent, renderContent) {
    var accordion = $(
        '<div class="accordion">'
        + '<div class="accordion__header">' + name + '</div>'
        + '<div class="accordion__content"></div>'
        + '</div>'
    );

    accordion.find('.accordion__header').on('click', (async function () {
        var content = accordion.find('.accordion__content');

        accordion.toggleClass('accordion--opened');

        if (content.children().length == 0) {
            var data = await getContent();
            content.append(renderContent(data));
        } else {
            content.slideToggle();
        }
    }));

    return accordion;
}

function getFavorites() {
    return JSON.parse(localStorage.getItem('favourites') || null) || [];
}

var favoriteStatus = function (favourites, item) {
    var position = 0;

    return {
        index: position,
        isExist: favourites.some(function (favourite, index) {
            position = index;
            return favourite.id === item.id;
        }),
    };
}

function imageComponent(item) {
    var favourites = getFavorites();
    var status = favoriteStatus(favourites, item);
    var image = $(
        ' <div class="image-list__item image">'
        + '<div class="image__favorite-button"></div>'
        + '<img src=' + item.thumbnailUrl + '>'
        + '</div>'
    );
    var starSelectedClass = 'image__favorite-button--selected';

    if (status.isExist) {
        image.find('.image__favorite-button').addClass(starSelectedClass)
    }

    image.find('.image__favorite-button').on('click', function () {
        var favourites = getFavorites();
        var status = favoriteStatus(favourites, item);

        if (status.isExist) {
            favourites.splice(status.index, 1)
            $(this).removeClass(starSelectedClass);
        } else {
            item.isSelected = true;
            favourites.push(item);

            $(this).addClass(starSelectedClass);
        }

        localStorage.setItem('favourites', JSON.stringify(favourites));
    });
    image.find('img').on('click', function () {
        $('body').addClass('disable-overflow');

        $('.popup').removeClass('popup--hidden');
        $('.popup__image').attr('src', item.url);
        $('.popup__title').html(item.title);
    });

    return image;
}

function renderFavouriteList() {
    var items = (JSON.parse(localStorage.getItem('favourites')) || []).map(function (item) {
        return imageComponent(item);
    });

    return $('<div class="image-list"></div>').append(items);
}

function renderUserList(users) {
    return users.filter(function (user) {
        return !!user.name;
    }).map(function (user) {
        var path = 'https://json.medrating.org/albums?userId=' + user.id;

        return accordionComponent(user.name, async function () {
            return await getData(path);
        }, renderAlbumList);
    });
}

function renderAlbumList(albums) {
    return albums.filter(function (album) {
        return !!album.title;
    }).map(function (album) {
        var path = 'https://json.medrating.org/photos?albumId=' + album.id;

        return accordionComponent(album.title, async function () {
            return await getData(path);
        }, renderImageList);
    });
}

function renderImageList(images) {
    var imageList = images.filter(function (image) {
        return !!image.title;
    }).map(function (image) {
        return imageComponent(image);
    });

    return $('<div class="image-list"></div>').append(imageList);
}

$(window).on('load', async function () {
    var catalog = document.getElementById('catalog');
    var favourites = document.getElementById('favourites');

    var users = await getData('https://json.medrating.org/users/');

    $(catalog).append(renderUserList(users));

    $('.tabs__nav--favourites').on('click', function () {
        $(favourites).html(renderFavouriteList);
    });

    $('.tabs__nav').on('click', function () {
        var root = $(this).closest('.tabs');
        var navs = $(this).parent().children();
        var items = root.find('.tabs__item');
        var index = $(this).parent().children().index(this);

        var itemActiveClass = 'tabs__item--active';
        var navActiveClass = 'tabs__nav--active';

        navs.removeClass(navActiveClass);
        navs.eq(index).addClass(navActiveClass);

        items.removeClass(itemActiveClass);
        items.eq(index).addClass(itemActiveClass);
    });

    $('.popup__close, .popup__overlay').on('click', function () {
        $('.popup').addClass('popup--hidden');
        $('body').removeClass('disable-overflow');
    });
})
