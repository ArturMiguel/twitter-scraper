import { Browser, Page } from "puppeteer";

export class TwitterHelper {
  async login(browser: Browser): Promise<Page> {
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

    return page;
  }

  async getUserMedia(page: Page, userMediaURL: string) {
    await page.goto(userMediaURL);

    page.on("response", async (response) => {
      const url = response.url();
      
      // Watch network responses for user media endpoint
      if (url.includes("https://twitter.com/i/api/graphql") && url.includes("/UserMedia")) {
        const json = await response.json();

        let medias = [];

        const instruction = json.data.user.result.timeline_v2.timeline.instructions[0].type;
        if (instruction == "TimelineClearCache") { // First response
          medias = json.data.user.result.timeline_v2.timeline.instructions[2].entries[0].content.items;
        } else if (instruction == "TimelineAddToModule") { // Next responses (pagination)
          medias = json.data.user.result.timeline_v2.timeline.instructions[0].moduleItems;
        }

        for (let media of medias) {
          if (media.item.itemContent.tweet_results.result != null) {
            const m = media.item.itemContent.tweet_results.result.legacy.entities.media[0];
            const mediaType = m.type;
            let userMedia = {};

            if (mediaType == "photo") {
              userMedia = {
                key: m.media_key,
                type: mediaType,
                url: m.media_url_https
              }
            } else if (mediaType == "video") {
              const [video] = m.video_info.variants.sort((a, b) => b.bitrate - a.bitrate).filter(v => v.content_type == "video/mp4");
              userMedia = {
                key: m.media_key,
                type: video.content_type,
                url: video.url
              }
            }

            console.log(JSON.stringify(userMedia));
          }
        }
      }
    })
  }
}