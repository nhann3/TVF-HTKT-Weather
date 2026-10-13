# TVF – Thời tiết công trường

Mã nguồn Cloudflare Pages, xuất ngày 13/10/2026. Không cần React hoặc thư viện ngoài.

## Sửa giao diện và chức năng
- index.html: bố cục, nhãn và trường nhập.
- src/App.css: màu, font, kích thước, giao diện điện thoại.
- src/app.js: nhật ký, nhà thầu, ảnh, ảnh hưởng, tổng hợp, CSV.
- src/weather.js: Open-Meteo, tọa độ, GPS, dự báo, bộ nhớ tạm.
- public/tvf-logo.png: logo TVF.
- scripts/build.mjs: tạo bản triển khai dist.

## GitHub → Cloudflare Pages (khuyên dùng)
1. Tạo repository RIÊNG, ví dụ TVF-ThoiTiet-CongTruong.
2. Tải toàn bộ NỘI DUNG source vào gốc repository. Không tải thêm lớp thư mục source. Tại gốc phải thấy index.html, package.json, package-lock.json, src, public, scripts.
3. Cloudflare → Workers & Pages → Create application → Pages → Connect to Git (tên nút có thể thay đổi).
4. Chọn repository mới; nhánh production main.
5. Framework: None. Build command: npm run build. Build output: dist. Root directory: để trống.
6. Đặt tên project, ví dụ tvf-thoi-tiet-nhann nếu còn trống. Cloudflare cấp https://TEN-PROJECT.pages.dev sau khi deploy thành công.
7. Sửa code trên GitHub rồi Commit; Cloudflare tự build lại nếu đã bật Git integration.

## Chạy trên máy
Cài Node.js; mở Terminal tại source:

```sh
npm ci
npm run build
```

Nếu có Python, xem bằng:

```sh
python -m http.server 4173 --directory dist
```

Mở http://localhost:4173. GPS trên điện thoại cần HTTPS.

## Direct Upload
Tạo Pages project theo Direct Upload; giải nén dist và tải nội dung dist. index.html phải ở gốc. Không tải cả gói source + dist. Nếu muốn tự build từ GitHub, chọn Git integration ngay từ đầu; đây là hai cách triển khai khác nhau.

## Dữ liệu và chức năng
- Điểm mặc định 15.974, 108.252 là THAM KHẢO gần khu FPT Đà Nẵng; cần kiểm tra và chỉnh tọa độ đúng công trường hoặc dùng GPS tại hiện trường.
- Múi giờ Asia/Ho_Chi_Minh. Hiển thị nguồn, thời điểm mô hình và thời điểm tải.
- Dự báo theo giờ/7 ngày; bộ nhớ tạm 30 phút. Khi lỗi có thể hiển thị bản đã lưu dưới 24 giờ với nhãn rõ ràng.
- Nhật ký: thời tiết thực tế, giờ mưa, ảnh hưởng theo buổi/cả ngày/khoảng giờ, từng nhà thầu, tối đa 3 ảnh đã thu nhỏ.
- Nhật ký lưu IndexedDB trên trình duyệt, fallback localStorage. Chưa đồng bộ đám mây; một ngày một bản ghi, lưu lại cập nhật ngày đó.
- Dữ liệu miền chatgpt.site KHÔNG tự chuyển sang pages.dev vì mỗi miền có bộ nhớ riêng. CSV không chứa ảnh.
- Dự báo không tự xác nhận ngừng thi công.
- Chưa có service worker/PWA ngoại tuyến hoàn chỉnh.

## Nguồn
Open-Meteo: https://open-meteo.com/; dữ liệu CC BY 4.0, đã ghi nguồn trên giao diện.
API miễn phí cho phi thương mại; vận hành thương mại cần gói phù hợp: https://open-meteo.com/en/pricing.
AccuWeather chưa tích hợp. Không đưa khóa API bí mật vào JavaScript/public/GitHub; khi dùng API có khóa cần kết nối qua máy chủ.

## Kiểm tra sau deploy
Kiểm tra tọa độ, tải dự báo, nhập và sửa nhật ký, thêm ảnh, tải lại để kiểm tra dữ liệu còn, mức ảnh hưởng theo buổi/cả ngày/theo giờ, xuất CSV, quyền GPS và lỗi mất mạng.
Đã kiểm tra cú pháp, build, đường dẫn tài nguyên; cần kiểm thử điện thoại sau khi triển khai Cloudflare.
