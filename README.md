# Kintone Maintenance Mode Checker

Hệ thống quản lý trạng thái bảo trì tập trung cho các ứng dụng Kintone.

## Tính năng

- Quản lý trạng thái bảo trì tập trung từ App 402
- Hiển thị giao diện bảo trì đẹp mắt khi app đang maintenance
- Hỗ trợ bypass cho user cụ thể
- Dễ dàng áp dụng cho bất kỳ app nào

## Cài đặt

### 1. Tạo App quản lý (App 402)

Tạo app với các field sau:

| Field Code | Field Type | Mô tả |
|------------|-----------|-------|
| `id_app` | Number | ID của app cần quản lý |
| `status` | Number | 0 = Bảo trì, 1 = Hoạt động |
| `id_by_pass` | Text | Danh sách user ID được phép truy cập (cách nhau bằng dấu phẩy) |

### 2. Cấu hình cho app đích

1. Mở file `maintenance.js`
2. Thay đổi `TARGET_APP_ID` thành ID app bạn muốn quản lý:
   ```javascript
   var TARGET_APP_ID = 386; // Đổi thành app ID của bạn
   ```
3. Upload file vào **JavaScript customization** của app đích

### 3. Tạo record trong App 402

Tạo record mới với:
- `id_app`: 386 (hoặc ID app bạn muốn quản lý)
- `status`: 0 (bảo trì) hoặc 1 (hoạt động)
- `id_by_pass`: `user1,user2,user3` (optional)

## Sử dụng

- Khi `status = 0`: App hiển thị màn hình bảo trì
- Khi `status = 1`: App hoạt động bình thường
- User trong `id_by_pass` có thể truy cập ngay cả khi đang bảo trì

## Ưu điểm

✅ Quản lý tập trung tất cả app từ một nơi (App 402)  
✅ Không cần sửa code khi bật/tắt bảo trì  
✅ Hỗ trợ bypass cho admin/dev  
✅ Giao diện bảo trì chuyên nghiệp  

## License

© RIBIAS Co., Ltd.
