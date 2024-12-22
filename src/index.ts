import puppeteer from "puppeteer";
import "dotenv/config";
import { XHelper } from "./helpers/XHelper";
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
    headless: false
  });

  const xHelper = new XHelper();
  const page = await xHelper.login(browser);
  const userMedias = await xHelper.getUserMedia(browser, page, form.userMediaURL);
  await browser.close();

  await FileHelper.downloadBatch(userMedias, form.downloadDir);
})();