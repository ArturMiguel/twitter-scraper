# Twitter Scraper

A Twitter [scraper](https://pt.wikipedia.org/wiki/Coleta_de_dados_web) with Node.js and Puppeteer to automatically sign-in and get user media download URL.

## Features

- Automated sign-in.
- Automated search for user media download URL. Supports albums and Twitter pagination.

## How to install and run:
- You need to have Node.js >= v16 and TypeScript installed.
- Clone the repository: `git clone https://github.com/ArturMiguel/twitter-scraper`
- Install the dependencies: `npm ci`
- Rename `.env.template` to `.env` and put your credentials.
- Start the application: `npm run start`

## Disclaimer

This is a test repository for personal use, all content collected from Twitter is public and accessed by any user, i just automated this process.

If you want to use Twitter services commercially or professionally, i recommend the official Twitter API https://developer.twitter.com/en/docs/twitter-api.

## License

[MIT](LICENSE)