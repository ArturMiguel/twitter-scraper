import puppeteer from "puppeteer";
import "dotenv/config";
import { TwitterHelper } from "./TwitterHelper";

(async () => {
  const browser = await puppeteer.launch({
    headless: false
  });

  const twitterHelper = new TwitterHelper();
  const page = await twitterHelper.login(browser);
  await twitterHelper.getUserMedia(page, "...");
})();