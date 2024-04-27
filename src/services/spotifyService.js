const { createWriteStream } = require('node:fs');
const { readFile } = require('node:fs/promises');
const https = require('node:https');
const path = require('node:path');

const prompts = require('prompts');

const { clientId, clientSecret } = require('./spotify.secret');
const { isFileExists, writeFile } = require('../helpers/fsHelper');

const spotifyCacheFile = path.join(__dirname, '../../.cache/spotify.json');
const spotifyResults = path.join(__dirname, '../../.cache/spotifyResults.json');
const spotifyApiBaseUrl = 'https://api.spotify.com/v1';

/**
 * @typedef {object} SpotifyTags
 * @property {string} title
 * @property {string} artist
 * @property {string} album
 * @property {number} releaseYear
 * @property {number} trackNumber
 * @property {number} duration
 * @property {string} coverUrl
 * @property {string} genre
 */

/**
 * @typedef {object} SpotifyQueryParams
 * @property {string} [title]
 * @property {string} [artist]
 * @property {string} [album]
 */

/**
 * @class
 */
class SpotifyService {
  /**
   * @class
   * @private
   */
  constructor() {
    this.spotifyCredentials = {
      accessToken: null,
      expirationDate: 0,
    };
  }

  /**
   * @returns {SpotifyService}
   */
  static getInstance() {
    if (!this.instance) {
      this.instance = new SpotifyService();
    }
    return this.instance;
  }

  /**
   * @private
   * @returns {Promise<string>}
   */
  async getAccessToken() {
    if (this.spotifyCredentials.expirationDate > Date.now()) {
      return this.spotifyCredentials.accessToken;
    }
    console.log('SpotifyService:getAccessToken:refreshAccessToken');
    await this.refreshAccessToken();
    return this.spotifyCredentials.accessToken;
  }

  /**
   * @private
   * @returns {Promise<void>}
   */
  async refreshAccessToken() {
    try {
      const basicAuthHeader = `Basic ${new Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          Authorization: basicAuthHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: 'grant_type=client_credentials',
      });

      if (response.status === 200) {
        const data = await response.json();
        this.spotifyCredentials.accessToken = `${data.token_type} ${data.access_token}`;
        this.spotifyCredentials.expirationDate = Date.now() + 3_590_000;
        await writeFile(spotifyCacheFile, JSON.stringify(this.spotifyCredentials, null, 2));
      } else {
        throw new Error(`Unable to refresh access token, request failed with error code ${response.status}`);
      }
    } catch (err) {
      console.error(err);
      process.exit();
    }
  }

  /**
   * @private
   * @param {number} ms
   * @returns {string}
   */
  msToReadableString(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  /**
   * @private
   * @param {*} item
   * @returns {SpotifyTags}
   */
  cleanSpotifyItem(item) {
    return {
      title: item.name,
      artist: item.album.artists[0].name,
      album: item.album.name,
      releaseYear: Number(item.album.release_date.split('-')[0]),
      trackNumber: Number(item.track_number),
      duration: this.msToReadableString(item.duration_ms),
      coverUrl: item.album.images[0].url,
      genre: '',
    };
  }

  /**
   * @private
   * @returns {Promise<void>}
   */
  async init() {
    // Load credentials from cache
    const isSpotifyCacheFileExists = await isFileExists(spotifyCacheFile);
    if (isSpotifyCacheFileExists) {
      const spotifyCredentials = JSON.parse(await readFile(spotifyCacheFile));
      if (Number(spotifyCredentials.expirationDate) > Date.now()) {
        this.spotifyCredentials.accessToken = spotifyCredentials.accessToken;
        this.spotifyCredentials.expirationDate = Number(spotifyCredentials.expirationDate);
        return;
      }
    }
    // If cache file not exists or access token is expired
    console.log('SpotifyService:init:refreshAccessToken');
    await this.refreshAccessToken();
  }

  /**
   * @param {SpotifyQueryParams} queryParams
   * @returns {Promise<SpotifyTags[]>}
   */
  async searchForItem({ artist, album, track }) {
    const searchParams = {
      q: 'remaster',
      type: 'track',
      market: 'FR',
      limit: 25,
    };
    if (artist) {
      searchParams.q += ` artist:${artist}`;
    }
    if (album) {
      searchParams.q += ` album:${album}`;
    }
    if (track) {
      searchParams.q += ` track:${track}`;
    }
    searchParams.q = searchParams.q.replaceAll(' ', '%20');
    console.log('SpotifyService:searchForItem:', { query: searchParams.q });

    const accessToken = await this.getAccessToken();

    try {
      const response = await fetch(`${spotifyApiBaseUrl}/search?${new URLSearchParams(searchParams).toString()}`, {
        method: 'GET',
        headers: {
          Authorization: accessToken,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (response.status === 200) {
        const data = await response.json();
        await writeFile(spotifyResults, JSON.stringify(data, null, 2));
        const results = [];
        for (const rawItem of data.tracks.items) {
          results.push(this.cleanSpotifyItem(rawItem));
        }
        return results;
      }
      console.log(JSON.stringify(response, null, 2));
      throw new Error(`Unable to search for item, request failed with error code ${response.status}`);
    } catch (err) {
      console.error(err);
      process.exit();
    }
  }

  /**
   * @param {SpotifyTags[]} results
   * @returns {Promise<SpotifyTags>}
   */
  async selectTagsFromResults(results) {
    const choices = [];
    for (const [index, result] of results.entries()) {
      // #index - title - artist - album - releaseYear - trackNumber - duration
      choices.push({
        title: `#${(index + 1).toString().padStart(2, '0')}: ${result.title} - ${result.artist} - ${result.album} - ${result.releaseYear} - ${result.trackNumber} - ${result.duration}`,
        value: index,
      });
    }
    const { selectedTags } = await prompts([
      {
        type: 'select',
        name: 'selectedTags',
        message: 'Select tags from Spotify:',
        choices,
      },
    ]);
    return results[selectedTags];
  }

  /**
   * @param {*} coverFile
   * @param {*} coverUrl
   * @returns {Promise<void>}
   */
  async downloadCoverFromUrl(coverFile, coverUrl) {
    await new Promise((resolve, reject) => {
      const request = https.get(coverUrl, (response) => {
        response.pipe(createWriteStream(coverFile));
        response.on('end', () => {
          console.log('Cover image downloaded successfully');
          resolve();
        });
      });
      request.on('error', (err) => {
        console.error(`Error downloading cover image: ${err}`);
        reject(err);
      });
    });
  }
}

module.exports = { spotifyService: SpotifyService.getInstance() };
