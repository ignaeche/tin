// ==UserScript==
// @name         Tiny Improvements for Netflix (TIN)
// @namespace    https://github.com/ignaeche
// @version      1.10
// @description  Improve Netflix by viewing expiring titles at the top of your list, adding search links and more...
// @author       Ignacio
// @match        http://*.netflix.com/*
// @match        https://*.netflix.com/*
// @grant        GM_addStyle
// @grant        unsafeWindow
// @grant        GM_getResourceText
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAydJREFUeNrsWr160zAUlS07beDLxpQ+ANlY4AE6Zkk3FrqxNFsnNiY2pm5lYWsXNrqwNQ8AC1vzAOQF/PHTOLU5ilzhWLJklWI5H9LnIf6RfM/VufceKQ6+9R+RbW4h2fK29QAi8evJw22y++t3TyEPwAPwADwAD8AD8AA8gJKYa9IeZ+TpDRllZJj/ubgIyFVIvlAyDzsMYLIi0+WG3Rt3b5Gc9shF1DEKwesffpI317XWi4YH8BgeRpeuAIAp73/ZGXSHLv8KADwKUwa59aCDdcdh7joGwAel9eD6IixCFp7GIT82WNPp5a47APAfEo5s+usdlnDkEH+1rMJAdwyCLm4otL+qXkkC8ryvsB4NmQe3EsnWg5W7GRhlCiuTenfC0+cxOVpWJ4HEG6fPNoc9jYvZPkzZXRH6GA2eQlI2TqCOQvIM6NtZRD6Hui6wvoIQAKZp9SJ/O2iJ412vAGkNIJGrVWoYKwnUBNPniYmWZhyb5r21MTCnCq+c3HdynDQIEmCQ04kZwJXqzv4N+fSD5fhpWiSZdhpeZ02hGWWUUNYBmI7j6PYUtPlLPYeOZzHrO8xYnLxILTKyrpC97TGOGhufX6HnLmIWzUnj9I/khtpSJB/KwFxSJqhkhbKgllICQ5/Hdr6En0DZ5noOXhfWly/KknaU3UnMYRIgB2yrKWAAgybyRPtYw4DLxpo8bELQ8QNyvMu8YoXk5NosBOtiJrn3BQ1iekYLlcYF3F5eq+SEnjtcGUpH20tKUa3KBQsYDtZVU0ZirH2dWNSDBgiVcV/BBwTDIO88ADEzgKFcoDmgkCwbUadm1BzuXdmV4Om84uBx31CelMpiEbqgENcR8jJXT+jpUr1OcAAA1su1kO+vKPUjF6ryrRl1RCEuweXMyHd+cHABB3ogWnhlUC9xYncAMAnHO4w2GgFnVGkthHWozyqy0rIqDo43tsR2g20gQsNCAiZBGwCiJr6EmNNv7pajFrxvsyAE4nObJt9K8O31PSlqYTFbkYUteZ2UvpWIbJk979hfIv4vJg/AA/AAPAAPwAPwAP5nAJGs7/wMeAA27bcAAwBa7y0qtn/RnAAAAABJRU5ErkJggg==
// @resource     locale_en locales/en.json
// @resource     locale_es locales/es.json
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js#sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8=
// @require      https://cdnjs.cloudflare.com/ajax/libs/i18next/11.5.0/i18next.min.js#sha256-OkYwGDArM5E/cUjqyUWhWooD5cUY3HmiwTQE9kiKa/s=
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.22.2/moment-with-locales.min.js#sha256-VrmtNHAdGzjNsUNtWYG55xxE9xDTz4gF63x/prKXKH0=
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment-duration-format/2.2.2/moment-duration-format.min.js#sha256-bXC/nhRjq/J7K4hnL8yvthqXkskSKOsZNfrLgXBigYg=
// @updateURL    https://github.com/ignaeche/tin/raw/master/tin.user.js
// @downloadURL  https://github.com/ignaeche/tin/raw/master/tin.user.js
// @supportURL   https://github.com/ignaeche/tin/issues
// ==/UserScript==

// Tested on Chrome 68+ and Tampermonkey

/**
 * Wrap Netflix's Falcor pathEvaluator get/calls
 */
class FalcorWrapper {
    constructor(pathEvaluator) {
        this.pathEvaluator = pathEvaluator;
    }

    /**
     * Get My List length
     * @returns {Promise}
     */
    getMyListLength() {
        return this.pathEvaluator.getValue(["mylist", "length"]);
    }

    /**
     * Get My List
     * @returns {Promise}
     */
    getMyList() {
        const values = ["availability","availabilityEndDateNear","delivery","interactiveBookmark","maturity","numSeasonsLabel","queue","releaseYear","runtime","seasonCount","summary","title","userRating","userRatingRequestId"]
        return this.getMyListLength()
        .then(length => {
            return this.pathEvaluator.get(["mylist", "length"], ["mylist", { from: 0, to: length - 1 }, values])
        });
    }

    /**
     * Get Expiring Titles
     * @returns {Promise}
     */
    getExpiringTitlesAndStats() {
        return this.getMyList()
        .then(response => {
            const list = response.json.mylist;
            delete list.$__path;
            const expiring = Object.values(list).filter(title => {
                return title.availabilityEndDateNear;
            });
            const stats = NetflixTitle.getMyListStats(list);
            return {
                mylist: { length: response.json.mylist.length, stats },
                expiring
            }
        })
    }
};

/**
 * Helper functions for Netflix title manipulation
 */
