# Triển khai UIT Volunteer Map và dữ liệu XTN 2026

## Kiến trúc và mức sẵn sàng

| Thành phần | Hiện trạng |
|---|---|
| Frontend | React, Vite, React Router, TanStack Query và Leaflet. Express phục vụ bản build và đường dẫn tải lại trực tiếp khi bật `SERVE_FRONTEND=true`. Frontend gọi `/api` cùng origin. |
| Backend | Express, TypeScript và Zod. Guest đọc chiến dịch, đội hình và bài đăng. Admin quản lý dữ liệu và tài khoản Leader. Leader thao tác trong đội hình của mình. |
| Xác thực | JWT có hạn dùng, đối chiếu tài khoản và role hiện tại. Mật khẩu băm bằng bcrypt. Lần khởi động đầu tạo Admin riêng trong cùng giao dịch với migration và import. Các lần sau dùng dữ liệu tài khoản đã lưu. |
| PostgreSQL | Neon PostgreSQL 17 qua TLS có xác thực chứng chỉ. TypeORM chạy migration cho cơ sở dữ liệu riêng của ứng dụng, với `synchronize: false`. Luồng phát triển SQLite tiếp tục dùng 15 migration hiện hành. [Hướng dẫn migration SQLite](../packages/backend/MIGRATIONS.md) |
| Môi trường | Render dùng Node 24.22.3 và npm 11.19.1 theo các phiên bản đã ghim. `/api/health` kiểm tra kết nối và ledger. Render dùng `/api/health/live` sau khi ứng dụng hoàn thành khởi tạo, giúp Neon ngủ khi không có truy vấn. Blueprint sinh JWT secret. CORS mặc định dùng đúng `RENDER_EXTERNAL_URL`. |
| Dependency | Audit npm ngày 19/11/2026 ghi nhận ba mục moderate, gồm hai advisory gián tiếp ở `glob` và `minimatch` cùng mục TypeORM bị ảnh hưởng. Trong app, glob dùng mẫu cố định để tìm migration. Giữ lockfile và theo dõi cập nhật TypeORM. [Glob](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4), [Minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249) |
| Ảnh | Sáu ảnh XTN được đóng gói cùng website. Tính năng tải ảnh mới của Admin và Leader cần Cloudinary với preset giới hạn. Upload lên tài khoản thật và quy trình dọn ảnh mồ côi cần thử trên dịch vụ đã cấu hình. |

