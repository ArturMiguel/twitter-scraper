import puppeteer from "puppeteer";
import "dotenv/config";
import { TwitterHelper } from "./helpers/TwitterHelper";
import inquirer from "inquirer";
import { FileHelper } from "./helpers/FileHelper";

(async () => {
  const form = await inquirer.prompt([
    {
      name: "userMediaURL",
      message: "User Media URL",
      type: "input",    
    },
    {
      name: "downloadDir",
      message: "Local directory to save the files",
      type: "input",
    }
  ]);

  const browser = await puppeteer.launch({
    headless: "new"
  });

  const twitterHelper = new TwitterHelper();
  const page = await twitterHelper.login(browser);
  const userMedias = await twitterHelper.getUserMedia(page, form.userMediaURL);
  await browser.close();

  await FileHelper.downloadBatch(userMedias, form.downloadDir);
})();