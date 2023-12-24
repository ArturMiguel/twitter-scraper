import puppeteer from "puppeteer";
import "dotenv/config";

(async () => {
  const browser = await puppeteer.launch({
    headless: false
  });
  // Open login page
  const page = await browser.newPage();
  await page.goto("https://twitter.com/i/flow/login");

  const waitForNetworkIdle = async () => {
    await page.waitForNetworkIdle({
      idleTime: 2000
    });
  }

  await waitForNetworkIdle();

  // Type user
  const emailInputSelector = "input[name='text']";
  await page.waitForSelector(emailInputSelector);
  await page.type(emailInputSelector, process.env.TWITTER_USER, {
    delay: 50
  });

  // Click on "next" button
  await page.evaluate(() =>
    (document.querySelectorAll('div[role="button"]')[2] as HTMLButtonElement).click()
  );
  await waitForNetworkIdle();

  // Type phone/username in case of Twitter suspicious activity
  const phoneOrUsernameInputSelector = "input[data-testid='ocfEnterTextTextInput']";
  const hasSuspicious = await page.waitForSelector(phoneOrUsernameInputSelector, {
    timeout: 5000
  }).then(() => true).catch(() => false);
  if (hasSuspicious) {
    await page.type(phoneOrUsernameInputSelector, process.env.TWITTER_USERNAME_OR_PHONE, {
      delay: 50
    });
  }
  await page.evaluate(() =>
    (document.querySelectorAll('div[role="button"]')[1] as HTMLButtonElement).click()
  );
  await waitForNetworkIdle();

  // Type password
  const passwordInputSelector = "input[name='password']";
  await page.waitForSelector(passwordInputSelector);
  await page.type(passwordInputSelector, process.env.TWITTER_PASSWORD, {
    delay: 50
  });

  // Click on login button
  await page.evaluate(() =>
    (document.querySelectorAll('div[role="button"]')[2] as HTMLButtonElement).click()
  );
  await waitForNetworkIdle();
})();