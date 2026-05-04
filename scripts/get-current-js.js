const axios = require('axios');
const fs = require('fs');
const path = require('path');

const KINTONE_BASE_URL = process.env.KINTONE_BASE_URL || 'https://ribias-m.cybozu.com';
const KINTONE_USERNAME = process.env.KINTONE_USERNAME || '12210';
const KINTONE_PASSWORD = process.env.KINTONE_PASSWORD || 'ribias123456aA@@';
const APP_ID = process.argv[2] || '402';

const auth = Buffer.from(`${KINTONE_USERNAME}:${KINTONE_PASSWORD}`).toString('base64');

async function getCurrentCustomize() {
  try {
    const response = await axios.get(
      `${KINTONE_BASE_URL}/k/v1/preview/app/customize.json?app=${APP_ID}`,
      {
        headers: {
          'X-Cybozu-Authorization': auth
        },
        auth: {
          username: KINTONE_USERNAME,
          password: KINTONE_PASSWORD
        }
      }
    );

    console.log('Current JS files on app', APP_ID + ':');
    console.log(JSON.stringify(response.data.desktop.js, null, 2));

    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

getCurrentCustomize();
