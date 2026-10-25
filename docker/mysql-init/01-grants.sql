-- Local dev only. Prisma `migrate dev` needs a shadow database and the test suite needs its own database.
CREATE DATABASE IF NOT EXISTS suara_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS suara_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON `suara`.* TO 'suara'@'%';
GRANT ALL PRIVILEGES ON `suara_shadow`.* TO 'suara'@'%';
GRANT ALL PRIVILEGES ON `suara_test`.* TO 'suara'@'%';
FLUSH PRIVILEGES;
