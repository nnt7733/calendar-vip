# Hướng dẫn cấu hình AI (Tùy chọn)

## Groq AI - Miễn phí và nhanh

Ứng dụng hỗ trợ tích hợp **Groq AI** để parse input tốt hơn. Groq hoàn toàn **miễn phí** và không cần credit card!

### Cách lấy API Key:

1. Truy cập: https://console.groq.com/
2. Đăng ký/đăng nhập (miễn phí)
3. Vào **API Keys** → **Create API Key**
4. Copy API key

### Cấu hình:

1. Tạo file `.env` trong thư mục gốc:
```bash
GROQ_API_KEY=gsk_your_api_key_here
```

2. Restart dev server:
```bash
npm run dev
```

### Lưu ý:

- **Không bắt buộc**: Nếu không có API key, ứng dụng vẫn hoạt động với rule-based parsing
- **Miễn phí**: Groq cung cấp free tier rất hào phóng
- **Nhanh**: Groq sử dụng Llama models chạy cực nhanh

### So sánh:

| Tính năng | Rule-based | Groq AI |
|-----------|------------|---------|
| Cần API key | ❌ | ✅ |
| Tốc độ | Nhanh | Rất nhanh |
| Độ chính xác | Trung bình | Cao |
| Hiểu ngữ cảnh | ❌ | ✅ |
| Extract title sạch | ✅ (mới) | ✅ |

