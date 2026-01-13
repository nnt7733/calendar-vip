# Smart Calendar Planner + Finance

Ứng dụng quản lý lịch và tài chính thông minh với AI parsing tự nhiên. Hỗ trợ thêm task, event, và giao dịch tài chính bằng ngôn ngữ tự nhiên tiếng Việt.

## ✨ Tính năng chính

- 📅 **Calendar Planner**: Xem lịch tháng với tasks và events được highlight theo màu sắc
- ✅ **Todo Manager**: Quản lý inbox, planned, và completed tasks
- 💰 **Finance Manager**: Theo dõi thu chi, budget, và báo cáo tài chính
- 🤖 **AI Quick Add**: Thêm items bằng ngôn ngữ tự nhiên (tiếng Việt)
- 🎨 **Deadline Countdown**: Màu sắc thay đổi theo thời gian còn lại đến deadline
- ⭐ **Priority System**: Ngôi sao cho tasks quan trọng
- 🔄 **Dual View**: Chuyển đổi giữa view Tasks và Finance trên calendar

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Prisma + SQLite
- **AI**: Groq AI (Optional) hoặc Rule-based parsing

## 📋 Yêu cầu hệ thống

- Node.js >= 18.x
- npm, yarn, hoặc pnpm
- Groq API Key (Tùy chọn - miễn phí)

## 🚀 Hướng dẫn cài đặt

### Bước 1: Clone và cài đặt dependencies

```bash
# Nếu chưa có code, clone repository
git clone <repository-url>
cd calendar-vip

# Cài đặt dependencies
npm install
```

### Bước 2: Cấu hình Groq AI (Tùy chọn nhưng khuyến nghị)

#### 2.1. Lấy Groq API Key miễn phí

1. **Truy cập Groq Console**: https://console.groq.com/
2. **Đăng ký/Đăng nhập**:
   - Click "Sign Up" hoặc "Log In"
   - Đăng nhập bằng Google, GitHub, hoặc email
   - **Hoàn toàn miễn phí, không cần credit card!**
3. **Tạo API Key**:
   - Sau khi đăng nhập, vào menu **API Keys** (góc trên bên phải)
   - Click **"Create API Key"**
   - Đặt tên cho API key (ví dụ: "Calendar App")
   - Click **"Submit"**
   - **Copy API key ngay lập tức** (sẽ không hiển thị lại sau này)
   - API key có dạng: `gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

#### 2.2. Thêm API Key vào project

1. **Tạo file `.env`** trong thư mục gốc của project:
   ```bash
   # Trên Windows (PowerShell)
   New-Item .env
   
   # Hoặc tạo thủ công bằng text editor
   ```

2. **Thêm API key vào file `.env`**:
   ```env
   GROQ_API_KEY=gsk_your_api_key_here
   ```
   
   Thay `gsk_your_api_key_here` bằng API key bạn vừa copy.

3. **Lưu file `.env`**

**Lưu ý quan trọng:**
- File `.env` đã được thêm vào `.gitignore`, không commit lên Git
- Nếu không có API key, ứng dụng vẫn hoạt động với rule-based parsing
- Rule-based parsing vẫn tốt nhưng AI parsing chính xác và hiểu ngữ cảnh hơn

### Bước 3: Setup database

```bash
# Generate Prisma Client
npm run prisma:generate

