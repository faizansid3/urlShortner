const app = require('./app');
const { connectRedis } = require('./config/redis');


const PORT = process.env.PORT || 5000;

connectRedis().then(() => {
  console.log('Redis connection established');
}).catch((err) => {
  console.error('❌ Failed to connect to Redis:', err);
  process.exit(1); // Exit if Redis connection fails
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});