class NetflixTitle {
    constructor() { }

    /**
     * Get number of movies and shows
     * @param {Array} list - 'My List' array
     * @returns {object} - { movie, show }
     */
    static getMyListStats(list) {
        return Object.values(list).reduce((acc, cur) => {
            try {
                if (typeof cur === "object") {
                    acc[cur.summary.type] = (acc[cur.summary.type] || 0) + 1;
                }
            } catch (err) {
                () => {};
            }
            return acc;
        }, { movie: 0, show: 0 })
    }

    /**
     * Determine if title is a TV show
     * @param {object} title - Netflix title
     * @returns {boolean}
     */
    static isTVShow(title) {
        return (title.summary.type === "show");
    }

    /**
     * Make search link icons
     * @param {jQuery} $ - jQuery instance
     * @param {string} title - Title of movie or show
     * @param {string} year - Release year
     * @returns {object} - div
     */
    static makeSearchLinks($, title, year) {
        const titleAndYear = title.concat(` (${year})`)

        // Create 'links' div
        const links = $("<div>", { class: SELECTORS.SEARCHES, [ATTRS.TITLE]: title, [ATTRS.YEAR]: year })

        // For every key, create a search link
        $.each(SEARCHES, (key, item) => {
            let query = item.useYear ? titleAndYear : title;
            if (!item.hasOwnProperty("spaces") || !item.spaces) {
                query = query.replace(/\s/gi, '+')
            }
            const link = $("<a>", { href: item.url.replace('%s', query), target: "_blank" })
            link.append($("<img>", { class: `${SELECTORS.IMG_PREFIX}${key}`, title: item.name }))
            links.append(link)
        });
        return links;
    }

    /**
     * Make img object with a category icon
     * @param {jQuery} $ - jQuery instance
     * @param {i18next} i18next - instance
     * @param {object} title - Netflix title object
     * @returns {object} - img
     */
    static makeCategoryIcon($, i18next, title) {
        const img = $("<img>", { class: SELECTORS.CAT_ICON })
        const suffix = title.summary.type;
        img.attr({
            src: CATEGORY_ICONS[suffix],
            title: i18next.t(`cats.${suffix}`)
        })
        return img;
    }

    /**
     * Make link to title page
     * @param {jQuery} $ - jQuery instance
     * @param {object} title - Netflix title object
     * @returns {object} - anchor
     */
    static makeTitleLink($, title) {
        return $("<a>", { href: `/title/${title.summary.id}`, text: title.title })
    }

    /**
     * Sort the array of expiring titles according to expiring date
     * @param {Moment} moment - instance
     * @param {Array} titles - Netflix titles
     * @returns {Array} - sorted array of expiring titles
     */
    static sortExpiringTitles(moment, titles) {
        const mapped = titles.map(title => {
            const date = moment(title.availabilityEndDateNear, "l");
            title.tinExpireDate = date;
            return title;
        });
        mapped.sort((a, b) => {
            if (a.tinExpireDate.isBefore(b.tinExpireDate)) return -1;
            if (a.tinExpireDate.isAfter(b.tinExpireDate)) return 1;
            return 0;
        });
        return mapped;
    }
}

/**
 * Class to build expiring titles box
 */
class ExpiringTitlesBuilder {
    /**
     * Construct with instances
     * @param {jQuery} $ - jQuery instance
     * @param {i18next} i18next - instance
     * @param {Moment} moment - instance
     */
    constructor($, i18next, moment) {
        this.$ = $;
        this.i18next = i18next;
        this.moment = moment;
    }

    /**
     * Get main expiring title div
     * Create and prepend if not present in page
     * @param {object} parent - element to prepend main div
     */
    getMainDiv(parent) {
        const $ = this.$;
        if ($(`#${SELECTORS.EXPIRING_TITLES}`).length) {
            $(`#${SELECTORS.EXPIRING_TITLES}`).empty();
            this.div = $(`#${SELECTORS.EXPIRING_TITLES}`);
        } else {
            this.div = this.$("<div>", { id: SELECTORS.EXPIRING_TITLES });
            parent.prepend(this.div)
        }
        return this;
    }

    /**
     * Add row with number of expiring titles
     * @param {number} length - number of expiring titles
     */
    addCountExpirationRow(length) {
        const $ = this.$;
        const i18next = this.i18next;

        const options = { count: length };
        if (length == 0) options.context = 'empty';

        $("<div>", {
            class: SELECTORS.EXPIRING_TITLES_ROW,
            text: i18next.t('list.title', options)
        }).appendTo(this.div);

        return this;
    }

    /**
     * Add row with My List stats
     * @param {object} mylist - object with my list stats
     */
    addMyListStats(mylist) {
        const $ = this.$;
        const i18next = this.i18next;

        const options = { count: mylist.length };
        if (mylist.length == 0) options.context = 'empty';

        $("<div>", {
            class: SELECTORS.EXPIRING_TITLES_ROW,
            html: `${i18next.t('list.stats', options)} (${i18next.t('list.categoryCount', { stats: mylist.stats })})`
        }).appendTo(this.div);

        return this;
    }

