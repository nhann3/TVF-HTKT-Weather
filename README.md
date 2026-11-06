# TVF – Thời tiết công trường · R10.6 kiểm thử

## Tệp đã sửa

| Tệp | Thay đổi |
| --- | --- |
| `index.html` | Gợi ý bàn phím và tự điền dành cho ô tài khoản trên điện thoại, nút khôi phục admin01, nhãn và phiên bản tài nguyên mới. |
| `src/app.js` | Khởi tạo đăng nhập độc lập với IndexedDB. Nạp nhật ký cũ riêng để dữ liệu về muộn không ghi đè nhật ký vừa đồng bộ. |
| `src/weatherCloud.js` | Dùng phiên trong bộ nhớ khi trình duyệt chặn lưu phiên. Gửi email khôi phục qua Supabase, xác minh token thuộc admin01 trước khi đổi mật khẩu và yêu cầu đăng nhập lại sau khi đổi. |
| `README.md` | Hướng dẫn cấu hình, triển khai và nghiệm thu. |

Các bản sao JavaScript/CSS ở thư mục gốc có sẵn trong ZIP ban đầu. Điểm chạy chính là `index.html` và `src/`. Bản build chuyển `src/` thành `dist/assets/`.

## Triển khai thử trên Cloudflare Pages

1. Giải nén ZIP. Thư mục chứa `package.json` là thư mục gốc của mã nguồn.
2. Với Git integration, dùng build command `npm run build` và output directory `dist`. Với Direct Upload, chạy `npm ci` và `npm run build`, rồi tải nội dung `dist/` lên Pages.
3. Mở URL HTTPS và kiểm tra nhãn **Bản kiểm thử 06/11 · R10.6**. Dùng một URL thử cố định để đăng ký đường dẫn khôi phục.
4. Mã nguồn đang trỏ đến dự án Supabase hiện hữu. Việc ghi nhật ký hay đổi mật khẩu trên URL thử vẫn có hiệu lực trên dự án đó. Để thử đổi mật khẩu hoặc ghi dữ liệu độc lập, dùng Supabase thử nghiệm có schema và quyền tương ứng, rồi đổi `base`, `key` và `adminEmail` trong `src/weatherCloud.js`. `key` ở frontend phải là khóa publishable.
5. Trong Supabase **Authentication → URL Configuration**, thêm đúng URL HTTPS mở ứng dụng (ví dụ `https://ten-ban-thu.pages.dev/`) vào **Redirect URLs**. Giữ nguyên Site URL đang phục vụ các ứng dụng khác. Mẫu Reset Password cần dẫn qua liên kết xác nhận Supabase (`{{ .ConfirmationURL }}`), sau đó quay lại đúng URL ứng dụng với dữ liệu recovery trong fragment. Kiểm tra cấu hình gửi thư và giới hạn gửi nếu email không đến.

[Supabase – Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls) · [Supabase – Password-based Auth](https://supabase.com/docs/guides/auth/passwords)

## Tự đặt lại mật khẩu admin01

1. Mở bản triển khai HTTPS. Nếu đang đăng nhập, mở một cửa sổ riêng tư hoặc đăng xuất. Chọn **Quên mật khẩu admin01?**. Supabase gửi tới hộp thư đã đăng ký của tài khoản.
2. Mở liên kết từ email mới nhất trong Safari hoặc Chrome. Kiểm tra đúng tên miền triển khai trước khi nhập mật khẩu. Nếu liên kết hết hạn, đã dùng, hoặc trang bị tải lại trước khi lưu, yêu cầu email mới.
3. Tạo mật khẩu riêng bằng trình quản lý mật khẩu, nhập hai lần và chọn **Lưu mật khẩu mới**. Form yêu cầu ít nhất 8 ký tự và Supabase có thể áp dụng chính sách chặt hơn.
4. Đăng nhập lại bằng `admin01` và mật khẩu mới. Nếu cùng tài khoản được dùng trong ứng dụng khác, dùng mật khẩu mới khi đăng nhập lại ở đó. Giữ mật khẩu và liên kết khôi phục trong trình quản lý mật khẩu hoặc hộp thư của bạn.

Luồng đăng nhập gọi Supabase Auth, rồi kiểm tra `tvf_weather_members.can_write` trước khi đồng bộ. Token khôi phục được gỡ khỏi thanh địa chỉ, dùng trong bộ nhớ và kiểm tra với Supabase trước khi đổi mật khẩu. ZIP nguồn không có schema hay chính sách RLS để xác minh quyền trên máy chủ. Khi dùng dự án khác, cần cấu hình bảng `tvf_weather_members`, `tvf_weather_journal`, RPC `tvf_weather_save` và bucket `tvf-weather-photos` cùng chính sách truy cập tương ứng.

## Kiểm thử điện thoại

- Trên iPhone Safari và Android Chrome, mở cùng URL HTTPS. Thử đăng nhập bằng `admin01` và email thật của tài khoản. Thử cả nhập tay và tự điền. Mật khẩu sai phải báo lỗi và cho nhập lại.
- Khi thành công, trạng thái phải báo đã đồng bộ. Tải lại, thử đồng bộ và đăng xuất. Khi trình duyệt từ chối ghi phiên, đăng nhập vẫn phải đồng bộ trong trang hiện tại và tải lại có thể yêu cầu đăng nhập lại.
- Nếu từng có nhật ký cũ trên thiết bị, kiểm tra số ngày và tải bản sao từ mục **Chuyển nhật ký cũ trên thiết bị này**. Việc mở kho dữ liệu cũ không được chặn đăng nhập.
- Với tài khoản ở dự án thử, gửi email khôi phục, thử hai ô không khớp, đặt mật khẩu thành công rồi kiểm tra mật khẩu mới đăng nhập được và mật khẩu cũ bị từ chối. Thử liên kết hết hạn hoặc sai tài khoản. Trên dự án dùng chung, lên lịch đổi mật khẩu trước khi thực hiện.
- Nếu xác thực qua nhưng đồng bộ lỗi, đối chiếu trạng thái hiển thị, quyền thành viên và log Supabase. Ghi lại trình duyệt, phiên bản hệ điều hành và thông báo lỗi, bỏ thông tin đăng nhập và token.
- Kiểm tra thêm dự báo, GPS, xem nhật ký, lưu bản ghi thử kèm ảnh và xuất CSV trên dự án thử.

Đã chạy `npm ci`, `npm run build` và kiểm thử mô phỏng đăng nhập khi localStorage bị chặn, gửi yêu cầu khôi phục, đổi mật khẩu đúng tài khoản và từ chối token của tài khoản khác. Cần chạy checklist trên thiết bị thật sau khi triển khai.
