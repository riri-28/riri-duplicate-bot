const axios = require('axios');
const phash = require("sharp-phash");
require('dotenv').config();

const { BOT_TOKEN } = process.env;

// 1. Get the path of the file from Telegram servers
const getFileUrl = async (fileId) => {
  const { data } = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
  return data.result.file_path;
};

// 2. Convert path to a downloadable link
const getFileDownloadUrl = (filePath) => `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;

// 3. Download the image and generate the Fingerprint (pHash)
const getImagePHash = async (fileUrl) => {
  try {
    const response = await axios({
      method: 'GET',
      url: fileUrl,
      responseType: 'arraybuffer',
    });

    return phash(response.data);
  } catch(e) {
    console.error("Error generating hash:", e);
  }
}

// (This function is left here in case you want to use it later, but the new Index.js doesn't need it)
const printOldPhotos = (oldPhotos) => {
  let str = '';
  oldPhotos.forEach((i) => {
    str += `${i}\n`;
  });
  return str;
};

module.exports = {
  getFileUrl,
  getFileDownloadUrl,
  printOldPhotos,
  getImagePHash
};