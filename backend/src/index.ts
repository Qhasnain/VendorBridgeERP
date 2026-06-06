import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import router from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security and Speed Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());

// Enable CORS
app.use(cors({
  origin: '*', // Allow connections from Vite dev server
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 150, // limit each IP to 150 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', limiter);

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads if needed
// app.use('/uploads', express.static('uploads'));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date(), service: 'VendorBridge ERP Service Layer' });
});

// Main API Router
app.use('/api', router);

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Bootstrap
app.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`   VENDORBRIDGE ERP BACKEND STARTED`);
  console.log(`   Listening at http://localhost:${PORT}`);
  console.log(`   Environment: Production Ready Modular API`);
  console.log(`========================================================`);
});
