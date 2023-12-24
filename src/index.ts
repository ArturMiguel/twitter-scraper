import puppeteer from "puppeteer";
import "dotenv/config";
import { TwitterHelper } from "./TwitterHelper";
import inquirer from "inquirer";

(async () => {
  const form = await inquirer.prompt([
    {
      name: "userMediaURL",
      message: "User Media URL",
      type: "input",
    }
  ]);

  const browser = await puppeteer.launch({
    headless: false
  });

  const twitterHelper = new TwitterHelper();
  const page = await twitterHelper.login(browser);
  const userMedias = await twitterHelper.getUserMedia(page, form.userMediaURL);
  await browser.close();
  console.log(JSON.stringify(userMedias));
})();