    /**
     * Add row with expiring title information
     * @param {object} title - Netflix title object
     */
    addNetflixTitleRow(title) {
        const $ = this.$;
        const i18next = this.i18next;
        const moment = this.moment;
        const item = $("<div>", { class: SELECTORS.EXPIRING_TITLES_ROW })

        // Add search links and category icon
        item.append(NetflixTitle.makeSearchLinks($, title.title, title.releaseYear));
        item.append(NetflixTitle.makeCategoryIcon($, i18next, title));

        // Add link to title page
        const titleLink = NetflixTitle.makeTitleLink($, title);
        titleLink.addClass(SELECTORS.TITLE_PAGE_LINK)
        item.append(titleLink);

        // Year
        item.append(` (${title.releaseYear})`);

        // Expiration text 'expires in X days (DATE)'
        const tilExpiration = moment().to(title.tinExpireDate);
        const formattedDate = title.tinExpireDate.format('L')
        item.append(` ${i18next.t('list.expires')} ${tilExpiration} (${formattedDate})`);

        // Duration (if show show season label, else format seconds)
        const duration = title.numSeasonsLabel || moment.duration(title.runtime, 'seconds').format('HH:mm', { trim: false });
        // const icon = $("<i>", { class: "material-icons", text: "play_circle_outline" });
        const durationSpan = $("<div>", { class: SELECTORS.DURATION, text: duration });
        // durationSpan.prepend(icon);
        item.append(durationSpan);

        // If in manual ordering list type, show action links
        const titleRowSelector = `div[data-id='${title.summary.id}']`;
        const titleRow = $(`div[data-id='${title.summary.id}']`);
        if (titleRow.length) {
            const actionLink = (href, text, icon) => {
                const anchor = $("<a>", {
                    class: SELECTORS.ACTION_LINK,
                    href: href,
                    html: text
                });
                anchor.append($("<i>", { class: "material-icons", text: icon }));
                return anchor;
            };
            const href = {
                top: `javascript:document.querySelector("${titleRowSelector} .move-to-top").firstElementChild.click()`,
                view: `javascript:document.querySelector("${titleRowSelector}").scrollIntoView({ behavior: "smooth" })`,
                remove: `javascript:if (confirm("Are you sure you want to remove ${title.title}?")) document.querySelector("${titleRowSelector} .remove").firstElementChild.click()`
            }

            const links = $("<div>", { class: SELECTORS.ACTIONS })
            item.append(links)
            // Append action links
            if ($(".move-to-top", titleRow).length) {
                links.append(actionLink(href.top, i18next.t('actions.bringToTop'), "arrow_upward"))
            }
            links.append(actionLink(href.view, i18next.t('actions.viewInList'), "arrow_downward"))
            links.append(actionLink(href.remove, i18next.t('actions.removeFromList'), "close"));
        }

        // Append to main div
        this.div.append(item);

        return this;
    }

    /**
     * Build Expiring Titles box
     * @param {jQuery} $ - jQuery instance
     * @param {i18next} i18next - instance
     * @param {Moment} moment - instance
     * @param {object} parent - parent of expiring titles div
     * @param {object} mylist - object with 'My List' stats (e.g. length)
     * @param {Array} expiring - array of expiring titles
     */
    static build($, i18next, moment, parent, mylist, expiring) {
        const sortedExpiring = NetflixTitle.sortExpiringTitles(moment, expiring);
        const builder = new ExpiringTitlesBuilder($, i18next, moment)
            .getMainDiv(parent)
            .addMyListStats(mylist)
            .addCountExpirationRow(sortedExpiring.length);
        $.each(sortedExpiring, (_, title) => {
            builder.addNetflixTitleRow(title);
        })
        return builder;
    }
}

/**
 * To add a search link, add another entry to SEARCHES with a unique key:
 * key {
 *      name: String        // Name of site, shown in tooltip
 *      url: URL            // Search URL, use %s for the query string
 *      useYear: Boolean    // true if you want the year included in the query string, e.g. "Arrested Development (2003)"
 *      spaces: Boolean     // not required, true if you don't want to replace whitespaces with pluses (+)
 *      icon: Image         // Data URI containing a 16x16 image representing the site
 * }
 */
