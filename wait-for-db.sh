#!/bin/sh
set -e

echo "Waiting for PostgreSQL to be ready..."

# Wait until the database is ready
until npx prisma db push --skip-generate > /dev/null 2>&1; do
  echo "Database not ready yet. Retrying in 3 seconds..."
  sleep 3
done

echo "Database is ready! Applying migrations..."
npx prisma migrate deploy

echo "Starting application..."
exec node dist/presentation/allBotsRun.js