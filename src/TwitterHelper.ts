import { Browser, Page } from "puppeteer";
import { UserMedia } from "./types/UserMedia";
import ora from "ora";

export class TwitterHelper {
  private waitForNetworkIdle = async (page: Page) => {
    await page.waitForNetworkIdle({
      idleTime: 2000
    });
  }
  private spinner: ora.Ora = null;

  async login(browser: Browser): Promise<Page> {
    this.spinner = ora("Authenticating user").start();

    // Open login page
    const page = await browser.newPage();
    await page.goto("https://twitter.com/i/flow/login");

    await this.waitForNetworkIdle(page);

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
    await this.waitForNetworkIdle(page);

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
    await this.waitForNetworkIdle(page);

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
    await this.waitForNetworkIdle(page);

    this.spinner.succeed();

    return page;
  }

  async getUserMedia(page: Page, userMediaURL: string): Promise<UserMedia[]> {
    await page.goto(userMediaURL);

    const userMedias: UserMedia[] = [];

    this.spinner.start("Searching all media");

    page.on("response", async (response) => {
      const url = response.url();

      // Watch network responses for user media endpoint
      if (url.includes("https://twitter.com/i/api/graphql") && url.includes("/UserMedia")) {
        const json = await response.json();

        let itens = [];

        const instruction = json.data.user.result.timeline_v2.timeline.instructions[0].type;
        if (instruction == "TimelineClearCache") { // First response
          itens = json.data.user.result.timeline_v2.timeline.instructions[2].entries[0].content.items;
        } else if (instruction == "TimelineAddToModule") { // Next responses (pagination)
          itens = json.data.user.result.timeline_v2.timeline.instructions[0].moduleItems;
        }

        for (let item of itens) {
          const result = item.item.itemContent.tweet_results.result;
          if (result != null) {
            const medias = result.__typename == "TweetWithVisibilityResults" ? result.tweet.legacy.entities.media : result.legacy.entities.media;
            for (let media of medias) {

              const mediaType = media.type;

              if (mediaType == "photo") {
                userMedias.push({
                  key: media.media_key,
                  type: mediaType,
                  url: media.media_url_https,
                  thumbnail: null
                })
              } else if (mediaType == "video") {
                const [video] = media.video_info.variants.filter(v => v.content_type == "video/mp4").sort((a, b) => b.bitrate - a.bitrate);
                userMedias.push({
                  key: media.media_key,
                  type: video.content_type,
                  url: video.url,
                  thumbnail: media.media_url_https
                })
              }
            }
          }
        }

        this.spinner.start(`Searching all media. Found: ${userMedias.length}`);
      }
    })

    // Scroll down to get all medias
    let lastHeight = await page.evaluate("document.body.scrollHeight");
    while (true) {
      await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
      await this.waitForNetworkIdle(page);
      const currentHeight = await page.evaluate("document.body.scrollHeight");
      if (currentHeight === lastHeight) {
        this.spinner.succeed();
        return userMedias;
      }
      lastHeight = currentHeight;
    }
  }
}