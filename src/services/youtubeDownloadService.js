const { createWriteStream } = require('node:fs');
const path = require('node:path');

const cliProgress = require('cli-progress');
const ytdl = require('ytdl-core');

const { deepSearchForKey } = require('../helpers/objectHelper');
const { writeFile } = require('../helpers/fsHelper');

const videoInfoCacheFile = path.join(__dirname, '../../.cache/videoInfo.json');

/**
 * @typedef {object} ytMetadata
 * @property {string} title
 * @property {string} artist
 * @property {string} album
 */

/**
 * @class
 */
class YoutubeDownloadService {
  /**
   * @returns {YoutubeDownloadService}
   */
  static getInstance() {
    if (!this.instance) {
      this.instance = new YoutubeDownloadService();
    }
    return this.instance;
  }

  /**
   * @param {ytdl.videoInfo} videoInfo
   * @returns {ytMetadata}
   */
  getMetadataFromVideoInfo(videoInfo) {
    /** @type ytMetadata */
    const metadata = {
      title: videoInfo.videoDetails.title,
      artist: videoInfo.videoDetails.ownerChannelName,
      album: null
    };

    const keySearched = 'videoDescriptionMusicSectionRenderer';
    const videoDescriptionMusicSectionRenderer = deepSearchForKey(videoInfo, keySearched);

    for (const row of videoDescriptionMusicSectionRenderer?.carouselLockups?.[0]?.carouselLockupRenderer?.infoRows) {
      switch (row.infoRowRenderer.title.simpleText) {
        case 'SONG': {
          metadata.title = row.infoRowRenderer.defaultMetadata.simpleText;
          break;
        }
        case 'ARTIST': {
          metadata.artist = row.infoRowRenderer.defaultMetadata.simpleText; // runs[0].text;
          // metadata.artist = row.infoRowRenderer.defaultMetadata.runs[0].text;
          break;
        }
        case 'ALBUM': {
          metadata.album = row.infoRowRenderer.defaultMetadata.simpleText;
          break;
        }
      }
    }

    return metadata;
  }

  /**
   * @param {string} videoId
   * @returns {Promise<[string, ytMetadata]>}
   */
  async downloadFromVideoId(videoId) {
    const videoUrl = `http://www.youtube.com/watch?v=${videoId}`;
    // TODO check videoUrl
    // const isVideoUrlValid = ytdl.validateURL(videoUrl);
    // console.log(isVideoUrlValid);
    const videoInfo = await ytdl.getInfo(videoUrl);
    await writeFile(videoInfoCacheFile, JSON.stringify({ info: videoInfo }, null, 2));
    const metadata = this.getMetadataFromVideoInfo(videoInfo);
    console.log('Youtube metadata:', metadata);
    // console.log({ formats: videoInfo.formats.filter((format) => format.container === 'mp4' && format.hasAudio) });
    const videoFile = path.join(__dirname, `../../.cache/${metadata.artist}_${metadata.title}.mp4`);

    const progressBar = new cliProgress.SingleBar(
      {
        clearOnComplete: false,
        hideCursor: true,
        format: '[{bar}] | {percentage}% | {value}/{total} Mb'
      },
      cliProgress.Presets.legacy
    );
    let progressBarIsStarted = false;

    await new Promise((resolve, reject) => {
      const writableStream = createWriteStream(videoFile);
      const readableStream = ytdl(videoUrl, { filter: (format) => format.container === 'mp4' && format.hasAudio && format.quality === 'medium' });
      readableStream.pipe(writableStream);
      readableStream.once('response', () => {
        console.log(`-- Start to download video ${videoId} from Youtube`);
      });
      readableStream.on('progress', (_, downloaded, total) => {
        if (!progressBarIsStarted) {
          progressBar.start(Number((total / (1024 * 1024)).toFixed(2)), 0);
          progressBarIsStarted = true;
        }
        progressBar.update(Number((downloaded / (1024 * 1024)).toFixed(2)));
      });
      readableStream.on('error', (err) => {
        console.error(err);
        reject();
      });
      writableStream.on('close', () => {
        progressBar.stop();
        resolve();
      });
      writableStream.on('error', (err) => {
        console.error(err);
        reject();
      });
    });
    return [videoFile, metadata];
  }
}

module.exports = { ytdlService: YoutubeDownloadService.getInstance() };
