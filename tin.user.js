// ==UserScript==
// @name         Tiny Improvements for Netflix (TIN)
// @namespace    https://github.com/ignaeche
// @version      1.14.2
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
    /**
     * Construct with unsafeWindow because pathEvaluator may not be defined at construct time
     * @param {Window} unsafeWindow
     */
    constructor(unsafeWindow) {
        this.unsafeWindow = unsafeWindow;
    }

    /**
     * Get My List length
     * @returns {Promise}
     */
    getMyListLength() {
        return this.unsafeWindow.pathEvaluator.getValue(["mylist", "length"]);
    }

    /**
     * Get My List
     * @returns {Promise}
     */
    getMyList() {
        const values = ["availability","availabilityEndDateNear","delivery","interactiveBookmark","maturity","numSeasonsLabel","queue","releaseYear","runtime","seasonCount","summary","title","userRating","userRatingRequestId"]
        return this.getMyListLength()
        .then(length => {
            return this.unsafeWindow.pathEvaluator.get(["mylist", "length"], ["mylist", { from: 0, to: length - 1 }, values])
        });
    }

    /**
     * Get Expiring Titles
     * @returns {Promise}
     */
    getExpiringTitles() {
        return this.getMyList()
        .then(response => {
            const mylist = response.json.mylist;
            delete mylist.$__path;
            const expiring = Object.values(mylist).filter(title => title.availabilityEndDateNear);
            return { mylist, expiring }
        });
    }

    /**
     * Get title and year of a Netflix title
     * @param {string} titleId Netflix title id
     */
    getTitleInfo(titleId) {
        return this.unsafeWindow.pathEvaluator.get(["videos", titleId, ["title", "releaseYear", "summary"]]).then(response => {
            const video = response.json.videos[titleId];
            delete video.$__path;
            return video;
        });
    }

    /**
     * Get watch info of a Netflix title
     * @param {string} titleId Netflix title id
     */
    getTitleWatchInfo(titleId) {
        return this.unsafeWindow.pathEvaluator.get(["videos", titleId, ["bookmarkPosition", "creditsOffset", "runtime", "watched"]]).then(response => {
            const video = response.json.videos[titleId];
            delete video.$__path;
            return video;
        });
    }

    /**
     * Get number of seasons of a Netflix title
     * @param {string} titleId Netflix title id
     */
    getNumberOfSeasons(titleId) {
        return this.unsafeWindow.pathEvaluator.getValue(["videos", titleId, "seasonList", "summary", "length"]);
    }

    /**
     * Get list of seasons of a Netflix title
     * @param {string} titleId Netflix title id
     */
    getSeasonList(titleId) {
        return this.getNumberOfSeasons(titleId)
        .then(length => {
            return this.unsafeWindow.pathEvaluator.get(["videos", titleId, ["seasonList"], { from: 0, to: length - 1}, "summary"]);
        })
        .then(response => {
            const { seasonList } = response.json.videos[titleId];
            delete seasonList.$__path;
            return seasonList;
        });
    }

    /**
     * Get list of episodes of a season of a Netflix title
     * @param {string} season season id of a Netflix title, retrieved from getSeasonList
     */
    getEpisodesOfSeason(season) {
        const { id, length } = season;
        return this.unsafeWindow.pathEvaluator.get(["seasons", id, "episodes", {from: 0, to: length - 1}, ["bookmarkPosition", "creditsOffset", "runtime", "summary"]])
        .then(response => {
            const { episodes } = response.json.seasons[id];
            delete episodes.$__path;
            return episodes;
        });
    }

    /**
     * Get status information for list of title ids
     * @param {Array} ids array of ids for Netflix titles
     */
    getStatusOfTitles(ids) {
        const values = ["availabilityEndDateNear", "bookmarkPosition", "creditsOffset", "queue", "summary", "title", "userRating", "watched"];
        return this.unsafeWindow.pathEvaluator.get(["videos", ids, values]).then(response => {
            const { videos } = response.json;
            delete videos.$__path;
            return videos;
        });
    }
};

