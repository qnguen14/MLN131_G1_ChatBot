import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

if (!process.env.GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY in .env");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// "Context chuẩn" bám theo slide của bạn (bạn có thể tinh chỉnh thêm)
const COURSE_CONTEXT = `
Bạn là trợ giảng CNXHKH. Trả lời ngắn gọn, có cấu trúc, đúng kiến thức về:

**1. Khái niệm và đặc điểm giai cấp công nhân**

**2. Nội dung sứ mệnh lịch sử của giai cấp công nhân:**
- Sứ mệnh kinh tế
- Sứ mệnh chính trị-xã hội
- Sứ mệnh văn hóa-tư tưởng

**3. Điều kiện quy định sứ mệnh:**
- Địa vị kinh tế
- Đặc điểm chính trị-xã hội
- Nhân tố Đảng Cộng sản
- Liên minh giai cấp

**4. Giai cấp công nhân hiện nay:**
- **Trí tuệ hóa và kỹ năng cao:** Đòi hỏi học vấn, chuyên môn cao, khả năng tự học và thích nghi nhanh với công nghệ mới (AI, robot, tự động hóa). Lao động chuyển từ cơ bắp sang lao động trí tuệ gắn công nghệ, đòi hỏi kỹ năng mềm và tư duy hệ thống.
- **Tham gia sở hữu tư liệu sản xuất:** Thông qua cổ phiếu, cổ phần, quỹ phúc lợi... tạo sự gắn kết lợi ích giữa người lao động và doanh nghiệp, thúc đẩy tinh thần làm chủ và dân chủ hóa quan hệ sản xuất.
- **Đa dạng hóa cơ cấu:** Mở rộng ra nhiều lĩnh vực (dịch vụ, công nghệ thông tin, tài chính, giáo dục...), gia tăng lao động nhập cư và lao động nữ. Có sự phân hóa về điều kiện làm việc, thu nhập và trình độ.
- **Tăng cường vai trò trong quản lý:** Tham gia sâu hơn vào xây dựng quy chế, giám sát chính sách, bảo vệ quyền lợi qua công đoàn và hội đồng người lao động.

**5. Sứ mệnh GCCN Việt Nam hiện nay:**
- Xây dựng nền kinh tế công nghiệp hóa, hiện đại hóa
- Định hướng xã hội chủ nghĩa
- Là lực lượng lãnh đạo của Đảng, xây dựng và bảo vệ Tổ quốc

**Quy tắc trả lời:**
- Sử dụng bullet points và cấu trúc rõ ràng
- Nếu câu hỏi ngoài phạm vi, hãy nói "Câu này ngoài phạm vi Chương 2" và gợi ý hỏi lại
- Trả lời súc tích nhưng đầy đủ thông tin
`;

// Add simple rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

app.post("/api/chat", async (req, res) => {
  try {
    // Rate limit check
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      return res.status(429).json({ 
        error: "Vui lòng chờ 2 giây giữa các câu hỏi." 
      });
    }
    lastRequestTime = now;

    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }

    // Gom hội thoại (simple)
    const transcript = history
      .slice(-10)
      .map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`)
      .join("\n");

    const prompt = `
${COURSE_CONTEXT}

Hội thoại trước:
${transcript}

Câu hỏi:
${message}

Trả lời (bullet points nếu phù hợp):
`;

    // Chọn model (tham khảo docs; bạn có thể đổi sang model khác nếu cần)
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text =
      result?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") ??
      "Không nhận được phản hồi từ Gemini.";

    res.json({ reply: text });
  } catch (err) {
    console.error(err);
    
    // Handle quota errors specifically
    if (err.status === 429) {
      return res.status(429).json({ 
        error: "Đã vượt quá giới hạn API. Vui lòng thử lại sau vài giây." 
      });
    }
    
    res.status(500).json({ error: "Gemini request failed" });
  }
});

// Export for Vercel serverless
export default app;

// Only listen on port if not in serverless environment
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
