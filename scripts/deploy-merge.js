const axios = require('axios');
const fs = require('fs');
const path = require('path');

const KINTONE_BASE_URL = process.env.KINTONE_BASE_URL || 'https://ribias-m.cybozu.com';
const KINTONE_USERNAME = process.env.KINTONE_USERNAME || '12210';
const KINTONE_PASSWORD = process.env.KINTONE_PASSWORD || 'ribias123456aA@@';
const APP_ID = process.argv[2] || '402';
const NEW_FILE_PATH = process.argv[3] || 'dist/format.js';

const auth = Buffer.from(`${KINTONE_USERNAME}:${KINTONE_PASSWORD}`).toString('base64');

async function getCurrentCustomize() {
  const response = await axios.get(
    `${KINTONE_BASE_URL}/k/v1/preview/app/customize.json?app=${APP_ID}`,
    {
      headers: { 'X-Cybozu-Authorization': auth },
      auth: { username: KINTONE_USERNAME, password: KINTONE_PASSWORD }
    }
  );
  return response.data;
}

async function uploadFile(filePath) {
  const fileContent = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);

  const FormData = require('form-data');
  const form = new FormData();
  form.append('file', fileContent, fileName);

  const response = await axios.post(
    `${KINTONE_BASE_URL}/k/v1/file.json`,
    form,
    {
      headers: {
        ...form.getHeaders(),
        'X-Cybozu-Authorization': auth
      },
      auth: { username: KINTONE_USERNAME, password: KINTONE_PASSWORD }
    }
  );

  return response.data.fileKey;
}

async function updateCustomize(jsFiles, cssFiles) {
  const response = await axios.put(
    `${KINTONE_BASE_URL}/k/v1/preview/app/customize.json`,
    {
      app: APP_ID,
      desktop: { js: jsFiles, css: cssFiles }
    },
    {
      headers: { 'X-Cybozu-Authorization': auth },
      auth: { username: KINTONE_USERNAME, password: KINTONE_PASSWORD }
    }
  );
  return response.data;
}

async function deployApp() {
  const response = await axios.post(
    `${KINTONE_BASE_URL}/k/v1/preview/app/deploy.json`,
    {
      apps: [{ app: APP_ID }]
    },
    {
      headers: { 'X-Cybozu-Authorization': auth },
      auth: { username: KINTONE_USERNAME, password: KINTONE_PASSWORD }
    }
  );
  return response.data;
}

async function main() {
  try {
    console.log(`\n📋 Lấy danh sách JS hiện tại từ app ${APP_ID}...`);
    const current = await getCurrentCustomize();
    const currentJS = current.desktop.js || [];
    const currentCSS = current.desktop.css || [];

    console.log('✅ Danh sách JS hiện tại:');
    currentJS.forEach((js, i) => {
      if (js.type === 'URL') {
        console.log(`   ${i + 1}. [URL] ${js.url}`);
      } else {
        console.log(`   ${i + 1}. [FILE] ${js.file.name}`);
      }
    });

    console.log(`\n📤 Upload file mới: ${NEW_FILE_PATH}...`);
    const fileKey = await uploadFile(NEW_FILE_PATH);
    const fileName = path.basename(NEW_FILE_PATH);
    console.log(`✅ Upload thành công: ${fileName}`);

    // Kiểm tra xem file đã tồn tại chưa
    const existingIndex = currentJS.findIndex(
      js => js.type === 'FILE' && js.file.name === fileName
    );

    let newJS;
    if (existingIndex >= 0) {
      console.log(`\n🔄 File ${fileName} đã tồn tại, thay thế...`);
      newJS = [...currentJS];
      newJS[existingIndex] = {
        type: 'FILE',
        file: { fileKey }
      };
    } else {
      console.log(`\n➕ Thêm file ${fileName} vào cuối danh sách...`);
      newJS = [
        ...currentJS,
        {
          type: 'FILE',
          file: { fileKey }
        }
      ];
    }

    console.log('\n📝 Danh sách JS mới:');
    newJS.forEach((js, i) => {
      if (js.type === 'URL') {
        console.log(`   ${i + 1}. [URL] ${js.url}`);
      } else {
        console.log(`   ${i + 1}. [FILE] ${js.file.fileKey ? 'format.js (mới)' : js.file.name}`);
      }
    });

    console.log('\n🔧 Cập nhật customize settings...');
    await updateCustomize(newJS, currentCSS);
    console.log('✅ Cập nhật thành công');

    console.log('\n🚀 Deploy lên production...');
    await deployApp();
    console.log('✅ Deploy thành công!');

    console.log('\n✨ Hoàn thành! File đã được thêm vào app mà không xóa code cũ.\n');

  } catch (error) {
    console.error('\n❌ Lỗi:', error.response?.data || error.message);
    process.exit(1);
  }
}

main();