Login limiter hiện dùng IP kết nối và bộ nhớ của tiến trình. Trên Render, nhiều người dùng có thể cùng chia sẻ hạn mức của một proxy. Giữ mặc định từ chối tin header chuyển tiếp cho tới khi xác minh proxy và cách lấy IP thực tại môi trường được cấp. [Mạng và proxy Render](https://render.com/articles/how-render-handles-ddos-attacks)

## Hạ tầng

[Render Blueprint](../render.yaml) dùng một Web Service Free ở Singapore để phục vụ frontend và API qua HTTPS. Dữ liệu nằm trong một project Neon Free ở AWS Singapore. Dùng tên miền `.onrender.com` và workspace Render Hobby không gắn phương thức thanh toán để giới hạn chi phí ở **$0**. Xác nhận cấu hình billing trên dashboard trước khi duyệt. [Render Free](https://render.com/docs/free), [Neon Pricing](https://neon.com/pricing)

Render chia sẻ 750 giờ Free mỗi tháng trong workspace và ngủ sau 15 phút không có truy cập. Khi hết quota băng thông hoặc build trong workspace không có phương thức thanh toán, Render có thể dừng dịch vụ hoặc tạm dừng build. Neon Free có 100 CU-giờ và 1 GB lưu trữ mỗi project. Giữ scale-to-zero và tránh đặt lịch ping liên tục. Cloudinary Free cũng cần giữ quota riêng cho tải ảnh, lưu trữ và băng thông. [Render FAQ](https://render.com/docs/faq), [Neon Pricing](https://neon.com/pricing), [Cloudinary Free](https://cloudinary.com/pricing)

## Nguồn và phạm vi dữ liệu

[Manifest XTN 2026](../packages/backend/import/xtn-2026.json) là bản trích đã rà soát từ các tab `Teams_2026`, `Events_Verified`, `Facebook_Post_Tracking` và `Media_Archive` của workbook staging. Quy trình triển khai đọc bản trích này từ repo và không cần quyền đọc Google Drive trong runtime.

- Chiến dịch có tám đội hình UIT giới thiệu và trang riêng cho nhóm Gu Xuân, dựa trên các bài UIT đã đăng. Bản tin chung của chiến dịch và hoạt động cấp trường nằm ở mục Truyền thông. [Giới thiệu đội hình](https://www.uit.edu.vn/bai-viet/gioi-thieu-cac-doi-hinh-xuan-tinh-nguyen-2026-cua-uit), [Bài về Gu Xuân](https://www.uit.edu.vn/sdgs/sdg4?page=75)
- 38 bài gồm 15 hoạt động đã xác nhận và 23 bài đăng có đối chiếu nguồn UIT. Mười bài trùng sự kiện đã được gộp vào bài hoạt động tương ứng. Dữ liệu giữ ngày diễn ra khi nguồn xác nhận và kèm liên kết gốc. Các lịch dự kiến, bài chưa khớp nguồn và tọa độ chưa xác minh nằm ngoài đợt nạp.
- Sáu JPEG sử dụng bản web có cạnh dài tối đa 1.600 px, đã bỏ metadata gốc. Mỗi bài **Bữa cơm nghĩa tình**, **Ngày hội địa phương** và **Lễ Hội quân** có hai ảnh. Ảnh đầu của Lễ Hội quân cũng làm ảnh bìa chiến dịch.
- Mỗi lần import kiểm tra khóa nguồn, quan hệ, URL và ảnh; ghi biên nhận theo khóa chiến dịch và hash của manifest trong cùng giao dịch. Chạy lại cùng bản dữ liệu không thêm, ghi đè hay khôi phục bài đã xóa. Manifest khác hoặc chiến dịch/đội hình trùng tên cần đối soát trước khi nạp. Giữ tag nhận diện nguồn trong manifest khi chuẩn bị đợt biên tập sau.

Để chạy thử trên PostgreSQL kiểm thử riêng đã migrate, build frontend rồi đặt `DATABASE_URL` trỏ tới cơ sở dữ liệu đó. Với SQLite local, dùng `DB_PATH`.

```sh
npm run seed:dist -w @uit-volunteer-map/backend -- --xtn-2026 --dry-run
npm run seed:dist -w @uit-volunteer-map/backend -- --xtn-2026
```

`--dry-run` thử toàn bộ ghi và rollback. Blueprint đã bật đợt import đầu, nên quy trình cài mới trên Render tự nạp khi chạy lần đầu.

## Các bước trên Render

1. Tạo project Neon **Free**, PostgreSQL 17, vùng AWS Singapore và database dành riêng cho ứng dụng. Lấy URL kết nối trực tiếp từ nút **Connect** để cài vào `DATABASE_URL` trên Render. Bản triển khai này khởi tạo DB mới và nạp manifest đã rà soát. Nếu có cơ sở dữ liệu production cũ, giữ nguyên dịch vụ cũ, sao lưu rồi diễn tập chuyển dữ liệu trước khi đổi đích.
2. Đưa bản thay đổi đã review lên nhánh GitHub dùng để triển khai. Trong [Render Dashboard](https://dashboard.render.com/), chọn **New → Blueprint**, chọn repo và nhánh có `render.yaml`. Xác nhận workspace Hobby và Web Service Free. Blueprint quản lý một dịch vụ và không dùng disk hay database trả phí. [Blueprint](https://render.com/docs/blueprint-spec)
3. Nhập `PRODUCTION_ADMIN_USERNAME`, `PRODUCTION_ADMIN_EMAIL` và `PRODUCTION_ADMIN_PASSWORD` trên Render. Tên gồm 3–50 ký tự chữ, số, dấu chấm, gạch dưới hoặc gạch ngang. Tạo mật khẩu từ 16 ký tự và tối đa 72 byte UTF-8 bằng trình quản lý mật khẩu. Giữ thông tin đăng nhập và URL PostgreSQL trong công cụ quản lý bí mật.
4. Đặt `VITE_CLOUDINARY_CLOUD_NAME` và `VITE_CLOUDINARY_UPLOAD_PRESET` của Cloudinary Free trước khi build. Dùng preset unsigned dành cho ảnh biên tập, giới hạn định dạng, dung lượng và thư mục. Hai biến Vite xuất hiện trong frontend. Giữ Cloudinary API secret tại nhà cung cấp. [Upload presets](https://cloudinary.com/documentation/upload_presets)
5. Sau khi Render báo **Live**, kiểm tra `/api/health` trả HTTP 200, mở trang chủ, chiến dịch, đội hình và ba bài có ảnh bằng URL trực tiếp. Đăng nhập bằng Admin mới, thử cấp quyền Leader và tải một ảnh kiểm thử. Xóa ba biến bootstrap Admin sau khi xác nhận đăng nhập. Xóa ảnh kiểm thử khỏi Cloudinary nếu đã tải lên để thử.
6. Sao lưu PostgreSQL từ máy quản trị bằng `pg_dump`. Lưu bản sao trong kho riêng. Kiểm thử phục hồi vào cơ sở dữ liệu riêng trước khi cần dùng cho production. [Neon và pg_dump](https://neon.com/docs/import/migrate-from-postgres)

```sh
pg_dump --dbname="$DATABASE_URL" --format=custom --no-owner --no-privileges --file=volunteer-map.dump
```

Đặt `DATABASE_URL` trong môi trường của phiên sao lưu. Nếu dùng tên miền riêng, điền `CORS_ORIGINS` với danh sách origin HTTPS chính xác, phân cách bằng dấu phẩy.

## Kiểm tra trước khi đưa lên online

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run check:assets
npx playwright install chromium
npm run test:journeys -- --built
export TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:5432/postgres
npm run test:production
npm run test:journeys -- --built --postgres
npm run test:smoke
npm run test:database
```

`TEST_DATABASE_URL` trỏ tới database `postgres` của một PostgreSQL kiểm thử cục bộ. Tài khoản thử nghiệm cần quyền tạo/xóa database dùng một lần. Trên PowerShell, đặt biến qua `$env:TEST_DATABASE_URL`.

Kiểm thử production chạy Express cùng frontend đã build và dùng Chromium để mở bài, đổi ảnh, tải lại đường dẫn và đăng nhập Admin. Bài kiểm thử kiểm tra sáu tệp JPEG, CORS, rollback và khả năng giữ nội dung đã sửa sau khi khởi động lại. Bộ kiểm thử Chromium chạy các luồng Guest, Admin và Leader ở hai kích thước màn hình, dùng cả SQLite và PostgreSQL.