# Tạo database và các bảng
npm run prisma:push
```

### Bước 4: Seed dữ liệu mẫu (Tùy chọn)

```bash
npm run seed
```

Lệnh này sẽ tạo:
- 5 categories mẫu (Food & Drink, Transport, Study, Salary, Freelance)
- 2 transactions mẫu
- 2 calendar items mẫu
- 1 budget mẫu

### Bước 5: Khởi động ứng dụng

```bash
npm run dev
```

Mở trình duyệt và truy cập: **http://localhost:3000**

## 📖 Hướng dẫn sử dụng

### 1. Quick Add với AI

Click nút **"Quick Add"** (có icon ✨) ở header để mở modal.

#### Cách nhập:

**Tasks:**
- `"Thi lái xe sáng thứ 7 tuần này"`
- `"Hoàn thành IELTS Reading thứ 5"`
- `"Họp nhóm chiều thứ 3 urgent"`

**Finance:**
- `"Chi 45k ăn sáng mai 7pm"`
- `"Thu 2tr lương tháng này"`
- `"Mua sách 120k hôm nay"`

**Events:**
- `"Sinh nhật bạn sáng chủ nhật"`
- `"Họp công ty chiều thứ 2"`

#### Quy trình:

1. **Nhập mô tả** vào textarea
2. Click **"Phân tích với AI"** hoặc nhấn `Ctrl+Enter`
3. **Xem preview** - kiểm tra thông tin đã parse
4. Click **"Xác nhận và tạo"** hoặc nhấn `Ctrl+Enter` để tạo

### 2. Calendar View

- **Xem lịch tháng**: Hiển thị tất cả tasks và events
- **Toggle view**: Chuyển giữa "All", "Tasks", và "Finance"
- **Click vào ngày**: Xem chi tiết items trong ngày
- **Màu sắc deadline**:
  - 🔴 Đỏ: Hôm nay (0 ngày)
  - 🟠 Cam: 1-2 ngày
  - 🟡 Vàng: 3-7 ngày
  - 🔵 Xanh: Bình thường
- **Ngôi sao ⭐**: Tasks có priority "high" hoặc "urgent"

### 3. Todo Manager

- **Inbox**: Tasks chưa có deadline
- **Planned**: Tasks có deadline
- **Done**: Tasks đã hoàn thành
- **Checkbox**: Click để đánh dấu hoàn thành/chưa hoàn thành

### 4. Finance Manager

- **Thêm transaction**: Form bên phải
- **Xem danh sách**: Tất cả giao dịch theo thời gian
- **Tự động tạo reminder**: Mỗi transaction tự động tạo finance reminder trên calendar
- **Báo cáo**: Tổng thu, chi, balance, top categories

### 5. Settings

- **Giao diện**: Chọn nền tối/sáng
- **Tiền tệ**: Chọn loại tiền (VND, USD, EUR, JPY)
- **Ngôn ngữ**: Chọn ngôn ngữ hiển thị (sẽ cập nhật sau)

## 🎯 Ví dụ sử dụng

### Thêm task với deadline:

```
Input: "Thi lái xe sáng thứ 7 tuần này"
→ Tạo TASK: "Thi lái xe"
→ Date: Thứ 7 tuần này, 8h sáng
→ Tags: study, transport
→ Có deadline countdown
```

### Thêm finance transaction:

```
Input: "Chi 45k ăn sáng mai 7pm"
→ Tạo TRANSACTION: 45,000 VND, category: Food
→ Tạo FINANCE_REMINDER trên calendar
→ Date: Ngày mai, 19h
```

### Thêm event (không có deadline):

```
Input: "Họp nhóm sáng thứ 3"
→ Tạo EVENT: "Họp nhóm"
→ Date: Thứ 3, 00:00:00 (không có giờ cụ thể)
→ Không có deadline
```

## 🔧 Các lệnh hữu ích

### Development

```bash
# Chạy dev server
npm run dev

# Build cho production
npm run build
npm run start

# Chạy linter
npm run lint
```

### Database

```bash
# Xem database với Prisma Studio
npm run prisma:studio
# Mở tại http://localhost:5555

# Tạo migration mới
npx prisma migrate dev --name migration_name

