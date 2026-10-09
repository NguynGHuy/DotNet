# DatMonAnOnline

## Nâng cấp database

Trước khi chạy phiên bản API này lần đầu, hãy thực thi script idempotent sau trên database `DatMonAnOnline`:

`DatMonAnOnline.API/DatabaseMigrations/20261009_order_snapshots_and_system_history.sql`

Script bổ sung snapshot tên nhà hàng/món/topping cho lịch sử đơn và cho phép lịch sử trạng thái do hệ thống tự động tạo. Có thể chạy lại script an toàn.

## Cấu hình email đặt lại mật khẩu

Ở môi trường `Development`, API trả `maXacNhanThuNghiem` để có thể kiểm thử local mà không cần SMTP.

Ở các môi trường khác, API yêu cầu SMTP hợp lệ và gửi mã xác nhận qua email. Nên cấu hình bằng biến môi trường, không ghi mật khẩu email vào source:

- `Email__Smtp__Host`
- `Email__Smtp__Port` (thường là `587`)
- `Email__Smtp__EnableSsl` (`true` hoặc `false`)
- `Email__Smtp__UserName`
- `Email__Smtp__Password`
- `Email__Smtp__FromAddress`
- `Email__Smtp__FromName`

Ứng dụng Production sẽ từ chối khởi động nếu thiếu `Host` hoặc `FromAddress`, tránh trường hợp giao diện báo đã gửi mã nhưng hệ thống thực tế không thể gửi email.

cd C:\xampp\htdocs\DatMonAnOnline

$env:ASPNETCORE_ENVIRONMENT="Production"
$env:Email__Smtp__Host="smtp.gmail.com"
$env:Email__Smtp__Port="587"
$env:Email__Smtp__EnableSsl="true"
$env:Email__Smtp__UserName="your-email@gmail.com"
$env:Email__Smtp__Password="your-16-character-app-password"
$env:Email__Smtp__FromAddress="your-email@gmail.com"
$env:Email__Smtp__FromName="Đặt Món Ăn"

dotnet run --no-launch-profile `
  --project .\DatMonAnOnline.API\DatMonAnOnline.API.csproj `
  --urls http://localhost:5038
