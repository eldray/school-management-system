import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
const logosDir = path.join(uploadsDir, 'logos');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());
app.use(express.json());

// IMPORTANT: Serve static files BEFORE API routes
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  setHeaders: (res, filePath) => {
    if (filePath.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      res.setHeader('Content-Type', `image/${path.extname(filePath).substring(1)}`);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

// Your routes
import authRoutes from './routes/auth.routes.js';
import studentRoutes from './routes/student.routes.js';
import userRoutes from './routes/user.routes.js'; 
import classRoutes from './routes/class.routes.js';
import examRoutes from './routes/exam.routes.js';
import feeRoutes from './routes/fee.routes.js';
import reportRoutes from './routes/report.routes.js';
import announcementRoutes from './routes/announcement.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import schoolRoutes from './routes/school.routes.js';
import assessmentRoutes from './routes/assessment.routes.js';
import reportCardRoutes from './routes/reportCard.routes.js';
import promotionRoutes from './routes/promotion.routes.js';
import employeeRoutes from './routes/employee.routes.js';

app.use('/api/employees', employeeRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/report-cards', reportCardRoutes);
app.use('/api/report-cards', reportCardRoutes);
app.use('/api/promotions', promotionRoutes);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/school', schoolRoutes);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
  console.log(`📁 Logos directory: ${logosDir}`);
});