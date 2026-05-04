# Format Maintance - Kintone Deployment Tool

Công cụ deploy file format lên Kintone mà **không thay thế code có sẵn**, chỉ đẩy thêm hoặc cập nhật file format.

## ✨ Tính năng

- ✅ **Merge thông minh**: Tự động merge với danh sách JS hiện có, không xóa code cũ
- ✅ **Deploy linh hoạt**: Deploy cho bất kỳ app nào chỉ bằng 1 lệnh
- ✅ **Chạy từ bất kỳ đâu**: Không cần cd vào thư mục project
- ✅ **Tự động build**: Build và deploy trong 1 lệnh
- ✅ **An toàn**: Kiểm tra file tồn tại trước khi thay thế

## 📁 Cấu trúc dự án

```
format_maintance/
├── src/
│   └── format.js              # File format của bạn (device-tracker, etc.)
├── dist/
│   └── format.js              # File đã bundle (tự động tạo)
├── dest/
│   └── customize-manifest.json # Config deployment (legacy)
├── scripts/
│   ├── deploy-merge.js        # Script merge thông minh
│   └── get-current-js.js      # Script lấy danh sách JS hiện tại
├── webpack.config.js          # Webpack configuration
├── package.json               # Dependencies & scripts
├── .env                       # Kintone credentials
├── deploy.sh                  # Quick deploy script (bash)
├── build-and-deploy.sh        # Full deploy script (bash)
├── deploy.bat                 # Quick deploy script (Windows)
├── build-and-deploy.bat       # Full deploy script (Windows)
└── .gitignore
```

## 🚀 Cài đặt

### 1. Clone repository

```bash
git clone https://github.com/dat-ribias/maintance.git
cd maintance
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình môi trường

Tạo file `.env`:

```env
KINTONE_BASE_URL=https://your-domain.cybozu.com
KINTONE_USERNAME=your-username
KINTONE_PASSWORD=your-password
```

### 4. Cập nhật file format

Đặt code format của bạn vào `src/format.js` (ví dụ: device-tracker, maintenance, etc.)

## 📖 Cách sử dụng

### Cách 1: Dùng bash script (Khuyến nghị)

```bash
# Deploy lên app 352
/path/to/format_maintance/deploy.sh 352

# Deploy lên app 500
/path/to/format_maintance/deploy.sh 500

# Deploy lên app 402 (mặc định)
/path/to/format_maintance/deploy.sh
```

### Cách 2: Dùng npm scripts

```bash
# Từ trong thư mục project
npm run deploy              # Deploy lên app 402 (mặc định)

# Từ bất kỳ đâu
npm --prefix /path/to/format_maintance run deploy
```

### Cách 3: Dùng Windows batch file

```cmd
REM Deploy lên app 352
C:\path\to\format_maintance\deploy.bat 352

REM Deploy lên app 500
C:\path\to\format_maintance\deploy.bat 500
```

### Cách 4: Tạo alias (Tùy chọn)

Thêm vào `~/.bashrc`:

```bash
alias deploy-format='/path/to/format_maintance/deploy.sh'
```

Sau đó reload:

```bash
source ~/.bashrc

