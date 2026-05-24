const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { createClient } = require("redis");

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 3000;
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

app.use(express.json());

const redis = createClient({
  url: REDIS_URL,
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

app.get("/", (req, res) => {
  res.json({
    message: "Mini DevOps App is running",
  });
});

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();

    res.json({
      status: "ok",
      database: "ok",
      redis: "ok",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

app.post("/visits", async (req, res) => {
  const visit = await prisma.visit.create({
    data: {
      message: req.body.message || "Hello from DevOps deploy",
    },
  });

  await redis.incr("visits_count");

  res.json(visit);
});

app.get("/visits", async (req, res) => {
  const visits = await prisma.visit.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  const count = await redis.get("visits_count");

  res.json({
    count: Number(count || 0),
    items: visits,
  });
});

async function bootstrap() {
  await redis.connect();

  app.listen(PORT, () => {
    console.log(`Backend started on port ${PORT}`);
  });
}

bootstrap();