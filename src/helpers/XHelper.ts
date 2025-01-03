import { Browser, Page } from "puppeteer";
import { UserMedia } from "../types/UserMedia";
import ora from "ora";

export class XHelper {
  private spinner: ora.Ora = null;

  async login(browser: Browser): Promise<Page> {
    this.spinner = ora("Authenticating user").start();

    // Open login page
    const page = await browser.newPage();
    await page.goto("https://x.com/i/flow/login");

    // Type user
    const emailInputSelector = "input[name='text']";
    await page.waitForSelector(emailInputSelector);
    await page.type(emailInputSelector, process.env.X_USER, {
      delay: 50
    });

    // Click on "next" button
    await page.evaluate(() =>
      (document.querySelectorAll("button")[3] as HTMLButtonElement).click()
    );

    // Type phone/username in case of "X" suspicious activity
    const phoneOrUsernameInputSelector = "button[data-testid='ocfEnterTextNextButton']";
    const hasSuspicious = await page.waitForSelector(phoneOrUsernameInputSelector, {
      timeout: 5000
    }).then(() => true).catch(() => false);
    if (hasSuspicious) {
      await page.type(phoneOrUsernameInputSelector, process.env.X_USERNAME_OR_PHONE, {
        delay: 50
      });
    }
    await page.evaluate(() =>
      (document.querySelectorAll("button")[2] as HTMLButtonElement).click()
    );

    // Type password
    const passwordInputSelector = "input[name='password']";
    await page.waitForSelector(passwordInputSelector);
    await page.type(passwordInputSelector, process.env.X_PASSWORD, {
      delay: 50
    });

    // Click on login button
    await page.evaluate(() =>
      (document.querySelectorAll("button")[4] as HTMLButtonElement).click()
    );
    this.spinner.succeed();

    await page.waitForNavigation();

    return page;
  }

  async getUserMedia(browser: Browser, page: Page, userMediaURL: string): Promise<UserMedia[]> {
    await page.goto(userMediaURL);

    await page.waitForNavigation();

    const userMedias: UserMedia[] = [];

    this.spinner.start("Searching all media");

    page.on("response", async (response) => {
      const url = response.url();

      // Watch network responses for user media endpoint
      if (url.includes("https://x.com/i/api/graphql") && url.includes("/UserMedia")) {
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
            const tweetTypeName = result.__typename;

            if (tweetTypeName == "TweetTombstone") {
              this.spinner.fail(result.tombstone.text.text);
              await browser.close();
              process.exit(1);
            }

            const medias = tweetTypeName == "TweetWithVisibilityResults" ? result.tweet.legacy.entities.media : result.legacy.entities.media;
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

        this.spinner.start(`Searching all media. Found: ${userMedias.filter(m => m.type == "photo").length} images and ${userMedias.filter(m => m.type == "video/mp4").length} videos`);
      }
    })

    // Scroll down to get all medias
    let lastHeight = await page.evaluate("document.body.scrollHeight");
    while (true) {
      await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
      await new Promise((resolve) => {
        setTimeout(() => resolve(1), 5000);
      })
      const currentHeight = await page.evaluate("document.body.scrollHeight");
      if (currentHeight === lastHeight) {
        this.spinner.succeed();
        return userMedias;
      }
      lastHeight = currentHeight;
    }
  }
}