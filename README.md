# TVF – Thời tiết công trường · R11 (22/11/2026)

## Thay đổi

| Phần | Nội dung |
| --- | --- |
| Giao diện | Làm lại theo Sổ tay thương hiệu FPT (09/2023): FPT Blue `#0066B3`, FPT Orange `#F37021`, FPT Green `#0DB14B`, nền phụ `#F1F2F2`. Header xanh đậm có dải 3 màu. Thanh tab có biểu tượng: trên điện thoại là thanh cố định ở đáy màn hình, trên máy tính là thanh phân đoạn. Tab đang chọn tô cam. Nút chính màu cam đậm `#C4500D` để chữ trắng đủ tương phản. Font Be Vietnam Pro, vì FPT Daxline không có bản web. |
| Bố cục | Nguồn dự báo và GPS nằm trong tab **Hôm nay**. Đăng nhập/đồng bộ chuyển vào tab **Nhật ký** nên mở app là thấy thời tiết ngay. Header gọn hơn trên điện thoại. |
| Cảnh báo thi công | Thẻ **Dự kiến thi công** tự liệt kê khung giờ trong 24 giờ tới có mưa (khả năng ≥ 60% hoặc ≥ 1 mm), gió giật ≥ 40 km/h và nắng nóng (cảm giác ≥ 35°C), kèm gợi ý công việc cần lưu ý. Ô giờ có nhãn Mưa/Gió giật/Nóng. Dự báo 7 ngày hiện gió giật lớn nhất. Ngưỡng nằm ở hằng `ALERT` trong `src/weather.js`. |
| Sửa lỗi | **Thời tiết buổi tối/đêm trước đây không được lưu.** Giờ đã lưu, nạp lại khi bấm Sửa, hiện trong nhật ký, tính vào "Ngày có mưa", và có cột riêng trong Excel/CSV. Ngày "hôm nay" tự đổi khi app mở qua nửa đêm. Lưu được khi để trống dòng nhà thầu (trước đây báo lỗi "Nhập tên nhà thầu"). Ô chọn ngày dự báo không còn trống lúc mới mở. Excel trước đây cắt mất cột cuối "Chi tiết nhân sự" khỏi bộ lọc. |
| Ngoại tuyến | Thêm service worker. Mất sóng ở công trường vẫn mở được app, xem dự báo đã lưu và hiện nhãn "Đang ngoại tuyến". Service worker không lưu dữ liệu đăng nhập hay Supabase. |
| Bảo mật | `public/_headers` có CSP, chống nhúng iframe, HSTS. Bỏ `onclick` trong HTML. |
| Repo | Xóa bản sao cũ `app.js`, `App.css`, `weatherCloud.js`, `contractorReport.js` ở gốc (khác với `src/`, dễ sửa nhầm). Thêm `.gitignore` cho `dist/` và `node_modules/`. |

## Triển khai

Giữ nguyên cấu hình Cloudflare Pages: build command `npm run build`, output directory `dist`. Chép nội dung ZIP đè lên repo, xóa 4 file cũ ở gốc nêu trên, commit. Không cần đổi Supabase.

Nếu trước đây đã commit thư mục `dist/` lên GitHub, có thể xóa nó khỏi repo vì Cloudflare tự build.

## Đăng nhập dùng chung với app ATLĐ

App ATLĐ V1.3.0 đăng nhập bằng cùng tài khoản Supabase này (admin01 và `ten@tvgs-congtruong.local`). Xem README của ATLĐ.

## Kiểm thử đã chạy

`npm run build`. Chromium khổ iPhone 13 và máy tính, dữ liệu Open-Meteo và Supabase giả lập: hiển thị 4 tab không tràn ngang, cảnh báo mưa/gió/nóng, đăng nhập, lưu nhật ký chỉ có buổi tối "Mưa dông", nhật ký hiển thị đúng, thống kê đếm 1 ngày mưa, CSV có cột tối/đêm. Chưa thử trên điện thoại thật.