const SEARCHES = {
    imdb: {
        name: "IMDb",
        url: "https://www.imdb.com/find?q=%s",
        useYear: true,
        icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAABZ0lEQVR4AY2StQLUQBCGZ9YuhrtbRYO7tbSU2AvwTDwAUmIN7u4uFdqd38V2dpmQa/D88ex+4/jh2sIgVB7+LwTIUqu0VkGoGwJkQVkLtoSGgGWAyurRkKCy8lA9fhHjWO8R4N3kD9Qe+Pv2w+z2o/GKJeb+s3TvnuTmw/G0KbI3oN7AbVkbtjR8+mYP75sWhsiAPHJg+o2H2ckzfefg+Jk+Apy+MOz23eOXWadDNx6kw7E7d3n08l0eh3LhLCGoBEfAYiAKxO3HqfeAwCcuWaj5vSjAGHz6Jn/wLGMPwpaeAe8Z8/Nmc0p+5jQ5ycRN7i2NgUYiXyVNFmqACKbGgteSWFjyzvlP30rexEya+wr2P5IuC1g4R+1cHy1baBbM0UajVtgfUnfgOj1atdTMmyUDg+Rgw+qQO4aXji4JI/3X0mPlnOU8CAHpqOSgmzbOYd3punHNRPVokGo6S1WVxmMi2xTIC/oOMPbWxI+43LUAAAAASUVORK5CYII="
    },
    wikipedia: {
        name: "Wikipedia",
        url: "https://en.wikipedia.org/wiki/Special:Search/%s",
        useYear: false,
        spaces: true,
        icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAAAAAA6mKC9AAAAjUlEQVR4AWP4jwbIEvh0fP+pOweP3D1++O6Jw2+AAj/3eix725D1euqCDzPnfQNp+dvY//9a3IWVH3+veAUx43jU03/NaSf/394CNfRr9rL/x33v/t9yD2bL2tTPByPmvln3GybwMmb11l1xay4h3DEl4tb3rKofCIHrC//837sPyaV/f/3//+cPkX4BAP7w53hfR2QWAAAAAElFTkSuQmCC"
    },
    google: {
        name: "Google",
        url: "https://www.google.com/search?q=%s",
        useYear: true,
        icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACkUlEQVQ4T2NkwALez58vwPz5Ver/L99M/jP8Y2Hi5LjNwM49ny+r4Ca6ckZkgddzO3nZH7/b+P3cKQfGr19Q5BgYmRiYdY3us2uqBfGkFV6A6YMr+jhnqsrf40fO/3lwhwebq2BiTJLSP4VtPXkZ09N/g8TABvyfNIn9/eXjr/7cu8MHU8gsp/iNSVbuAhML29d/715r/756SYqBm+c/p5tvOG9WwWoUF3xZULX82+LdEWBBJiYGDjev+byl9cmMDAz/YQq/TO2P/s/M+Ic3o2AlsgsZ//9nYPx1RP4XwydNlo+T3zOw2bhsE6hp9cbnDRQDft8qc2V41L8LJPiXzeTPt+sJIkLp6R9hino2/5jy9/9/IWwGinIx1jD+vZFd8+/JrGZwWPCZvGUzOy6CrDh80pdfrz8zsGIzIMCEJZ/x742c6n9PZraAFPzjNXnHbn5cmFgDAo1Zyxl/361yZrjfvQek6TyXx58TouHCeaoxn2CGtK3/sfbXv/9wQ8/c/WP37TcjOPbCzVkDwYH487DSzxWMzqzTnr1ncJWz2tZqWYQ1ECfv/Bmw/szv9SDNnKz//4eY8nCBTZpxsnfZnPvHIsGxyMjE4KVgt6jBLDeBgRERjVMOnrM7cUVt17MPDOwgdSaKzFe6ojh1wQZMuj2J/eSdBy9vfnzID3O6LK/EdwUemUsszMzf3377oHL9w10ZPV5HhnsXwxk4WVj++xizG6U5sl2AJ+Vpl5YqHX525sLtD4948aUBTX7dv6YsZQV5rlxT4EkZpqH74iLuD19frzv24oLL51/fmJANYmJkZNAR1nhuKKwelWsYewAlKaPbCDKI4c+fxK9/vpoyMPznYGfmuMvNxLUkzyjmGrpaAKZq/PMMIXR7AAAAAElFTkSuQmCC"
    },
    rt: {
        name: "Rotten Tomatoes",
        url: "https://www.rottentomatoes.com/search/?search=%s",
        useYear: false,
        icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAABgFBMVEUAAAAAkSwAkSwAkSwDkCwAmi/5MQlyYhsAkSwAkSwAkSwAkSwAkSwAkSwAkSwAkSwAkSwAkSwAkSwAkSwAkSwAkSwAkSwAkSwAkSwAkSwAkSwAkSwAkSwAkiwAky0Aky0DkCwNjSoAoTIAlS0Aky0EkCwHjisAkSwfhSgngidAeSN4YxunURXZPQ3/LghWcCBBeCM5eySDXhpHdiILjSuwTRPnOAzwNAr8MAn5MQn5MQn6MQn1MgnvNQrxNAqEXhmiUxX1Mwr5MQn5MQn5MQn5MQn4MQn4Mgn8MAn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQkAkiz9MAj6MQnvNQr7MAn6MQn5MQn5MQn6MQn6MQn5MQn5MQn5MQn5MQn5MQn///8IscoRAAAAcHRSTlMAAAAAAAAAAFWiET1ECgs8etip7LkhAQRr2fn8/9y9pF0MC2HP/f7/+/z+/vWeIV3u/vn5/fr8/f/DJRO1/v35+/6jCmf4//7/70i1jtqz3bbBknr88EshzKIKSOPCJABCwvrxnyIYbb/s/frhqE4K0dAo8QAAAAFiS0dEf0i/ceUAAAAHdElNRQfiCAMAOBch0c06AAAAwUlEQVQY02NgYGBk5ODk4ubhZWQAA0ZGPn4BQSFhEVExJmawgLiEpJS0TIGsnLyCIgtQgFVJWUVVTV1DU0tbR1ePjY2BXd/A0MjYxNTM3KKwyNKKjcHaptjWzt7BsaS0rLy83MmZwcW1otLN3aOquhwEPL0YvIFUTW1dORT4MPiWowA/Bn9UgQCGQFSBIIbgEGR+aBhDeASyQGQUA1t0DIIfG8fGwBafkJgE4SanpAKdzsDGlpaekZmVnZOblw/kAgAQSk3/25BS5gAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAxOC0wOC0wM1QwMDo1NjoyMy0wNzowMKdZyvkAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMTgtMDgtMDNUMDA6NTY6MjMtMDc6MDDWBHJFAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAABJRU5ErkJggg=="
    },
    mc: {
        name: "Metacritic",
        url: "http://www.metacritic.com/search/all/%s/results",
        useYear: false,
        icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAABvFBMVEUAAAD/2x3/3Br/3R7/3hf/1SqnjkSIc0VtWzN7Zy/jvDT/4hr/4BCeiUI1NTQZHyoAChcqLzkwMz4VGx9oXTb/4iP/0yyBckEFEyMhJi4eICBlYWD///+Mi5QAARRGQC2yl0EPGCctLzIWGhgaHh7X1dTn5eW6t7YAABFoWTH/5Bv/2iBGQjkaISskJiRQTU2YlJQkJiYaHR3V09Klpq4kJyzUsC/PqkApLDEBCg1QTExpZWUAAAInKSnU0dFcXm1wXSr/3RymjUQPFyEuLy/Oy8u9urp5dHRva2o+PDyMiIcXHyl0Yz7/3CGGcDA1OEFZVlUDAABkYGCBfX0bHh4RGiWAbUf/3BvAnTYkJy2sqq3Qzs4zMzNmY2LAvLwjJSUyMjEXHimYgET/3B3/3ig5Ni0AAA+tqKXf3d0HDw8uLi0oKzAqLDDnwDa+okYABxkKExevqqc6OTkRFhYwMDA3NzcCECKDcUP/4A2Le0YAAhYABhLGw8Pa2NYxMTEtLi4mKS8DECJcVD7/3xGqk0YrLCoYHSgHEx8cIi0sLjF9b0H/0y3/3Bj/2i2ehDl+ajyNd0idhULsxDT/2x8RlHs5AAAAAXRSTlMAQObYZgAAAAFiS0dEHJwEQQcAAAAHdElNRQfiCAMBAxZrpnijAAAA5ElEQVQY02NgAANGJmZmBgRgYWVj5+Dk4obxeXj5+AUEhYRFRMUgfHEJSSlpGRlZOXlREJ9JQVFJWUVGVU1GXUNTCyigraOrp28gY2hkLGNiagYUMLewtJKRkbG2sbWTsXdwZGB0cnZxdXOXkfGw8fTy9mFi8PXzl5EJCAySkQkOCQkNC2dgiIiMkomOsYmViYtPSExKZmBISU1Ll8lwyQyIycrOyQW5Oi+/oFBGpqi4pLSsnAfkkIrKquqa2rr6hsYmFojTm1ta20LbOzq7WLqhnunp7eufMHFSM5J/JyeHJ0NYAPqtMJ5Tbi+hAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE4LTA4LTAzVDAxOjAzOjIyLTA3OjAwS8Z/zgAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxOC0wOC0wM1QwMTowMzoyMi0wNzowMDqbx3IAAAAASUVORK5CYII="
    },
    youtube: {
        name: "YouTube",
        url: "https://www.youtube.com/results?search_query=%s",
        useYear: true,
        icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAAAyVBMVEUAAAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/ExP/Cwv/aWn/qan/NDT/AgL/c3P/////6Oj/goL/EBD/6Oj/goL/EBD/aWn/qan/ExP/Cwuhhl/PAAAAMHRSTlMAAAMYKjU8QkQqGQMHd9nq8PT3+OrZeDnp6Tlg+vpgdv7+doKC2enw9OkYKjU8Khlzuyh4AAAAAWJLR0Q4oAel1gAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB+IIAwQKJpp2Ma0AAACKSURBVBjTY2AgCBiZmFlY2dg5ONjZWDm5uBkZeHj5+AUEhYSFhQQFRETFeBjEJQyQgKQUg7QMiGFoBBGQlWOQVwAxjE1MzUC0ohKDMljG3MLSyhrEUIEL2NjaQQQgWuwd4Foghjo6wQ3FsJaHV1VNXQPkMA11TZDDGJm0tHV0QU7X1dHTBzqdIAAA5eYbZ8jEF9kAAAAldEVYdGRhdGU6Y3JlYXRlADIwMTgtMDgtMDNUMDQ6MTA6MzgtMDQ6MDAGP1ggAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDE4LTA4LTAzVDA0OjEwOjM4LTA0OjAwd2LgnAAAAABJRU5ErkJggg=="
    },
    amazon: {
        name: "Amazon",
        url: "https://www.amazon.com/s/?url=search-alias%3Daps&field-keywords=%s",
        useYear: false,
        icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQEAYAAABPYyMiAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0T///////8JWPfcAAAAB3RJTUUH4ggDARcJyACiAwAABNJJREFUSMedlW1M1VUcxz//y727V7pICWjiA1LjwUQwNxeamoZIjXDtEllZ0QtXL0qsTTJarBDBHqUSXJNp0CpWmQ8bkOJmq5ZOimsqpiKmIA+iPN7L8F683G8vLi/Mhqy+bz5nO+ds331/352DJEkzPglwZ26ALkO3apu2aZvkcro6XB1Sa0nr/tb9UvtgR3RHtORJ8Tg8Do2jgcUB7ugMcNomAovPdwc4knzrld703rW9a6WSx0vaS9qllXelRaZFSnFPxmfFZ0lzmxJbEluk1T8/9cVTX0h179S117VL/iX+pf6lYxnx/TRq5MaoAfcvtx7xnPKc8pyS1pXmpOakSua5lihLlBRUZY41x0oRayavnrxasn02Yd2EdRIASFExszJnZUr1ufVH6o+Ml0h/HmNtHXf+EfZHmDSl4+6zd5+VjGWmIlOR9PKJV/JfyZcatzcebTwqbQnbUralTJoQGhwVHCUZy0xrTWulj45vfXbrs+MZkMyMoWmDkW2RbVCStrV8azn03dv3TN8zkO5Mv5p+FaYfml42vQx67b3hveFg326vtlfD9fSh4KFguPbXtY3XNgLzuK3GNBCxJMIWYYOMpIwzGWeg9kxtT20PFI5sbtjcABdXXEy6mASdyZ3xnfHgOuKqd9UDbxpewwu+/T6nzwk4bm/ANNbGgDFgH7BDTuH6peuXwvOzspuym6BqR1VbVRsYjcZh4zAkxia6El1g9VuHrcNAMRVUANFEE834Gms237z7bdC3QZL1nK3H1iMFZZsLzAVS/ov57ny35HF53B635DQ7M52Z0uSSKQenHJSAPeyRcu/MvZB7YfwOjJlAo6Nxe+N28L7q/dL7JVjLbMW2YnigOHlN8hqwhljtVjuc7TxnOmcCt9fd7G4Gphp5Rh64nnSvcq8CVahKVf+jA6H20ObQZjBmGpOMSeAt8hR6CqHysUpfpQ+6zF2JXYlQtrD0/dL34bp/KGUoBYyDpixTFtSlHoo5FAOni07PPj0bEkgg4b+M4MT5k+Enw6XZxfd9cN8HEtBGm8RiCiiQjHzTAdMBKemreZXzKqXH3sp4OuNpybzA8oZlg7S84uGKh5uk82eaVzXXjD0CQ1LwyNsSeKKvOgCsC8M/BZYbPnMS/H64oaWhHr5/cPcPu8vhyv1dqV0rIe6OOHOcGRw5jlZHK4Sk2OPscbCnZG//3nh4dCgtaYUP7nliUrL7OYB+y591AGEzFuQBTFwcbwQSKJFNktrDqp2S/H8a752VNNRvObVJkt9f60u9ybJ//GKNvqXXu2dK0rl7t12XpN+619VJ0qXvqub/MwFJ7kWg6BuX7b+iyxn7XgD6L/ZVLAcMy4ehg8CE8M3J8wFryIy4IkCW8NA7gRF2aSIw5E3oPgr4B1oa04DhvmvHh4EIe02MBzBCCmMfAYhg0S6AkNKYhoElowZ29gYakT0EtPJj0DQYLL8wF/C2fPz1a4C5o7r2EhDkOXbldeCCNigBmGQcC7ofIOgXazdwR2jNnC7AMtO72g0YUwse3QjAcmMGgDnVVjryPPCTiZ2xoyWcfk+AOwZGP4lXb8qyVg5J8pzvTpHk73not+8kDXbMOfCSJP+Vd3+cL0mumqZhSRqJ96z/1zx8AfTtC/CzZQFGpv0NJaJBQ1YMATAAAAAldEVYdGRhdGU6Y3JlYXRlADIwMTgtMDgtMDNUMDE6MjM6MDEtMDc6MDBgZ9vvAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDE4LTA4LTAzVDAxOjIzOjA5LTA3OjAwItUtNAAAAABJRU5ErkJggg=="
    },
    ddg: {
        name: "DuckDuckGo",
        url: "https://duckduckgo.com/?q=%s",
        useYear: true,
        icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACp0lEQVR4ATWQA5AsVxRAz3vDtb3f/uvYtlGIbRdj2zbKjm3bttfesXrezbtJ/q06g+5zbsPy/4wcuEqJe/b03D5y0KqnPa8q+luP6bn/HTaMHfZ/hg9YhRM6BS4QkRMkKPVKECwTJytFUJYJ9HpOUEddbbS1zqFxF3CRDzaW+rbNYjsctGNsYNte4tVLXFBeIkKvZ0fPZp6N1dVGWyti4sDJIqi4dTla0U3fVqbunBtp8sTWb4KYECIYT7c66mqjrRXY2Ynp9fQ5R12kYwnVa4YI1zVRsfkuNJx3L+Gt9sU58I5Sp6422loRdvfU6fZyOIrZ/iCSNd2orFOubEB2OQLb1I44QQTU1UZbXbDU0yoixtkwtqaWsak5vvxxDJ1SqcgXc2Gkex2u7CAsiMFoo60uqPTU+B68XJgap7Y6TnVVDJ2qyAJb9yWoG0jRuPcCjQfME24q4Rw12loHbIBSQOGvX1jSWcfaZS1I7hP4/WDiXxxK2L5KkI+QeLea4kwY+b+xImQ9KQ8iQjD8G6VcFnSCLMWRP0m8V2Th3TjBXBgTFVxgENAmqwv+8kx5RDC4iWHy83PoONfH7Gs9BGlLpDmAkFCcC6GuNtrqgpc8Cc+oLmB+huz4MDq2shoTWkrqqzhT79Wx8JG/fX2hMKqNtlbgVRHznRPzjcMmTC5H1r+Ht8Ze5IPZd/hjsJ0Ptq7n/W3qcSEAk1BXG22tiMkL3CfCn573KQejhT9/kS8m3ueRb27mseYf+W7rbmYbw1I2ZtR5R11ttLXOgd4+cLUIn3k+cmN/v73OLp86es0Z6TP7L8+fWNhtcuMPEm+aQD5SR11ttLV9r/xE78s/4XQJXCM29LD57tNvl9/z+G9L7ntqNHL7XZORZ1/+u3u48B3Cw+qoq422/wAmkMrhPOAtYwAAAABJRU5ErkJggg=="
    }
};

