/* eslint-disable promise/catch-or-return */
/* eslint-disable promise/no-nesting */
/* eslint-disable promise/always-return */
/* eslint-disable no-restricted-globals */
/* eslint-disable prefer-rest-params */

window.addEventListener('load', () => {
    const pushState = history.pushState;
    let addingAdds = false;
    const shouldLoadPlacements = () => window.location.pathname.indexOf('/post/') === 0;
    let paragraphs = [];
    let placementsAdds = [];
    let placementAddForTesting = null;

    const getParagraphs = () => {
        let changed = false;
        const paragraphsArray = [];
        const paragraphsFound = document.querySelectorAll('.public-DraftStyleDefault-depth0, .public-DraftStyleDefault-block-depth0');
        if (paragraphsFound) {
            const firstParagraph = paragraphsFound[0];
            if (firstParagraph) {
                const article = firstParagraph.parentNode;
                if (article) {
                    for (let i = 0; i < article.children.length; i++) {
                        const paragraph = article.children[i];
                        if (paragraph.nodeName && paragraph.nodeName.toLowerCase() !== 'iframe' &&
                            paragraph.id && paragraph.id.indexOf('viewer-') === 0) {
                            paragraphsArray.push(paragraph);
                        }
                    }
                }
            }
        }

        if (paragraphs.length === 0 || paragraphs.length !== paragraphsArray.length) {
            paragraphs = paragraphsArray;
            changed = true;
        } else {
            const diffs = paragraphsArray.find((placement, index) => placement !== paragraphs[index]);

            if (diffs) {
                paragraphs = paragraphsArray;
                changed = true;
            }
        }

        return changed;
    };

    const getIframe = (banner) => {
        const url = banner.env === 'dev' ? 'live-tag-dev.bannersnack.net' : 'live-tag.bannersnack.com';

        // eslint-disable-next-line max-len
        return `https://${url}/banners/${banner.hash}/adtag/embed/1/index.html?networkId=1&userId=${banner.userId}&t=${banner.dateLastUpdate ? new Date(banner.dateLastUpdate).getTime() / 1000 : ''}&env=${banner.env === 'live' ? 'live' : 'dev'}`;
    };

    const getPlacementsAdds = () => (new Promise((resolve) => {
        const host = window.location.hostname.replace('www.', '');
        const wixenv = window.bswixenv ? window.bswixenv : 'production';
        const env = wixenv === 'dev' ? 'dev' : 'production';
        const cdn = env === 'dev' ? 'cdn.bannersnack.net' : 'cdn.bannersnack.com';
        fetch(`https://${cdn}/wix/${host}.json?t=${new Date().toISOString()}`)
            .then(res => {
                res.json().then((placementsRead) => {
                    placementsAdds = placementsRead;
                    resolve(true);
                });
            });
    }));

    const addsArePlaced = () => {
        if (placementAddForTesting) {
            return placementAddForTesting.parentNode !== null &&
                placementAddForTesting.parentNode !== undefined &&
                placementAddForTesting.offsetParent !== null &&
                placementAddForTesting.children.length !== 0;
        }

        return false;
    };

    const setAds = () => {
        addingAdds = true;
        placementsAdds.forEach((placementAdd) => {
            if (placementAdd) {
                const frequency = placementAdd.frequency;
                if (frequency) {
                    const repeat = frequency.repeat;
                    const blocks = frequency.blocks;

                    const iframeHolder = document.createElement('div');
                    iframeHolder.style = 'width:100%;text-align:center;';
                    const s = document.createElement('iframe');
                    s.src = getIframe(placementAdd.banner);
                    s.width = '100%';
                    const bannerWidth = placementAdd.banner.width;
                    const bannerHeight = placementAdd.banner.height;
                    if (bannerWidth / 2 < bannerHeight) {
                        s.width = 'auto';
                        if (bannerWidth < 200) {
                            s.width = bannerWidth;
                        }
                    }
                    s.height = placementAdd.banner.height;
                    s.scrolling = 'no';
                    s.frameborder = '0';
                    s.allowtransparency = 'true';
                    s.allow = 'autoplay';
                    s.allowfullscreen = 'true';
                    s.style = 'margin:0 auto;';
                    iframeHolder.append(s);
                    placementAddForTesting = iframeHolder;

                    if (blocks < paragraphs.length && blocks > 0) {
                        if (!repeat) {
                            paragraphs[blocks - 1].after(iframeHolder);
                        } else {
                            for (let counter = blocks - 1; counter < paragraphs.length; counter += blocks) {
                                const clone = iframeHolder.cloneNode(true);
                                paragraphs[counter].after(clone);
                                placementAddForTesting = clone;
                            }
                        }
                    }
                }
            }
        });
        addingAdds = false;
    };

    getPlacementsAdds().then(() => {
        if (shouldLoadPlacements()) {
            getParagraphs();
            setAds();
        }
    });


    history.pushState = function () {
        pushState.apply(history, arguments);
        placementAddForTesting = null;
    };

    const mainContainer = document.getElementById('PAGES_CONTAINER');
    mainContainer.addEventListener('DOMSubtreeModified', () => {
        if (!addingAdds && shouldLoadPlacements() && !addsArePlaced()) {
            getParagraphs();
            setAds();
        }
    });
});
