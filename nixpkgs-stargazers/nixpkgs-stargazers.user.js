// ==UserScript==
// @name        NixOS Package Search: GitHub Stargazers (nixpkg repo stars) badges for relevant search results
// @namespace   https://github.com/m1kethai/userscripts
// @supportURL  https://github.com/m1kethai/userscripts/issues
// @version     1.5.1
// @description A custom Stargazers badge to all package results with a GitHub repo "Homepage". Optionally provide your own GH token in localStorage (`userscript_gh_token`) to avoid the 60 requests/min unauthenticated rate limit.
// @author      m1kethai
// @license     MIT
// @match       https://search.nixos.org/packages*query*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=nixos.org
// @grant       none
// ==/UserScript==

(function() {
    'use strict';

    const ghToken = (localStorage.userscript_gh_token || null);

    const badgeStyles = `
        display: inherit;
        margin-left: 1em;
        padding: 0.04em 0.6em 0.04em 0.4em;
        border-radius: 4px;
        color: white;
        background-color: rgba(255, 255, 255, 0.15);
        font-size: 0.8em;
        font-weight: bold;
        text-align: center;
        text-decoration: none !important;
        transition: all 0.2s;
    `;

    async function getGithubHomepageLinks() {
        const homepageLinkSelector = `div.search-page.success > div.search-results > div > ul > li.package > ul > li > a`;
        const homepageLinks = document.querySelectorAll(homepageLinkSelector);
        return Array.from(homepageLinks).filter(link =>
            link.innerText.includes("Homepage")
            && link.href.includes("github.com")
            && !link.href.includes("blob")
        );
    }

    const getApiUrl = repoUrl => {
        let url = repoUrl.replace("https://github.com", "https://api.github.com/repos");
        //: trim trailing slash if present
        if (url.endsWith("/")) url = url.slice(0, -1);
        return new URL(url);
    };

    async function fetchRepoStars(repoLink) {
        let gazers;
        try {
            const
                apiUrl = getApiUrl(repoLink.href),
                response = !ghToken ? await fetch(apiUrl) : await fetch(apiUrl, { headers: {'Authorization': `token ${ghToken}`} }),
                data = await response.json();
            if (typeof data.stargazers_count === "number")
                gazers = data.stargazers_count;
            else throw new Error(
                data.message || "Couldn't retrieve valid stargazers_count for repo"
            );
        } catch (e) {
            console.error("Stargazers fetch failed:", e);
        } finally {
            return gazers || "";
        }
    }

    async function createBadgeElements(homepageLinks) {
        const badgeList = homepageLinks.map(async link => {
            const badge = document.createElement("li"),
                badgeLink = document.createElement("a"),
                stargazerCnt = await fetchRepoStars(link);
            badgeLink.innerText = `⭐️ ${stargazerCnt}`;
            badgeLink.href = link.href;
            badgeLink.target = "_blank";
            badge.style = badgeStyles;
            badge.appendChild(badgeLink);
            return badge;
        });
        return await Promise.all(badgeList);
    }

    async function main() {
        const homeLinks = await getGithubHomepageLinks();
        if (homeLinks.length === 0) {
            console.warn("No packages w/ GitHub repo homepages are present in the current results.");
            return;
        }
        const badgeList = await createBadgeElements(homeLinks);
        homeLinks.forEach((link, i) => 
            link.parentElement.appendChild(badgeList[i])
        );
    }

    function runWhenLoaded() {
        if (document.readyState === "complete") main();
        else window.addEventListener('load', main);
    }

    function retryUntilSuccess() {
        let retryCnt = 0;
        const maxRetries = 5;
        const delayMs = 1500;
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
