import https from "https";
import fs from "fs";
import ProgressBar from 'progress';
import { UserMedia } from "../types/UserMedia";

export class FileHelper {
  static async downloadBatch(medias: UserMedia[], outputDir: string) {

    let progress: ProgressBar = null;

    for await (let [index, media] of medias.entries()) {
      await new Promise((resolve) => {
        const fileName = media.type == "photo" ? `${media.key}.jpg` : `${media.key}.mp4`
        let file = fs.createWriteStream(`${outputDir}/${fileName}`);
        https.get(media.url, (response) => {
          response.pipe(file);

          if (index == 0) {
            progress = new ProgressBar("Downloading :current/:total :bar :percent", {
              total: medias.length,
              complete: "■",
              incomplete: ".",
              width: 25
            });
          }

          file.on("finish", () => {
            progress.tick();
            file.close();
          })

          file.on("close", () => {
            resolve(true);
          })
        })
      })
    }
  }
}