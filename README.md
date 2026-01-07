# MLN131 GCCN Chatbot - React + MongoDB

A chatbot about the historical mission of the working class (Giai cấp công nhân) built with React, Express, MongoDB, and Google Gemini AI.

## ✨ Features

- 🔐 **User Authentication** - Login/Register with JWT
- 💬 **Persistent Chat History** - Stored per user in MongoDB
- ⚡ **React Frontend** - Modern UI with Vite
- 🤖 **Gemini AI Integration** - Powered by Google Gemini API
- 📱 **Responsive Design** - Works on all devices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB account (free at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- Gemini API key (free at [Google AI Studio](https://aistudio.google.com/))

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/qnguen14/MLN131_G1_ChatBot.git
cd gccn-chatbot
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your_jwt_secret_key_here
PORT=3000
NODE_ENV=development
```

4. **Run the application**
```bash
npm run dev
```

- Backend: http://localhost:3000
- Frontend: http://localhost:5173

## 📁 Project Structure

```
gccn-chatbot/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── Chat.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Message.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── index.html
├── server/                # Backend modules
│   ├── models/           # MongoDB models
│   │   ├── User.js
│   │   └── ChatHistory.js
│   └── routes/           # API routes
│       └── auth.js
├── server.js             # Express server
├── vite.config.js       # Vite configuration
└── package.json
```

## 🌐 Deploy to Vercel

### 1. Set up MongoDB Atlas

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string (replace `<password>` with your actual password):
```
mongodb+srv://username:<password>@cluster.mongodb.net/gccn-chatbot?retryWrites=true&w=majority
```

### 2. Deploy to Vercel

1. **Push to GitHub**
```bash
git add .
git commit -m "React + MongoDB implementation"
git push
```

2. **Import to Vercel**
- Go to [vercel.com](https://vercel.com)
- Click "Add New Project"
- Import your GitHub repository
- Framework Preset: **Other**

3. **Add Environment Variables**
In Vercel project settings → Environment Variables, add:
```
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_random_secret_key_min_32_chars
NODE_ENV=production
```

4. **Deploy!**
Vercel will automatically build and deploy your app.

## 🔧 Development Scripts

```bash
# Run both server and client in dev mode
npm run dev

# Run server only
npm run server

# Run client only
npm run client

# Build for production
npm run build

# Start production server
npm start
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Chat
- `POST /api/chat` - Send message (requires auth)
- `GET /api/chat/history` - Get chat history (requires auth)
- `DELETE /api/chat/history` - Clear chat history (requires auth)

## 🛠️ Technologies Used

- **Frontend**: React 19, Vite
- **Backend**: Express.js, Node.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT, bcryptjs
- **AI**: Google Gemini API
- **Deployment**: Vercel

## 📄 License

ISC

## 👥 Contributors

- MLN131 Group 1

---

Made with ❤️ for education