# Giờ chỉ cần gõ:
deploy-format 352
deploy-format 500
```

## 🔧 Scripts có sẵn

| Script | Mô tả |
|--------|-------|
| `npm run build` | Build webpack bundle |
| `npm run deploy` | Build và deploy lên app 402 |
| `npm run deploy:watch` | Watch mode (legacy) |
| `deploy.sh [APP_ID]` | Quick deploy từ bất kỳ đâu (bash) |
| `build-and-deploy.sh [APP_ID]` | Full deploy script (bash) |
| `deploy.bat [APP_ID]` | Quick deploy (Windows) |

## 🎯 Cách hoạt động

### Script merge thông minh

Script `scripts/deploy-merge.js` sẽ:

1. **Lấy danh sách JS hiện tại** từ Kintone app
2. **Upload file mới** lên Kintone
3. **Merge danh sách**:
   - Nếu file đã tồn tại → thay thế
   - Nếu file chưa có → thêm vào cuối
4. **Giữ nguyên** tất cả file JS khác
5. **Deploy** lên production

### Ví dụ

**Trước khi deploy:**
```json
{
  "desktop": {
    "js": [
      { "type": "URL", "url": "https://js.cybozu.com/jquery/3.6.0/jquery.min.js" },
      { "type": "FILE", "file": { "name": "customize.js" } }
    ]
  }
}
```

**Sau khi deploy:**
```json
{
  "desktop": {
    "js": [
      { "type": "URL", "url": "https://js.cybozu.com/jquery/3.6.0/jquery.min.js" },
      { "type": "FILE", "file": { "name": "customize.js" } },
      { "type": "FILE", "file": { "name": "format.js" } }
    ]
  }
}
```

✅ File `customize.js` được giữ nguyên!

## 📝 Ví dụ: Deploy Device Tracker

File `src/format.js` đã được cấu hình sẵn với device-tracker. Để deploy:

1. Cập nhật API token trong `src/format.js` (dòng 22):
   ```javascript
   const CONFIG = {
     API_TOKEN: 'YOUR_ACTUAL_API_TOKEN',
     // ...
   };
   ```

2. Deploy lên app:
   ```bash
   ./deploy.sh 402
   ```

## 🔌 API Endpoints sử dụng

- `GET /k/v1/preview/app/customize.json` - Lấy danh sách JS hiện tại
- `POST /k/v1/file.json` - Upload file mới
- `PUT /k/v1/preview/app/customize.json` - Cập nhật customize settings
- `POST /k/v1/preview/app/deploy.json` - Deploy lên production

## ⚠️ Lưu ý quan trọng

### Về authentication

Script sử dụng **Basic Authentication** với username/password từ file `.env`. Đảm bảo:
- User có quyền **Kintone Administrator**
- User có quyền truy cập app muốn deploy

### Về file .env

**KHÔNG** commit file `.env` lên git. File này đã được thêm vào `.gitignore`.

### Về merge behavior

- Script **KHÔNG XÓA** bất kỳ file JS nào đang có trên app
- Nếu file cùng tên đã tồn tại, nó sẽ được **thay thế** bằng phiên bản mới
- Tất cả file khác được **giữ nguyên**

## 🐛 Troubleshooting

### "KINTONE_BASE_URL is not defined"
- Kiểm tra file `.env` có đúng format không
- Đảm bảo không có khoảng trắng thừa

### "App not found"
- Kiểm tra App ID có đúng không
- Đảm bảo user có quyền truy cập app đó

### "Authentication failed"
- Kiểm tra username/password trong `.env`
- Thử login vào Kintone bằng trình duyệt để verify

### "dotenv: command not found"
- Script đã được cập nhật để dùng `npx dotenv`
- Nếu vẫn lỗi, chạy `npm install` lại

### File format không chạy
- Mở Console (F12) để xem error
- Kiểm tra thứ tự file JS trong app settings
- Verify API token nếu format cần gọi API

## 🔄 So sánh với kintone-customize-uploader

| Feature | kintone-customize-uploader | deploy-merge.js |
|---------|---------------------------|-----------------|
| Merge với code cũ | ❌ Thay thế toàn bộ | ✅ Merge thông minh |
| Deploy từ bất kỳ đâu | ❌ Cần cd vào thư mục | ✅ Chạy từ bất kỳ đâu |
| Truyền App ID qua tham số | ❌ Phải sửa manifest | ✅ Truyền qua CLI |
| Hiển thị danh sách JS | ❌ Không | ✅ Hiển thị trước/sau |

## 📄 License

MIT

## 👤 Author

**dat-ribias**

- GitHub: [@dat-ribias](https://github.com/dat-ribias)

## 🤝 Contributing

Contributions, issues và feature requests đều được chào đón!

## ⭐ Show your support

Nếu project này hữu ích, hãy cho một ⭐️!

---

**Last Updated:** 2026-05-04
