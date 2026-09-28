// ==UserScript==
// @name        NixOS Package Search - GitHub Stargazers badges for all applicable search results
// @namespace   https://github.com/m1kethai/userscripts
// @supportURL  https://github.com/m1kethai/userscripts/issues
// @version     1.5
// @description Adds a Stargazers badge to all package results with a GitHub repo "Homepage". Optionally provide your own GH token in localStorage (`userscript_gh_token`) to not be subject to the 60 req/min rate limit.
// @author      m1kethai
// @license     MIT
// @match       https://search.nixos.org/packages*query*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=nixos.org
// @grant       none
// ==/UserScript==

(function() {
    'use strict';

    const ghToken = (localStorage.userscript_gh_token || null);

    async function getGithubHomepageLinks() {
        const homepageLinkSelector = `div.search-page.success > div.search-results > div > ul > li.package > ul > li > a`;
        const homepageLinks = document.querySelectorAll(homepageLinkSelector);
        return Array.from(homepageLinks).filter(link =>
            link.innerText.includes("Homepage")
            && link.href.includes("github.com")
            && !link.href.includes("blob")
        );
    }

    async function fetchRepoStars(repoLink) {
        const getFetchUrl = repoUrl => {
            let url = repoUrl.replace("https://github.com", "https://api.github.com/repos");
            //: trim trailing slash if present
            if (url.endsWith("/")) url = url.slice(0, -1);
            return new URL(url);
        };

        try {
            const apiUrl = getFetchUrl(repoLink.href),
                response = (ghToken === null)
                    ? await fetch(apiUrl)
                    : await fetch(apiUrl, { headers: {'Authorization': `token ${ghToken}`} }),
                data = await response.json(),
                gazers = data.stargazers_count;
            return `⭐️ ${gazers || "???"}`;
        } catch (error) {
            console.error("Failed to fetch stars:", error);
            return `⭐️?`;
        }
    }

    function createBadgeElements(links) {
        const styles = {
            badge: `
                display: inherit;
                margin-left: 1em;
                padding: 0.04em 0.6em 0.04em 0.4em;
                font-size: 0.8em; font-weight: bold; text-align: center;
                background-color: rgba(255, 255, 255, 0.15);
                border-radius: 4px;
                transition: all 0.2s;
            `,
            text: `
                color: white;
                text-decoration: none !important;
                transition: all 0.2s;
            `
        };

        return links.map(l => {
            const
                starsBadge = document.createElement("li"),
                starsLink = document.createElement("a");
            starsBadge.appendChild(starsLink);
            starsBadge.style = styles.badge;
            starsLink.style = styles.text;
            starsLink.target = "_blank";
            starsLink.href = l.href;
            return starsBadge;
        });
    }

    async function main() {
        const homeLinks = await getGithubHomepageLinks();
        if (homeLinks.length === 0) {
            console.warn("No packages w/ GitHub repo homepages are present in the current results.");
            return;
        }
        const starsList = await Promise.all(homeLinks.map(async link => await fetchRepoStars(link)));
        const badgeList = createBadgeElements(homeLinks);
        badgeList.forEach((badge, i) => {
            badge.querySelector("a").innerText = starsList[i]
        });
        homeLinks.forEach((link, i) => link.parentElement.appendChild(badgeList[i]));
    }

    function runWhenLoaded() {
        if (document.readyState === "complete") main();
        else window.addEventListener('load', main);
    }

    function retryUntilSuccess() {
        const maxRetries = 5;
        const delayMs = 1500;

        let retryCnt = 0;
        const interval = setInterval(() => {
            if (document.querySelector('div.search-page.success > div.search-results > div > ul > li.package')) {
                clearInterval(interval);
                runWhenLoaded();
            } else if (retryCnt >= maxRetries) {
                clearInterval(interval);
                console.warn("Max retries reached. Custom elements may not load properly.");
            }
            else retryCnt++;
        }, delayMs);
    }

    retryUntilSuccess();
})();
