import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`\n=================================================`);
      console.log(` Vantero Server running on http://localhost:${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(` Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
      console.log(`=================================================\n`);

    });
  } catch (error) {
    console.error('Failed to start Vantero Server:', error.message);
    process.exit(1);
  }
};

startServer();
