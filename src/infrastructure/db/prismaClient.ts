import { PrismaClient } from "@prisma/client";

// Create a single PrismaClient instance for the whole project
export const prisma = new PrismaClient();