const CATEGORY_ICONS = {
    movie: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAASElEQVR4AWMY3OD///8TgNgcyp4MxAfQ8GSonDlILW6DIGABEDv8xw0coGr+4zaIREAPF9Hfa6NeG/UaoUxrSkSmNQVn2kENAMn3cyemVPyWAAAAAElFTkSuQmCC",
    show: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAQAAAD8x0bcAAAAZ0lEQVR4AbXKsRVAMBRG4X8ARjABG4A3gaEYwQJGyTKOMiNchRQUyUkR97afSsaKS7xJogV8lHigEwYsisQCzA+yKLJcNBVDYzE0ZKIJOLDIB9CLmotUJ5UkGiz8zsKNvrHjwrt+6QYs8N8NvN/45QAAAABJRU5ErkJggg=="
};

const COLORS = {
    PAGE_BG: "#141414",
    EXP_BG: "#aa0000",
    IMG_BG: "#FFFFFF",
    ACTION_LINK: "#FFFFFF"
}

const SELECTORS = {
    EXPIRING_TITLES: "tin-expiring-titles",
    EXPIRING_TITLES_ROW: "tin-expiring-titles-row",
    TITLE_PAGE_LINK: "tin-title-page",
    TITLE: "tin-title",
    CAT_ICON: "tin-cat-icon",
    DURATION: "tin-duration",
    TOTAL_DURATION: "tin-total-duration",
    SEARCHES: "tin-searches",
    ACTION_LINK: "tin-action-link",
    ACTIONS: "tin-actions",
    IMG_PREFIX: "tin-img-"
}

