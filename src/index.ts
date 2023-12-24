import puppeteer from "puppeteer";
import "dotenv/config";
import { TwitterHelper } from "./TwitterHelper";

(async () => {
  const browser = await puppeteer.launch({
    headless: false
  });

  const twitterHelper = new TwitterHelper();
  const page = await twitterHelper.login(browser);
  const userMedias = await twitterHelper.getUserMedia(page, "");
  await browser.close();
  console.log(JSON.stringify(userMedias));
})();