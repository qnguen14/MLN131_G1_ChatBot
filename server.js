import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { GoogleGenAI } from '@google/genai';
import authRoutes from './server/routes/auth.js';
import ChatHistory from './server/models/ChatHistory.js';
import { JWT_SECRET, MONGODB_URI, GEMINI_API_KEY, PORT, NODE_ENV } from './server/config.js';

dotenv.config();

const app = express();
app.use(cors({
  origin: NODE_ENV === 'production' 
    ? ['https://mln-131-g1-chat-bot.vercel.app', 'https://mln131-g1-chatbot.vercel.app']
    : 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// MongoDB connection
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Gemini AI setup
if (!GEMINI_API_KEY) {
  console.error('Missing GEMINI_API_KEY in .env');
  process.exit(1);
}
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

console.log('Using JWT_SECRET:', JWT_SECRET);

// Middleware to verify JWT token
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('Auth Header:', authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No token or invalid format');
    return res.status(401).json({ error: 'Không có token xác thực' });
  }

  const token = authHeader.split(' ')[1];
  console.log('Token received:', token ? 'Yes' : 'No');

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token decoded successfully for user:', decoded.userId);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

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

// Auth routes
app.use('/api/auth', authRoutes);

// Chat endpoint - requires authentication
app.post('/api/chat', authenticate, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const transcript = history
      .slice(-10)
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
      .join('\n');

    const prompt = `
${COURSE_CONTEXT}

Hội thoại trước:
${transcript}

Câu hỏi:
${message}

Trả lời (bullet points nếu phù hợp):
`;

    const result = await ai.models.generateContent({
      model: 'gemini-3-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const text =
      result?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ??
      'Không nhận được phản hồi từ Gemini.';

    // Save to database
    let chatHistory = await ChatHistory.findOne({ userId: req.userId });
    if (!chatHistory) {
      chatHistory = new ChatHistory({ userId: req.userId, messages: [] });
    }

    chatHistory.messages.push(
      { role: 'user', text: message },
      { role: 'assistant', text: text }
    );

    await chatHistory.save();

    res.json({ reply: text });
  } catch (err) {
    console.error(err);

    if (err.status === 429) {
      return res.status(429).json({
        error: 'Đã vượt quá giới hạn API. Vui lòng thử lại sau vài giây.',
      });
    }

    res.status(500).json({ error: 'Gemini request failed' });
  }
});

// Get chat history
app.get('/api/chat/history', authenticate, async (req, res) => {
  try {
    const chatHistory = await ChatHistory.findOne({ userId: req.userId });
    res.json({ messages: chatHistory?.messages || [] });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Không thể tải lịch sử chat' });
  }
});

// Delete chat history
app.delete('/api/chat/history', authenticate, async (req, res) => {
  try {
    await ChatHistory.findOneAndDelete({ userId: req.userId });
    res.json({ message: 'Đã xóa lịch sử chat' });
  } catch (error) {
    console.error('Delete history error:', error);
    res.status(500).json({ error: 'Không thể xóa lịch sử chat' });
  }
});

// Serve static files in production
if (NODE_ENV === 'production') {
  app.use(express.static('dist'));
  app.get('*', (req, res) => {
    res.sendFile('index.html', { root: 'dist' });
  });
}

export default app;

// Only listen on port if not in serverless environment
if (NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}
