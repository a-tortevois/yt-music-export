const { copyFile, readFile, rm } = require('node:fs/promises');
const path = require('node:path');

const { extractAudioFromVideo, writeTagsToAudioFile } = require('./helpers/ffmpegHelper');
const { spotifyService } = require('./services/spotifyService');
const { ytdlService } = require('./services/youtubeDownloadService');

const audioFileTmp = path.join(__dirname, '../.cache/audio.m4a');
const coverFile = path.join(__dirname, '../.cache/cover.png');
const outputFolder = 'D:\\Downloads';

const main = async () => {
  console.time('exec_time');

  const { videoId, artist, album, title } = JSON.parse((await readFile(path.join(__dirname, 'info.json'))).toString());
  console.log(JSON.stringify({ videoId, artist, album, title }, null, 2));

  // clear the console
  process.stdout.write('\u001b[2J\u001b[0;0H');

  if (!videoId) {
    throw new Error('No videoId found!');
  }

  if (!artist) {
    throw new Error('No artist found!');
  }

  if (!title) {
    throw new Error('No title found!');
  }

  await spotifyService.init();

  console.log('-- Get video info from Youtube');
  const videoFile = await ytdlService.downloadFromVideoId(videoId, artist, title);
  const audioFile = path.join(__dirname, `../.cache/${path.basename(videoFile, path.extname(videoFile))}.m4a`);
  console.log('');

  console.log('-- Extract audio from video');
  await extractAudioFromVideo(videoFile, audioFileTmp);

  console.log('-- Get tags from Spotify');
  const spotifyResults = await spotifyService.searchForItem({ artist, album, track: title });
  const spotifyTags = await spotifyService.selectTagsFromResults(spotifyResults);
  console.log('Selected:', spotifyTags);

  console.log('-- Download cover image');
  await spotifyService.downloadCoverFromUrl(coverFile, spotifyTags.coverUrl);

  console.log('-- Write tags to audio file');
  const metadata = {
    title: spotifyTags.title,
    artist: spotifyTags.artist,
    album: spotifyTags.album,
    date: spotifyTags.releaseYear,
    track: spotifyTags.trackNumber,
    // genre: 'Test genre',
  };
  await writeTagsToAudioFile(audioFileTmp, coverFile, metadata, audioFile);

  console.log('-- Mode to output folder');
  // TODO
  // fsPromises.copyFile(src, dest[, mode])
  // rm(audioFileTmp);

  console.timeEnd('exec_time');
};

main();

// https://www.youtube.com/watch?v=F_PdrnSzM5U
// npm run start F_PdrnSzM5U
// const outputFile = `${metadata.track.toString().padStart(2, '0')} ${metadata.title}`.slice(0, 36).trim().concat('.m4a');