const ATTRS = {
    TITLE: "tin-title",
    YEAR: "tin-year"
}

const CSS = `
#${SELECTORS.EXPIRING_TITLES} { background-color: ${COLORS.EXP_BG}; margin: 0 4% 20px; padding: 25px 25px 10px; border-radius: 25px; }
.${SELECTORS.EXPIRING_TITLES_ROW} { margin-bottom: 15px; vertical-align: middle; }

.${SELECTORS.EXPIRING_TITLES_ROW}:hover .${SELECTORS.TITLE_PAGE_LINK} { text-decoration: underline; }

.${SELECTORS.TITLE_PAGE_LINK} { font-weight: 700; }
.${SELECTORS.TITLE_PAGE_LINK}:hover, .${SELECTORS.TITLE} a:hover { text-decoration: underline; }
.${SELECTORS.TITLE} { display: block; width: 100%; }

.${SELECTORS.CAT_ICON} { vertical-align: inherit; margin-right: 10px; background-color: ${COLORS.PAGE_BG}; padding: 2px; border-radius: 5px; }
.${SELECTORS.DURATION} { display: inline-block; vertical-align: inherit; margin-left: 10px; background-color: ${COLORS.PAGE_BG}; padding: 2px 5px; border-radius: 5px; font-size: 0.8vw; }
.${SELECTORS.TOTAL_DURATION} { display: inline-block; color: #FFFFFF; margin-left: 25px; }

.${SELECTORS.SEARCHES} { display: inline; margin-right: 10px; vertical-align: middle; }
.${SELECTORS.SEARCHES} a { margin: 0 1px; vertical-align: inherit; }
.${SELECTORS.SEARCHES} img { background-color: ${COLORS.IMG_BG}; padding: 1px; border-radius: 100%; border: 1px solid ${COLORS.EXP_BG}; transition: border 0.4s ease-in-out; }
.${SELECTORS.SEARCHES} img:hover { border-color: ${COLORS.IMG_BG}; }

.title .${SELECTORS.SEARCHES} { display: block; margin: 2px 0 0 0; }
.jawBone .${SELECTORS.SEARCHES} { display: block; margin: 0 0 5px 0; }
.title .${SELECTORS.SEARCHES} img, .jawBone .${SELECTORS.SEARCHES} img { border: 1px solid ${COLORS.PAGE_BG}; }
.title .${SELECTORS.SEARCHES} img:hover, .jawBone .${SELECTORS.SEARCHES} img:hover { border-color: ${COLORS.IMG_BG}; }

.${SELECTORS.ACTIONS} { float: right; }
.${SELECTORS.ACTION_LINK}, .${SELECTORS.ACTION_LINK} i { font-size: 0.7vw; }
.${SELECTORS.ACTION_LINK} { border-bottom: 1px solid ${COLORS.ACTION_LINK}; padding: 5px; margin-left: 10px; transition: all 0.4s ease-in-out; }
.${SELECTORS.ACTION_LINK} i { vertical-align: middle; }
.${SELECTORS.ACTION_LINK} i::before { content: '\\00a0'; }
.${SELECTORS.ACTION_LINK}:hover { color: ${COLORS.EXP_BG}; background-color: ${COLORS.ACTION_LINK}; border-radius: 5px; }

.match-score-wrapper.no-rating { display: none; }
.jawBoneContainer .jawBoneCommon .simsLockup .meta .match-score-wrapper { width: auto; }
.episodesContainer .single-season-label { display: inline-block; }
`;

