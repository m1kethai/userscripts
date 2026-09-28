# NixOS Package Search Stargazers

A UserScript that enhances the [NixOS Package Search](https://search.nixos.org/packages) page by adding a GitHub Stargazers badge (showing the number of repository stars) for every applicable NixOS package returned in the search results that has a GitHub repository listed as its "Homepage".

## Features

- **GitHub Stars Badge**: Automatically fetches and displays a badge with the number of GitHub stars next to the package listing.
- **Easy Access**: The star badge links directly to the package's GitHub repository.

## Installation

You can install this script using a UserScript manager extension like [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), or [Greasemonkey](https://www.greasespot.net/).

1. Ensure you have a UserScript manager extension installed in your browser.
2. Create a new UserScript in your extension and paste the contents of `nixos-pkg-stargazers.user.js` into it.

## GitHub API Rate Limiting

The script uses the public, unauthenticated GitHub API to fetch the star counts. This API has a rate limit of 60 requests per hour per IP address.

If you encounter issues where the star counts fail to load (e.g., displaying `⭐️ ???` or hitting rate limits), you can bypass this by providing a personal GitHub access token.

### Setting up a GitHub Token

1. Generate a Personal Access Token (classic or fine-grained) on GitHub. It does not require any special scopes/permissions for public repositories.
2. Open your browser's Developer Tools (usually `F12` or `Ctrl+Shift+I`) while on `https://search.nixos.org`.
3. Go to the **Console** tab.
4. Run the following command, replacing `YOUR_TOKEN_HERE` with your actual token:
   ```javascript
   localStorage.setItem('userscript_gh_token', 'YOUR_TOKEN_HERE');
   ```
5. Refresh the page. The script will now use your token and be subject to the higher authenticated rate limit (5,000 requests per hour).

## License

MIT License. See the script metadata for more details.
