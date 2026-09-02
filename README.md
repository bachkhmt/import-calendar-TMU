# PeopleSoft Schedule to Google Calendar (Client-Side Only)

Công cụ web **hoàn toàn chạy trên trình duyệt (client-side only)** giúp sinh viên copy-paste lịch học thô từ trang **"My Weekly Schedule"** của hệ thống **PeopleSoft / Campus Solutions** (phổ biến tại các trường đại học Bắc Mỹ như Toronto Metropolitan University - TMU, York, U of T, v.v.), tự động phân tích và đồng bộ trực tiếp vào **Google Calendar** qua Google Identity Services & Calendar API v3 hoặc tải file **.ics (iCalendar)** để import nhanh.

---

## 🌟 Tính Năng Nổi Bật

1. **Parser thông minh xử lý văn bản thô**:
   - Dán nguyên văn văn bản copy từ trình duyệt (kể cả tab `\t`, xuống dòng lộn xộn, menu, header/footer PeopleSoft).
   - Tự động nhận diện khung giờ (`H:MMAM/PM`), cột thứ (`Mon` &rarr; `Sun`), mã môn (`FIN 501`, `CECN 702`), section (`011`), tên môn, giảng viên, phòng học và loại hình học (`Lecture`, `Lab`, `Tutorial`).
2. **Hỗ trợ ghép nhiều tuần (Multi-week merge)**:
   - Cho phép dán thêm các tuần khác để phát hiện **đổi phòng học**, **đổi giờ**, hoặc **buổi học bị khuyết/nghỉ** ở các tuần nhất định.
3. **Cấu hình kỳ học & loại trừ ngày nghỉ tự động**:
   - Tự động gợi ý ngày bắt đầu từ tuần dán.
   - Nhập ngày bắt đầu, kết thúc kỳ học và timezone (mặc định các trường Bắc Mỹ như `America/Toronto`, `America/Vancouver`, v.v.).
   - Quản lý danh sách kỳ nghỉ (Reading Week, Thanksgiving, lễ...). Tự động sinh `EXDATE` để loại trừ các buổi học rơi vào ngày nghỉ.
4. **Xem trước & Tùy chỉnh trực quan**:
   - Xem danh sách toàn bộ các buổi học lặp hàng tuần, số buổi học thực tế, buổi nghỉ.
   - Tùy chọn bật/tắt từng môn, sửa phòng học hoặc tên môn trực tiếp trên giao diện trước khi xuất.
5. **Đồng bộ trực tiếp vào Google Calendar**:
   - Sử dụng Google Identity Services (GIS) OAuth 2.0 Popup.
   - Tự động tạo một Calendar mới riêng biệt (ví dụ: `TKB TMU Fall 2026`).
   - Thêm từng sự kiện lặp (`RRULE:FREQ=WEEKLY;UNTIL=...`, `EXDATE;TZID=...`) kèm thanh tiến trình trực tiếp.
6. **Xuất file .ics (iCalendar) dự phòng**:
   - 1-click tải file `.ics` chuẩn RFC 5545 để mở ngay trên Apple Calendar (iPhone/Mac), Microsoft Outlook hoặc Google Calendar mà không bắt buộc tạo Google Cloud Project.
7. **Bảo mật & Quyền riêng tư 100%**:
   - Không có máy chủ (serverless), không lưu trữ bất kỳ dữ liệu cá nhân hay lịch học của người dùng.
   - Client ID được lưu cục bộ trong `localStorage` của trình duyệt.

---

## 🚀 Cài Đặt & Chạy Cục Bộ

### Yêu cầu
- Node.js >= 18
- Trình duyệt hiện đại (Chrome, Edge, Firefox, Safari)

### Các bước cài đặt
```bash
# 1. Cài đặt thư viện
npm install

# 2. Khởi động môi trường phát triển
npm run dev
```
Mở trình duyệt tại địa chỉ `http://localhost:5173`.

### Chạy Unit Test
```bash
npm test
```
Kiểm thử với 11 test cases bao gồm parser, merger, recurrence, và calendar exporter.

### Build bản tĩnh (Production)
```bash
npm run build
```
Thư mục `dist/` chứa toàn bộ mã nguồn tĩnh sẵn sàng deploy lên GitHub Pages, Vercel, hoặc Cloudflare Pages.

---

## 🔑 Hướng Dẫn Cấu Hình Google OAuth Client ID (2 phút)

Để đồng bộ trực tiếp vào Google Calendar qua API, bạn cần một **OAuth 2.0 Client ID** miễn phí từ Google Cloud:

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/) và tạo một Project mới.
2. Vào **APIs & Services > Library**, tìm **"Google Calendar API"** và bấm **Enable (Bật)**.
3. Vào **APIs & Services > OAuth consent screen**:
   - Chọn **External**, điền App Name và Email của bạn.
   - Tại bước **Test users**: thêm địa chỉ Gmail của chính bạn.
4. Vào **APIs & Services > Credentials**:
   - Bấm **Create Credentials > OAuth Client ID**.
   - Application type: chọn **Web application**.
   - Tại mục **Authorized JavaScript origins**: thêm URL của bạn (ví dụ: `http://localhost:5173` khi chạy ở máy, hoặc domain GitHub Pages `https://<user>.github.io`).
   - Bấm **Create**, copy chuỗi Client ID và dán vào nút **"Google OAuth: Cần Client ID"** ở góc phải trên cùng của tool.

*Lưu ý: Nếu không muốn tạo Google Cloud Project, bạn vẫn có thể dùng nút **"Tải file .ics"** ở Bước 4 để import vào Google Calendar cực kỳ nhanh chóng.*

---

## 📁 Cấu Trúc Dự Án

```
import-calendar-TMU/
├── src/
│   ├── core/                          # Core Package (độc lập với UI)
│   │   ├── types.ts                   # Data models (CourseEvent, ParsedWeek, RecurringEvent...)
│   │   ├── parser.ts                  # Parser xử lý văn bản PeopleSoft thô
│   │   ├── merger.ts                  # Ghép nhiều tuần & phát hiện bất thường
│   │   ├── recurrence.ts              # Tính toán ngày học, RRULE, EXDATE, UNTIL
│   │   ├── calendar-exporter.ts       # Sinh Google Calendar Event payload & .ics RFC 5545
│   │   ├── google-auth.ts             # Google Identity Services OAuth 2.0 & Calendar API v3
│   │   ├── sample-data.ts             # Dữ liệu mẫu (TMU Fall 2026) phục vụ demo
│   │   └── __tests__/                 # Vitest test suite
│   │       ├── parser.test.ts
│   │       ├── merger.test.ts
│   │       ├── recurrence.test.ts
│   │       └── exporter.test.ts
│   ├── components/                    # UI Components (React + Tailwind CSS)
│   │   ├── Navbar.tsx
│   │   ├── OAuthHelpModal.tsx
│   │   ├── Step1Paste.tsx
│   │   ├── Step2Config.tsx
│   │   ├── Step3Preview.tsx
│   │   └── Step4Export.tsx
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── tailwind.config.js
├── vite.config.ts
└── package.json
```
