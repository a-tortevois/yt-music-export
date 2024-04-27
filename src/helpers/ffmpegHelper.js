const { exec } = require('node:child_process');
const { promisify } = require('node:util');

const child_process_exec = promisify(exec);

/**
 * @typedef {object} ffmpegMetadata
 * @property {string} title
 * @property {string} artist
 * @property {string} album
 * @property {number} date
 * @property {number} track
 * @property {string} genre
 */

/**
 * @param {string} command
 * @returns {string}
 */
const execCommand = async (command) => {
  const { stdout } = await child_process_exec(command);
  return stdout;
};

/**
 * @param {ffmpegMetadata} metadata
 * @returns {string}
 */
const metadataToString = (metadata) => {
  let str = '';
  for (const [key, value] of Object.entries(metadata)) {
    str += `-metadata ${key}="${value}" `;
  }
  return str.trim();
};

/**
 * @param {string} inputVideoFile
 * @param {string} outputAudioFile
 * @returns {Promise<string>}
 */
const extractAudioFromVideo = async (inputVideoFile, outputAudioFile) => {
  const command = `ffmpeg -y -i "${inputVideoFile}" -vn -codec copy "${outputAudioFile}"`;
  return await execCommand(command);
};

/**
 * @param {string} inputAudioFile
 * @param {string} coverFile
 * @param {ffmpegMetadata} metadata
 * @param {string} outputAudioFile
 * @returns {Promise<string>}
 */
const writeTagsToAudioFile = async (inputAudioFile, coverFile, metadata, outputAudioFile) => {
  const command = `ffmpeg -y -i "${inputAudioFile}" -i "${coverFile}" -map 0 -map 1 -codec copy -disposition:v:0 attached_pic -write_id3v2 1 ${metadataToString(metadata)} "${outputAudioFile}"`;
  return await execCommand(command);
};

module.exports = {
  extractAudioFromVideo,
  writeTagsToAudioFile,
};
