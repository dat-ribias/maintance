# Format Maintance - Kintone Deployment Tool

Công cụ deploy file format lên Kintone mà **không thay thế code có sẵn**, chỉ đẩy thêm hoặc cập nhật file format.

## ✨ Tính năng

- ✅ **Merge thông minh**: Tự động merge với danh sách JS hiện có, không xóa code cũ
- ✅ **Deploy linh hoạt**: Deploy cho bất kỳ app nào chỉ bằng 1 lệnh
- ✅ **Chạy từ bất kỳ đâu**: Không cần cd vào thư mục project
- ✅ **Tự động build**: Build và deploy trong 1 lệnh
- ✅ **An toàn**: Kiểm tra file tồn tại trước khi thay thế
- ✅ **2 tính năng trong 1 file**: Device Tracker + Maintenance Checker

## 📁 Cấu trúc dự án

```
format_maintance/
├── src/
│   ├── device-tracker.js      # Device tracking logic
│   └── maintenance.js         # Maintenance checker logic
├── dist/
│   └── control.js             # File đã bundle (30.7 KiB)
├── scripts/
│   ├── deploy-merge.js        # Script merge thông minh
│   └── get-current-js.js      # Script lấy danh sách JS hiện tại
├── webpack.config.js          # Webpack configuration
├── package.json               # Dependencies & scripts
├── .env                       # Kintone credentials & API token
├── deploy.sh                  # Quick deploy script (bash)
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
API_TOKEN=your-api-token-here
```

**Lưu ý về API_TOKEN:**
- Device Tracker cần API token với quyền **write** vào app 402 (control app)
- Maintenance Checker dùng session authentication, không cần API token riêng

## 📖 Cách sử dụng

### Deploy từ bất kỳ đâu

```bash
# Deploy lên app 352
/path/to/format_maintance/deploy.sh 352

# Deploy lên app 500
/path/to/format_maintance/deploy.sh 500

# Deploy lên app 402 (mặc định)
/path/to/format_maintance/deploy.sh
```

### Tạo alias (Khuyến nghị)

Thêm vào `~/.bashrc`:

```bash
alias deploy-format='/path/to/format_maintance/deploy.sh'
```

Sau đó:

```bash
source ~/.bashrc

# Giờ chỉ cần gõ:
deploy-format 352
deploy-format 500
```

## 🎯 Cách hoạt động

### 1. Webpack Bundle

Webpack tự động gộp 2 file thành 1:

```
src/device-tracker.js (10.9 KiB)
src/maintenance.js (15.8 KiB)
           ↓
    dist/control.js (30.7 KiB)
```

### 2. Deploy Merge

Script tự động:
1. Lấy danh sách JS hiện tại từ app
2. Upload file `control.js` mới
3. Merge với danh sách cũ (không xóa file khác)
4. Deploy lên production

**Ví dụ:**

Trước deploy:
- customize.js
- old-format.js

Sau deploy:
- customize.js ✅ (giữ nguyên)
- old-format.js ✅ (giữ nguyên)
- control.js ✨ (thêm mới)

## 📝 Tính năng trong control.js

### 1. Device Tracker

Track unique devices accessing Kintone apps:

- Device fingerprinting (userId + browser + screen + timezone)
- Daily tracking (1 lần/ngày cho mỗi app)
- Conflict handling với retry logic
- Data storage: App 402, field `control_device`

### 2. Maintenance Checker

Kiểm tra trạng thái bảo trì từ app 402:

- Centralized control từ 1 app
- User bypass (cho phép user cụ thể)
- Group bypass (cho phép nhóm user)
- Beautiful UI với Ribias branding

**App 402 structure:**
- `id_app` (Number): App ID cần check
- `status` (Number): 0 = maintenance, 1 = active
- `id_by_pass` (Text): User IDs được bypass
- `maintenance_start` (DateTime): Thời gian bắt đầu
- `maintenance_end` (DateTime): Thời gian kết thúc
- `maintenance_message` (Text): Thông báo tùy chỉnh

## ⚠️ Lưu ý quan trọng

### Authentication

- **Device Tracker**: Cần API token (write permission vào app 402)
- **Maintenance Checker**: Dùng session auth (không cần token)
- **Deploy Script**: Dùng Basic Auth (username/password)

### File .env

**KHÔNG** commit file `.env` lên git (đã có trong `.gitignore`).

### Merge Behavior

- ✅ Không xóa file JS nào
- ✅ File cùng tên → thay thế
- ✅ File khác → giữ nguyên

## 🐛 Troubleshooting

### "process is not defined"
✅ Đã fix bằng `typeof process !== 'undefined'`

### "認証に失敗しました" (Authentication failed)
✅ Đã fix bằng cách dùng `kintone.api()` thay vì `fetch()`

### Device Tracker không gửi data
- Kiểm tra `API_TOKEN` trong `.env`
- Verify token có quyền write vào app 402
- Mở Console (F12) để xem logs

### Maintenance Checker không hoạt động
- Kiểm tra app 402 có record với `id_app` = app hiện tại
- Verify field codes đúng
- Mở Console (F12) để xem logs

## 📄 License

MIT

## 👤 Author

**dat-ribias** - [@dat-ribias](https://github.com/dat-ribias)

---

**Last Updated:** 2026-05-04
