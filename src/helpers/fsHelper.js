const fs = require('node:fs');
const { access, stat, mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');

/**
 * @param {string} path
 * @returns {Promise<boolean>}
 */
const isDirectory = async (path) => {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch (err) {
    console.error(err);
    return false;
  }
};

/**
 * @param {string} path
 * @returns {Promise<boolean>}
 */
const isFileExists = async (path) => {
  try {
    const stats = await stat(path);
    return stats.isFile();
  } catch (err) {
    console.error(err);
    return false;
  }
};

const _writeFile = async (file, content) => {
  const dirname = path.dirname(file);
  try {
    await access(dirname, fs.constants.R_OK);
  } catch (err) {
    console.log('mkdir', dirname);
    mkdir(dirname, { recursive: true });
  }
  await writeFile(file, content);
};

module.exports = {
  isDirectory,
  isFileExists,
  writeFile: _writeFile,
};