/**
 * Class with action functions
 */
class TinFunctions {
    constructor() { }

    /**
     * View title in list, works in both list modes
     * @param {Event} event
     */
    static viewInList(event) {
        const { title, id } = event.data;
        const selectors = `[aria-label='${NetflixTitle.escapeQuotes(title)}'], div[data-id='${id}']`;
        document.querySelector(selectors).scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Bring title to top of list, manual ordering only
     * @param {Event} event
     */
    static bringToTop(event) {
        const { id } = event.data;
        document.querySelector(`div[data-id='${id}'] .move-to-top`).firstElementChild.click();
    }

    /**
     * Remove title from list, manual ordering only
     * @param {Event} event
     */
    static removeFromList(event) {
        const { prompt, id } = event.data;
        if (confirm(prompt)) {
            document.querySelector(`div[data-id='${id}'] .remove`).firstElementChild.click();
        }
    }

    /**
     * Export My List to file
     * @param {Event} event
     */
    static exportList(event) {
        const { mylist } = event.data;
        this.href = NetflixTitle.getListAsObjectURL(mylist);
    }
}

/**
 * Helper functions for Netflix title manipulation
 */
class NetflixTitle {
    constructor() { }

    /**
     * Get number of movies and shows
     * @param {object} mylist 'My List' object
     * @returns {object} { movie, show }
     */
    static getMyListStats(mylist) {
        return Object.values(mylist).reduce((acc, cur) => {
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
     * Determine if title is a movie
     * @param {object} title Netflix title
     * @returns {boolean}
     */
    static isMovie(title) {
        return (title.summary.type === "movie");
    }

    /**
     * Make search link icons
     * @param {jQuery} $ jQuery instance
     * @param {string} title Title of movie or show
     * @param {string} year Release year
     * @returns {object} div
     */
    static makeSearchLinks($, title, year) {
        const titleAndYear = title.concat(` (${year})`)

        // Create 'links' div
        const links = $("<div>", { class: SELECTORS.SEARCHES });

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
     * @param {jQuery} $ jQuery instance
     * @param {i18next} i18next instance
     * @param {object} title Netflix title object
     * @returns {object} img
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
     * @param {jQuery} $ jQuery instance
     * @param {object} title Netflix title object
     * @returns {object} anchor
     */
    static makeTitleLink($, title) {
        return $("<a>", { href: `/title/${title.summary.id}`, text: title.title })
    }

    /**
     * Sort the array of expiring titles according to expiring date
     * @param {Moment} moment instance
     * @param {Array} titles Netflix titles
     * @returns {Array} sorted array of expiring titles
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
            return a.title.localeCompare(b.title);
        });
        return mapped;
    }

    /**
     * Turn Netflix titles into an URL object
     * @param {object} list list of Netflix titles
     * @returns {DOMString} object URL
     */
    static getListAsObjectURL(list) {
        const keys = ["title", "releaseYear", "summary", "id", "type", "length"];
        const replacer = (key, value) => {
            // Only keep keys which are numbers or included in keys
            if (!isNaN(key) || keys.includes(key)) {
                return value;
            }
            return undefined;
        };
        const json = JSON.stringify(list, replacer, 4);

        const blob = new Blob([json], { type: 'application/json' });
        return URL.createObjectURL(blob);
    }

    /**
     * Extract video id from attribute of element with ptrack-content class
     * @param {jQuery} $ jQuery instance
     * @param {Element} item parent element with a ptrack-content
     * @returns {number} video id; 0 if not found
     */
    static getVideoIdFromAttribute($, item) {
        if ($(".ptrack-content", item).length) {
            const json = decodeURIComponent($(".ptrack-content", item).attr("data-ui-tracking-context"));
            return JSON.parse(json).video_id;
        }
        return 0;
    }

    /**
     * Escape quotes in string
     * @param {string} string string to escape
     */
    static escapeQuotes(string) {
        return string.replace(/"/g, '\\"');
    }
}

/**
 * Build an Action Links div
 */
class ActionLinks {
    constructor($, i18next) {
        this.$ = $;
        this.i18next = i18next;
        this.links = $("<div>", { class: SELECTORS.ACTIONS })
    }

    /**
     * Add link
     * @param {Function} handler function to call on click
     * @param {object} data event data to pass to handler
     * @param {string} key translation key for i18next
     * @param {string} icon material icon name
     * @param {object} attrs object with additional attributes
     * @param {boolean} prepend if true, prepend to parent, otherwise append
     */
    addLink(handler, data, key, icon, attrs, prepend = false) {
        const { $ } = this;
        const anchor = $("<a>", {
            class: SELECTORS.ACTION_LINK,
            html: this.i18next.t(key)
        });
        if (typeof attrs === "object") {
            $.each(attrs, (key, value) => {
                anchor.attr(key, value);
            });
        }
        anchor.append($("<i>", { class: "material-icons", text: icon }));
        anchor.on('click', data, handler);
        prepend ? this.links.prepend(anchor) : this.links.append(anchor);
        return this;
    };

    /**
     * Append actions to parent
     * @param {object} parent parent element to append actions
     */
    appendTo(parent) {
        parent.append(this.links);
        return this;
    }
}

/**
 * Class to build expiring titles box
 */
class ExpiringTitlesBuilder {
    /**
     * Construct with instances
     * @param {jQuery} $ jQuery instance
     * @param {i18next} i18next instance
     * @param {Moment} moment instance
     * @param {Element} parent parent element of the main div
     */
    constructor($, i18next, moment, parent) {
        this.$ = $;
        this.i18next = i18next;
        this.moment = moment;
        this.parent = parent;
    }

    /**
     * Remove container and make a new one and reappend to parent
     * with new list length attribute value
     * @param {number} length length of 'My List'
     */
    makeContainer(length = -1) {
        const { $ } = this;
        $(`#${SELECTORS.EXPIRING_TITLES}`).remove();
        this.container = $("<div>", { id: SELECTORS.EXPIRING_TITLES, [ATTRS.LENGTH]: length });
        this.parent.prepend(this.container);
        return this;
    }

    /**
     * Get current container and check if list length matches
     * @param {number} length length of 'My List'
     */
    containerHasListLength(length) {
        const container = this.$(`#${SELECTORS.EXPIRING_TITLES}`);
        return container.length && container.attr(ATTRS.LENGTH) == length && !container.is(':empty');
    }

    /**
     * If loading indicator is in Netflix page, show list refreshing mesage
     */
    showIfRefreshing() {
        const { $ } = this;
        if ($(".galleryLoader, .rowListSpinLoader").length) {
            this.makeContainer();
            $("<div>", {
                class: SELECTORS.EXPIRING_TITLES_ROW,
                text: this.i18next.t('list.refreshing')
            }).appendTo(this.container);
        }
        return this;
    }

    /**
     * If an error occurred, alert the user
     */
    showError() {
        const { $ } = this;
        this.makeContainer();
        $("<div>", {
            class: SELECTORS.EXPIRING_TITLES_ROW,
            text: this.i18next.t('list.error')
        }).appendTo(this.container);
        return this;
    }

    /**
     * Add row with number of expiring titles
     * @param {number} length number of expiring titles
     */
    addCountExpirationRow(length) {
        const { $, i18next } = this;

        const options = { count: length };
        if (length == 0) options.context = 'empty';

        $("<div>", {
            class: SELECTORS.EXPIRING_TITLES_ROW,
            text: i18next.t('list.title', options)
        }).appendTo(this.container);

        return this;
    }

    /**
     * Add row with My List info
     * @param {object} mylist 'My List' object
     */
    addMyListInfo(mylist) {
        const { $, i18next } = this;

        const options = { count: mylist.length };
        if (mylist.length == 0) options.context = 'empty';

        const stats = NetflixTitle.getMyListStats(mylist);
        const row = $("<div>", {
            class: SELECTORS.EXPIRING_TITLES_ROW,
            html: `${i18next.t('list.stats', options)} (${i18next.t('list.categoryCount', { stats })})`
        });
        row.appendTo(this.container);

        // Export List link
        if (mylist.length) {
            const filename = `${i18next.t('profileName', { lng: 'common' })}_${this.moment().format('YYYYMMDDTHHmm')}.json`;
            new ActionLinks($, i18next)
                .addLink(TinFunctions.exportList, { mylist }, 'actions.export', 'save_alt', { download: filename })
                .appendTo(row);
        }

        return this;
    }

    /**
     * Add row with expiring title information
     * @param {object} title Netflix title object
     */
    addNetflixTitleRow(title) {
        const { $, i18next, moment } = this;
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

        // Action links
        const eventData = {
            title: title.title,
            id: title.summary.id,
            prompt: i18next.t('actions.removePrompt', { title: title.title })
        };
        const links = new ActionLinks($, i18next)
            .appendTo(item)
            .addLink(TinFunctions.viewInList, eventData, 'actions.viewInList', 'arrow_downward');

        // If in manual ordering list type, add these action links
        const titleRow = $(`div[data-id='${title.summary.id}']`);
        if (titleRow.length) {
            if ($(".move-to-top", titleRow).length) {
                links.addLink(TinFunctions.bringToTop, eventData, 'actions.bringToTop', 'arrow_upward', null, true);
            }
            links.addLink(TinFunctions.removeFromList, eventData, 'actions.removeFromList', 'close');
        }

        // Append to main div
        this.container.append(item);

        return this;
    }
}

/**
 * Class to build stats for a season in a Netflix title
 */
class SeasonStatsBuilder {
    /**
     * Construct with instances
     * @param {jQuery} $ jQuery instance
     * @param {i18next} i18next instance
     * @param {Moment} moment instance
     * @param {Element} pane Episodes pane of title
     */
    constructor($, i18next, moment, pane) {
        this.$ = $;
        this.i18next = i18next;
        this.moment = moment;
        this.pane = pane;
    }

    /**
     * Remove (if present) and insert container before episode list (next to dropdown/label)
     * with ID from season object in attribute.
     * @param {object} season season of a Netflix title
     */
    makeContainer(season) {
        const { $, pane } = this;
        $(`.${SELECTORS.SEASON_STATS_CONTAINER}`, pane).remove();
        this.container = $("<div>", { class: SELECTORS.SEASON_STATS_CONTAINER, [ATTRS.SEASON]: season.summary.id });
        this.container.insertBefore($(".episodeWrapper", pane));
        return this;
    }

    /**
     * Get current container and check if the season attribute matches the given season ID
     * @param {object} season season of a Netflix title
     * @returns {boolean}
     */
    containerHasSeason(season) {
        const { $, pane } = this;
        const container = $(`.${SELECTORS.SEASON_STATS_CONTAINER}`, pane);
        return container.length && container.attr(ATTRS.SEASON) == season.summary.id;
    }

    /**
     * Get the current season object selected in pane
     * @param {object} seasonList list of seasons of a Netflix title
     * @returns {object} season
     */
    getCurrentSeason(seasonList) {
        const { $, pane } = this;
        const currentSeason = $(".single-season-label", pane).text() || $(".nfDropDown > .label > .sub-menu-link", pane).text();
        return Object.values(seasonList).find(s => s.summary.name === currentSeason);
    }

    /**
     * Calculate remaining time and add to object
     * @param {object} episode episode in a season
     */
    static addRemaining(episode) {
        episode.correctedBookmark = Math.min(Math.max(episode.bookmarkPosition, 0), episode.runtime);
        // If bookmark position is after credits offset, then episode is done and remaining time should be 0
        episode.remaining = episode.correctedBookmark < episode.creditsOffset ? episode.runtime - episode.correctedBookmark : 0;
        return episode;
    }

    /**
     * Sum of all episodes runtime and remaining time (in seconds)
     * @param {Array} list array of episodes with remaining time
     */
    static getTotals(list) {
        return list.reduce((acc, cur) => {
            acc.runtime = acc.runtime + cur.runtime;
            acc.remaining = acc.remaining + cur.remaining;
            return acc;
        }, { runtime: 0, remaining: 0 });
    }

    /**
     * Get stats of season
     * @param {object} season season object of Netflix title
     * @param {object} episodes episodes object corresponding to season
     */
    getStats(season, episodes) {
        const { moment } = this;

        const list = Object.values(episodes).map(SeasonStatsBuilder.addRemaining);
        const totals = SeasonStatsBuilder.getTotals(list);

        return {
            // format to minutes
            runtime: moment.duration(totals.runtime, 'seconds').format('m'),
            remaining: moment.duration(totals.remaining, 'seconds').format('m'),
            // format remaining time to hours:minutes
            hours: moment.duration(totals.remaining, 'seconds').format('HH:mm', { trim: false }),
            // average episode length in minutes
            average: moment.duration(Math.round(totals.runtime / season.summary.length), 'seconds').format('m'),
            // calculate completed percentage
            percentage: ((totals.runtime - totals.remaining) / totals.runtime * 100).toFixed(2)
        };
    }

    /**
     * Add stat div to stats container
     * @param {string} key i18next translation key
     * @param {object} data i18next interpolation data
     * @param {object} title object w/ key and data for i18next
     */
    addStat(key, data, title) {
        const { $, i18next, container } = this;
        const stat = $("<div>", {
            class: SELECTORS.SEASON_STAT,
            text: i18next.t(key, data)
        });
        // If given, add title attribute with alternative text
        if (title) {
            stat.attr('title', i18next.t(title.key, title.data));
        }
        stat.appendTo(container);
        return this;
    }
}

/**
 * Class to handle title cards overlays
 */
class TitleCardOverlay {
    /**
     * Construct instance
     * @param {jQuery} $ jQuery instance
     * @param {Function} callback function to attach to mouseleave event on title card
     */
    constructor($, callback) {
        this.$ = $;
        this.callback = callback;
        this.icons = {
            queue: { order: 0, name: 'check' },
            expires: { order: 1, name: 'schedule' },
            watched: { order: 2, name: 'visibility' },
            like: { order: 3, name: 'thumb_up_alt' },
            dislike: { order: 4, name: 'thumb_down_alt' }
        };
        this.sortedIcons = Object.values(this.icons).sort((a, b) => a.order - b.order);
    }

    /**
     * Get icon names and modifying classes for overlay
     * @param {object} title Netflix title object
     */
    getTitleStatus(title) {
        const status = {
            icons: [],
            classes: []
        }
        // Title is in queue
        if (title.queue.inQueue) {
            status.icons.push(this.icons.queue.name);
        }
        // Title has been watched
        if (title.bookmarkPosition >= title.creditsOffset) {
            status.icons.push(this.icons.watched.name);
            status.classes.push(SELECTORS.WATCHED_CARD);
        }
        // Show that has been watched at least once (started shows are true, never watched are false)
        // Movies are always false; that's why previous if is used
        if (!NetflixTitle.isMovie(title) && title.watched) {
            status.icons.push(this.icons.watched.name);
        }
        // Title has expiration date
        if (title.availabilityEndDateNear) {
            status.icons.push(this.icons.expires.name);
        }
        // Title has thumbs up
        if (title.userRating.userRating == 2) {
            status.icons.push(this.icons.like.name);
        }
        // Title has thumbs down
        if (title.userRating.userRating == 1) {
            status.icons.push(this.icons.dislike.name);
        }
        return status;
    }

    /**
     * Add overlay div to title card
     * @param {Element} item slider item holding title card
     * @param {number} id Netflix title id
     * @returns {boolean} true if overlay was added, false if exists
     */
    addOverlay(item, id) {
        const { $ } = this;
        // If overlay is present, do nothing
        if ($(`.${SELECTORS.OVERLAY}`, item).length) return false;

        // Create overlay
        const overlay = $("<div>", { class: SELECTORS.OVERLAY });
        overlay.data('icons', 0);
        // Add icons and hide them
        $.each(this.sortedIcons, (_, icon) => $("<i>", { class: "material-icons", text: icon.name }).hide().appendTo(overlay));
        // Append after adding icons, tall cards have two boxart containers (one tall, one normal size)
        overlay.appendTo($(".boxart-container, .video-artwork", item));

        // Add callback for single card modification on mouseleave
        $(".title-card-container", item).addClass(SELECTORS.OVERLAY_WRAPPER)
        .on('mouseleave', { id }, this.callback);

        return true;
    }

    /**
     * Add icons and classes to card overlay
     * @param {object} title Netflix title object
     */
    modifyCardOverlay(title) {
        const { $ } = this;
        // Get icons and classes for the overlay
        const { icons, classes } = this.getTitleStatus(title);

        // Escape quotes and select label (child of slider item div)
        const label = $(`.slider-item [aria-label="${NetflixTitle.escapeQuotes(title.title)}"]`);

        // Add wrapper classes to title card (if any)
        label.closest('.title-card-container').addClass(classes.join(' '));

        // Since each title can appear multiple times in a page, iterate over elements
        label.each((_, element) => {
            // Get overlay for this card
            const overlay = $(`.${SELECTORS.OVERLAY}`, element);
            // If tabindex is 0, card is visible
            const tabIndex = $(element).attr('tabindex');
            // If number of icons has changed and is visible, update overlay
            // For title cards in 'More Like This', check for simsLockup & !sliderItemHidden class
            if (overlay.data('icons') != icons.length && (tabIndex == '0' || $(element).filter('.simsLockup').not('.sliderItemHidden').length)) {
                overlay.data('icons', icons.length);
                $("i", overlay).each((_, icon) => {
                    // Icon is in list and is hidden, then show
                    if (icons.includes($(icon).text()) && $(icon).is(':hidden')) {
                        $(icon).show(100).fadeTo(300, 1);
                    }
                    // Icon is not in list and not hidden, then hide
                    if (!icons.includes($(icon).text()) && !$(icon).is(':hidden')) {
                        $(icon).fadeTo(300, 0).hide(100);
                    }
                });
            }
        });
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
    SEASON_STAT: "tin-season-stat",
    SEASON_STATS_CONTAINER: "tin-season-stats-container",
    SEARCHES: "tin-searches",
    WATCHED: "tin-watched",
    ACTION_LINK: "tin-action-link",
    ACTIONS: "tin-actions",
    IMG_PREFIX: "tin-img-",
    OVERLAY: "tin-overlay",
    OVERLAY_WRAPPER: "tin-overlay-wrapper",
    WATCHED_CARD: "tin-watched-card"
}

const ATTRS = {
    SEASON: "data-tin-season",
    LENGTH: "data-tin-length"
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
.${SELECTORS.SEASON_STAT} { display: inline-block; color: #FFFFFF; margin-left: 1.5vw; }
.${SELECTORS.SEASON_STATS_CONTAINER} { display: inline-block; }

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

.${SELECTORS.WATCHED_CARD} .boxart-container img { transition: filter 0.4s ease; }
.${SELECTORS.WATCHED_CARD} [tabindex='0'] img, .${SELECTORS.WATCHED_CARD} .bob-card img { filter: brightness(0.5) blur(1px); }

.${SELECTORS.OVERLAY} { position: absolute; top: 0; z-index: 1; display: block; width: 100%; height: 100%; }
.${SELECTORS.OVERLAY} { opacity: 1; transition: opacity 0.4s linear 0.6s; }
.${SELECTORS.OVERLAY_WRAPPER}:hover .${SELECTORS.OVERLAY}, .${SELECTORS.OVERLAY}:hover { opacity: 0; transition: opacity 0.4s linear; }
.${SELECTORS.OVERLAY} i { color: #FFFFFF; background-color: #00000080; border: 0.1em solid #FFFFFF80;
    padding: 5px; margin: 2% 0 2% 2%; border-radius: 100%; filter: drop-shadow(1px 1px 5px #00000080);
    opacity: 0; overflow: hidden; font-size: 1vw; }
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
            es: parseLocale("es"),
            common: {
                translation: {
                    profileName: unsafeWindow.netflix.reactContext.models.userInfo.data.name
                }
            }
        }
    }, (err, t) => {
        if (err) return console.error("TIN: 18next error!", err)
        console.log('TIN: i18next loaded successfully!')
    });

    i18next.changeLanguage(unsafeWindow.netflix.notification.constants.locale)
    moment.locale(unsafeWindow.netflix.notification.constants.locale)

    const falcor = new FalcorWrapper(unsafeWindow);

    addStyle()
    // Observe changes to body
    new MutationObserver(function(list) {
        // Modify "My List"; add Expiring Titles box and add searches to every item
        modifyMyList()
        // Add searches in title pages
        modifyTitlePage()
        // Add titles under images in "More Like This"
        modifyMoreLikeThisTab()
        // Show completed percentage, remaining minutes, episode average
        modifyEpisodesTab()
        // Add icons and dim watched movies
        modifyTitleCards();
    }).observe(document.body, { attributes: true, subtree: true })

    /**
     * Add styles to page from CSS, icons for the search links and Google's Material Icons
     */
    function addStyle() {
        GM_addStyle(CSS)
        $.each(SEARCHES, (key, item) => {
            GM_addStyle(`.${SELECTORS.IMG_PREFIX}${key} { content: url('${item.icon}') }`)
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
    async function modifyMyList() {
        // Check if in 'My List'
        if (document.URL.includes('my-list')) {
            appendSearchLinksToMyListItems();

            const parent = $(".gallery, .rowListContainer");
            const builder = new ExpiringTitlesBuilder($, i18next, moment, parent)
                .showIfRefreshing();

            try {
                const length = await falcor.getMyListLength();
                // If container has list with this length, do nothing
                if (builder.containerHasListLength(length)) return;

                if (length) {
                    // 'My List' is not empty
                    const { mylist, expiring } = await falcor.getExpiringTitles();
                    const sortedExpiring = NetflixTitle.sortExpiringTitles(moment, expiring);
                    builder.makeContainer(length)
                        .addMyListInfo(mylist)
                        .addCountExpirationRow(sortedExpiring.length);
                    $.each(sortedExpiring, (_, title) => builder.addNetflixTitleRow(title));
                } else {
                    // 'My List' is empty
                    builder.makeContainer(length).addMyListInfo({ length });
                }
            } catch(err) {
                builder.showError();
                console.error("TIN: could not fetch list", err);
            }
        }
    }

    /**
     * Modify 'Overview' tab
     * Show if a movie has been watched before
     * @param {Element} container jawBone container element
     * @param {object} title Netflix title object
     */
    function modifyOverviewTab(container, title) {
        const overviewPane = $("#pane-Overview", container);
        if (overviewPane.length) {
            falcor.getTitleWatchInfo(title.summary.id).then(info => {
                // Don't append if already present
                if ($(`.${SELECTORS.WATCHED}`, overviewPane).length) return;
                const span = $("<span>", { class: SELECTORS.WATCHED });
                // If the bookmark position is after the credits offset or watched is true (for TV shows), then the title has been watched
                info.bookmarkPosition >= info.creditsOffset || info.watched ? span.text(i18next.t('overview.watched')) : span.css('display', 'none');
                $(".meta", overviewPane).prepend(span);
            })
            .catch(err => {
                console.error("TIN: could not fetch watch info", err);
            });
        }
    }

    /**
     * Modify overview of Netflix titles
     * Get title ID from DOM, get info from Falcor and append search links
     */
    function modifyTitlePage() {
        $(".jawBoneContainer").each((_, container) => {
            const titleId = container.id;
            falcor.getTitleInfo(titleId).then(title => {
                !$(`.${SELECTORS.SEARCHES}`, container).length
                    && $(".jawBone", container).prepend(NetflixTitle.makeSearchLinks($, title.title, title.releaseYear));

                modifyOverviewTab(container, title);
            })
            .catch(err => {
                console.error("TIN: could not fetch title data", err);
            });
        });
    }

    /**
     * Modify 'More Like This' tab
     * Add the title's name under artwork w/ link of overview page
     */
    function modifyMoreLikeThisTab() {
        $(".jawBone #pane-MoreLikeThis .slider-item").each((_, item) => {
            // If this class is present, then titles are loading
            if ($(".pulsate-transparent", item).length) return true;
            // Don't append if already present
            if ($(`.${SELECTORS.TITLE}`, item).length) return true;
            // Get title info
            const title = $("div[aria-label]", item).attr("aria-label");
            const id = NetflixTitle.getVideoIdFromAttribute($, item);
            // Append title
            if (id) {
                const span = $("<span>", { class: SELECTORS.TITLE });
                span.append(NetflixTitle.makeTitleLink($, { title, summary: { id } }));
                $(".meta", item).prepend(span);
            }
        });
    }

    /**
     * Modify 'Episodes' tab
     * Get title ID from DOM, then get season list from Falcor,
     * then get episodes from current season from Falcor, calculate and show stats
     */
    function modifyEpisodesTab() {
        $(".jawBone #pane-Episodes").each(async (_, pane) => {
            const titleId = $(pane).closest(".jawBoneContainer")[0].id;
            const builder = new SeasonStatsBuilder($, i18next, moment, pane);

            try {
                const seasonList = await falcor.getSeasonList(titleId);
                const season = builder.getCurrentSeason(seasonList);

                // If container has same season ID, do nothing
                if (builder.containerHasSeason(season)) return;

                // Initialize container before next Falcor call
                builder.makeContainer(season);

                const episodes = await falcor.getEpisodesOfSeason(season.summary);

                const { runtime, remaining, hours, average, percentage } = builder.getStats(season, episodes);
                builder
                    .addStat('season.episodes', { count: season.summary.length })
                    .addStat('season.percentage', { percentage: Math.round(percentage) }, { key: 'season.percentage', data: { percentage: +(percentage) } })
                    .addStat('season.remainingHours', { hours }, { key: 'season.remaining', data: { remaining, runtime } })
                    .addStat('season.average', { average });
            } catch (err) {
                console.error("TIN: could not fetch episodes", err);
            }
        });
    }

    /**
     * Callback for mouseleave event of a title card
     * @param {Event} event
     */
    function modifySingleCardCallback(event) {
        setTimeout(async () => {
            try {
                const { id } = event.data;
                const statusList = await falcor.getStatusOfTitles(id);
                new TitleCardOverlay($).modifyCardOverlay(statusList[id]);
            } catch (err) {
                console.error("TIN: could not modify card", err);
            }
        }, 1000);
    }

    /**
     * Modify title cards in slider rows by adding an overlay
     * Collect title IDs from items and jawBone containers,
     * send to Falcor and modify overlays
     */
    async function modifyTitleCards() {
        try {
            const overlay = new TitleCardOverlay($, modifySingleCardCallback);
            const ids = [];

            // Get ids from slider items
            $(".slider-item").each((_, item) => {
                try {
                    const id = NetflixTitle.getVideoIdFromAttribute($, item);
                    if (id && overlay.addOverlay(item, id)) {
                        ids.push(id);
                    }
                } catch (err) { /* ignore */ }
            });
            // Get open jawBone ids
            $(".jawBoneContainer").each((_, container) => {
                ids.push(container.id);
            });

            // If no ids collected, do nothing
            if (!ids.length) return;

            // Get summaries from Falcor
            const statusList = await falcor.getStatusOfTitles(ids);

            // Modify overlays
            $.each(statusList, (_, title) => {
                overlay.modifyCardOverlay(title);
            });
        } catch (err) {
            console.error("TIN: could not modify cards", err);
        }
    }
})();