(function() {
    'use strict';
    const $ = window.jQuery;
    const i18next = window.i18next;
    const moment = window.moment;

    function parseLocale(lng) {
        return { translation: JSON.parse(GM_getResourceText(`locale_${lng}`)) }
    }

    i18next.init({
        lng: 'en',
        fallbackLng: 'en',
        ns: 'translation',
        load: 'languageOnly',
        resources: {
            en: parseLocale("en"),
            es: parseLocale("es")
        }
    }, (err, t) => {
        if (err) return console.error("TIN: 18next error!", err)
        console.log('TIN: i18next loaded successfully!')
    });

    i18next.changeLanguage(unsafeWindow.netflix.notification.constants.locale)
    moment.locale(unsafeWindow.netflix.notification.constants.locale)

    const falcor = new FalcorWrapper(unsafeWindow.pathEvaluator)

    addStyle()
    // Observe changes to body
    new MutationObserver(function(list) {
        // Modify "My List"; add Expiring Titles box and add searches to every item
        modifyMyList()
        // Add searches in title pages
        modifyTitlePages()
        // Add titles under images in "More Like This"
        modifyMoreLikeThisTab()
        // Show completed percentage, remaining minutes, episode average
        modifyEpisodesTab()
    }).observe(document.body, { attributes: true, subtree: true })

    /**
     * Add styles to page from CSS, icons for the search links and Google's Material Icons
     */
    function addStyle() {
        GM_addStyle(CSS)
        $.each(SEARCHES, function(index) {
            const item = SEARCHES[index]
            GM_addStyle(`.${SELECTORS.IMG_PREFIX}${index} { content: url('${item.icon}') }`)
        });
        $("head").append($("<link>", { href: "https://fonts.googleapis.com/icon?family=Material+Icons", rel: "stylesheet" }))
    }

    /**
     * Append search links to every item on "My List"
     */
    function appendSearchLinksToMyListItems() {
        $(".rowListItem").each(function() {
            // Do not append if already present
            if ($(`.${SELECTORS.SEARCHES}`, this).length) return true;
            const searchLinks = NetflixTitle.makeSearchLinks($, $(".title", this).text(), $(".year", this).text());
            $(".title", this).append(searchLinks)
        });
    }

    /**
     * Modify 'My List'
     * Get expiring titles from Falcor and build Expiring Titles box
     * And append search links to every item if manual ordering is on
     */
    function modifyMyList() {
        // Check if in 'My List'
        if (document.URL.includes('my-list')) {
            const parent = $(".gallery, .rowListContainer");
            falcor.getExpiringTitlesAndStats().then(response => {
                const { mylist, expiring } = response;
                ExpiringTitlesBuilder.build($, i18next, moment, parent, mylist, expiring);
            })
            .catch(err => {
                console.error("TIN: could not fetch list", err)
            });
            appendSearchLinksToMyListItems();
        }
    }

    function modifyTitlePages() {
        $(".jawBone").each(function() {
            const titleElement = $(".title", this);
            const title = titleElement.text() || $("img", titleElement).attr("alt");
            const year = $(".year", this).text();

            // If already present, remove and reappend if titles don't match (after a loading state this makes the links correct)
            if ($(`.${SELECTORS.SEARCHES}`, this).length) {
                if ($(`.${SELECTORS.SEARCHES}`, this).attr(ATTRS.TITLE) === title) return;
                $(`.${SELECTORS.SEARCHES}`, this).remove();
            }

            const searchLinks = NetflixTitle.makeSearchLinks($, title, year);
            $(this).prepend(searchLinks)
        });
    }

    function modifyMoreLikeThisTab() {
        $(".jawBone #pane-MoreLikeThis .slider-item").each(function() {
            try {
                // If title already present, return
                if ($(`.${SELECTORS.TITLE}`, this).length) return true;
                // Get title from artwork
                const title = $(".video-artwork", this).attr("alt")
                // Decode embedded JSON to extract video_id
                const content = JSON.parse(decodeURIComponent($(".ptrack-content", this).attr("data-ui-tracking-context")))
                // Create anchor
                const a = $("<a>", { href: `/title/${content.video_id}`, text: title })
                const span = $("<span>", { class: SELECTORS.TITLE })
                span.append(a)

                $(".meta", this).prepend(span)
            } catch(e) {
                return true;
            }
        });
    }

    function modifyEpisodesTab() {
        // Work in progress
        return;
        // Get total watch time of season
        $(".jawBone #pane-Episodes").each(function() {
            var durations = []
            // Retrieve all episodes in a season
            $(".episodeWrapper .slider-item", this).each(function() {
                // Get progress through progress bar width
                var progress = 0;
                if ($(".progress-bar", this).length) {
                    progress = parseInt($(".progress-completed", this).attr("style").match(/\d+/)[0])
                }
                // Get minutes
                var minutes = parseInt($(".duration", this).text())
                // Calculate remaining
                var remaining = Math.ceil(minutes * (100 - progress) / 100)
                durations.push({ remaining, minutes })
            });
            // Reduce into totals
            var remaining = durations.reduce((acc, cur) => acc + cur.remaining, 0)
            var total = durations.reduce((acc, cur) => acc + cur.minutes, 0)
            var average = Math.ceil(total / durations.length)
            var percentage = Math.floor((total - remaining) / total * 100)

            // Remove and check for valid data
            $(`.${SELECTORS.TOTAL_DURATION}`, this).remove();
            if (!durations.length || isNaN(remaining)) return true;

            // Append
            $(".episodeWrapper", this).before($("<div>", { class: SELECTORS.TOTAL_DURATION, text: i18next.t('season.percentage', { percentage }) }))
            $(".episodeWrapper", this).before($("<div>", { class: SELECTORS.TOTAL_DURATION, text: i18next.t('season.remaining', { remaining, total }) }))
            $(".episodeWrapper", this).before($("<div>", { class: SELECTORS.TOTAL_DURATION, text: i18next.t('season.average', { average }) }))
        });
    }
})();