import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import * as schoolController from '../controllers/school.controller.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Protect all routes
router.use(protect);

// Configure multer for logo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'logos');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const cleanBasename = basename.replace(/[^a-zA-Z0-9]/g, '-');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, cleanBasename + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed'), false);
  }
};

const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter
});

// Settings endpoints
router.get('/settings', schoolController.getSchoolSettings);
router.put('/settings', authorize('ADMIN', 'SUPER_ADMIN'), schoolController.updateSchoolSettings);

// Logo upload endpoint
router.post('/upload-logo', authorize('ADMIN', 'SUPER_ADMIN'), upload.single('logo'), schoolController.uploadLogo);

// Grading scale endpoint
router.get('/grading-scale', schoolController.getGradingScale);

// Academic year endpoints
router.get('/academic-year/current', schoolController.getCurrentAcademicYear);
router.get('/academic-years', authorize('ADMIN', 'SUPER_ADMIN'), schoolController.getAllAcademicYears);
router.post('/academic-year/advance', authorize('ADMIN', 'SUPER_ADMIN'), schoolController.advanceAcademicYear);
router.get('/academic-year/check-advance', authorize('ADMIN', 'SUPER_ADMIN'), schoolController.checkAcademicYearAdvance);

// Term progression endpoints
router.post('/terms/manual-advance', authorize('ADMIN', 'SUPER_ADMIN'), schoolController.manualAdvanceTerm);
router.get('/terms/progression-status', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), schoolController.getTermProgressionStatus);

export default router;