# Reset database (xóa tất cả dữ liệu)
# Trên Windows PowerShell:
Remove-Item prisma/dev.db -ErrorAction SilentlyContinue
Remove-Item prisma/dev.db-journal -ErrorAction SilentlyContinue
npx prisma db push
npm run seed
```

## 🐛 Troubleshooting

### Lỗi "Prisma Client not generated"

```bash
npm run prisma:generate
```

### Lỗi "Database is locked"

**Nguyên nhân**: Database đang được sử dụng bởi process khác.

**Giải pháp**:
1. Đóng tất cả terminal/process đang chạy Prisma
2. Đóng Prisma Studio nếu đang mở
3. Đợi vài giây rồi thử lại
4. Xóa file journal:
   ```powershell
   Remove-Item prisma/dev.db-journal -ErrorAction SilentlyContinue
   ```
5. Hoặc xóa và tạo lại database (xem phần Database ở trên)

### Lỗi "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

**Nguyên nhân**: Server trả về HTML thay vì JSON (thường do lỗi API route).

**Giải pháp**:
1. Kiểm tra console để xem lỗi chi tiết
2. Đảm bảo dev server đang chạy: `npm run dev`
3. Kiểm tra file `.env` có đúng format không
4. Restart dev server

### Lỗi "Failed to parse input"

**Nguyên nhân**: Input không được nhận diện đúng.

**Giải pháp**:
- Thử format rõ ràng hơn, ví dụ:
  - ✅ `"Thi lái xe sáng thứ 7 tuần này"`
  - ✅ `"Chi 45k ăn sáng mai 7pm"`
  - ❌ `"Thi lái xe"` (thiếu thời gian)

### API Key không hoạt động

**Kiểm tra**:
1. File `.env` có đúng tên biến: `GROQ_API_KEY=...`
2. API key có đúng format: bắt đầu bằng `gsk_`
3. Đã restart dev server sau khi thêm API key
4. Kiểm tra API key còn valid tại https://console.groq.com/

## 📡 API Endpoints

### `POST /api/plan`
Parse input tự nhiên thành calendar items và transactions.

**Request:**
```json
{
  "input": "Chi 45k ăn sáng hôm nay"
}
```

**Response:**
```json
{
  "clarifyingQuestion": null,
  "assumptions": ["Đã sử dụng AI để parse."],
  "create": {
    "calendarItems": [...],
    "transactions": [...]
  }
}
```

### `GET /api/calendar-items`
Lấy tất cả calendar items.

### `POST /api/calendar-items`
Tạo calendar item mới.

**Request:**
```json
{
  "type": "TASK",
  "title": "Hoàn thành cuốn sách",
  "description": "",
  "startAt": null,
  "endAt": null,
  "dueAt": "2024-01-30T00:00:00.000Z",
  "tags": ["study"],
  "status": "TODO"
}
```

### `PATCH /api/calendar-items`
Cập nhật calendar item (ví dụ: đổi status).

**Request:**
```json
{
  "id": "item-id",
  "status": "DONE"
}
```

### `GET /api/transactions`
Lấy tất cả transactions.

### `POST /api/transactions`
Tạo transaction mới.

**Request:**
```json
{
  "type": "EXPENSE",
  "amount": 45000,
  "currency": "VND",
  "categoryId": "category-id",
  "note": "Ăn sáng",
  "dateAt": "2024-01-10T07:00:00.000Z"
}
```

### `GET /api/categories`
Lấy tất cả categories.

## 🎨 Tính năng nổi bật

### Deadline Countdown với màu sắc
- Tasks có deadline được highlight theo thời gian còn lại
- Màu đỏ = hôm nay, cam = 1-2 ngày, vàng = 3-7 ngày

### Priority System
- Tasks có tag "urgent" hoặc "high" hiển thị ngôi sao ⭐
- Có thể thêm priority khi nhập: `"task name urgent"` hoặc `"task name high"`

### Dual View Mode
- **All**: Hiển thị tất cả (tasks + finance)
- **Tasks**: Chỉ tasks và events
- **Finance**: Chỉ finance reminders và transactions

### Events không có deadline
- Events không set giờ cụ thể (00:00:00)
- Chỉ có `startAt`, không có `dueAt`
- Phù hợp cho các sự kiện không cần deadline

## 📝 Ghi chú

- Tất cả dữ liệu được lưu trữ **cục bộ** trên máy của bạn (SQLite)
- Không cần internet để sử dụng (trừ khi dùng Groq AI)
- Groq AI hoàn toàn **miễn phí** với free tier hào phóng
- Rule-based parsing vẫn hoạt động tốt nếu không có API key

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Hãy tạo issue hoặc pull request.

## 📄 License

MIT

---

**Lưu ý**: Đây là project demo/learning. Để sử dụng production, cần thêm authentication, encryption, và các tính năng bảo mật khác.
