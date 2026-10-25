-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(64) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `isSuperadmin` BOOLEAN NOT NULL DEFAULT false,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `mustChangePassword` BOOLEAN NOT NULL DEFAULT true,
    `failedLoginCount` INTEGER NOT NULL DEFAULT 0,
    `lockedUntil` DATETIME(3) NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ElectionMember` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `electionId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `role` ENUM('SUPERADMIN', 'KETUA', 'REGISTRATOR', 'CALLER', 'SAKSI') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ElectionMember_userId_idx`(`userId`),
    UNIQUE INDEX `ElectionMember_electionId_userId_key`(`electionId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuthSession` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `tokenHash` CHAR(64) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NULL,
    `ip` VARCHAR(64) NULL,
    `userAgent` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AuthSession_tokenHash_key`(`tokenHash`),
    INDEX `AuthSession_userId_idx`(`userId`),
    INDEX `AuthSession_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Election` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `academicYearLabel` VARCHAR(20) NOT NULL,
    `eraportYearId` INTEGER NULL,
    `kind` ENUM('REHEARSAL', 'REAL') NOT NULL DEFAULT 'REAL',
    `scheduledStart` DATETIME(3) NULL,
    `scheduledEnd` DATETIME(3) NULL,
    `forceState` ENUM('NONE', 'OPEN', 'CLOSED') NOT NULL DEFAULT 'NONE',
    `graceMinutes` INTEGER NOT NULL DEFAULT 5,
    `resultsRevealedAt` DATETIME(3) NULL,
    `resultsRevealedBy` INTEGER NULL,
    `publicResults` BOOLEAN NOT NULL DEFAULT false,
    `finalizedAt` DATETIME(3) NULL,
    `finalizedBy` INTEGER NULL,
    `resultsSnapshot` JSON NULL,
    `currentFlag` INTEGER NULL,
    `ketuaName` VARCHAR(150) NULL,
    `ketuaNis` VARCHAR(30) NULL,
    `ketuaClass` VARCHAR(50) NULL,
    `ketuaTitle` VARCHAR(150) NULL,
    `revision` INTEGER NOT NULL DEFAULT 0,
    `createdBy` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Election_currentFlag_key`(`currentFlag`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Candidate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `electionId` INTEGER NOT NULL,
    `number` INTEGER NOT NULL,
    `chairName` VARCHAR(150) NOT NULL,
    `viceName` VARCHAR(150) NOT NULL,
    `chairNis` VARCHAR(30) NULL,
    `viceNis` VARCHAR(30) NULL,
    `slogan` VARCHAR(255) NULL,
    `vision` TEXT NULL,
    `missions` JSON NOT NULL,
    `programs` JSON NOT NULL,
    `photoPath` VARCHAR(255) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Candidate_electionId_number_key`(`electionId`, `number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Voter` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `electionId` INTEGER NOT NULL,
    `type` ENUM('STUDENT', 'TEACHER') NOT NULL,
    `externalId` VARCHAR(50) NOT NULL,
    `nis` VARCHAR(50) NOT NULL,
    `nisn` VARCHAR(30) NULL,
    `name` VARCHAR(200) NOT NULL,
    `className` VARCHAR(80) NULL,
    `level` INTEGER NULL,
    `gender` VARCHAR(5) NULL,
    `email` VARCHAR(150) NULL,
    `eligible` BOOLEAN NOT NULL DEFAULT true,
    `source` VARCHAR(20) NOT NULL DEFAULT 'ERAPORT',
    `syncedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Voter_electionId_className_name_idx`(`electionId`, `className`, `name`),
    INDEX `Voter_electionId_name_idx`(`electionId`, `name`),
    UNIQUE INDEX `Voter_electionId_type_externalId_key`(`electionId`, `type`, `externalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VotingSession` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `electionId` INTEGER NOT NULL,
    `voterId` INTEGER NOT NULL,
    `status` ENUM('REGISTERED', 'ASSIGNED', 'ACTIVE', 'VOTED', 'CANCELLED') NOT NULL DEFAULT 'REGISTERED',
    `queuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `queuedBy` INTEGER NULL,
    `boothId` INTEGER NULL,
    `assignedAt` DATETIME(3) NULL,
    `assignedBy` INTEGER NULL,
    `activatedAt` DATETIME(3) NULL,
    `activatedBy` VARCHAR(40) NULL,
    `votedAt` DATETIME(3) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `cancelReason` VARCHAR(255) NULL,
    `castKey` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VotingSession_voterId_key`(`voterId`),
    INDEX `VotingSession_electionId_status_queuedAt_idx`(`electionId`, `status`, `queuedAt`),
    INDEX `VotingSession_boothId_idx`(`boothId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Booth` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `electionId` INTEGER NOT NULL,
    `number` INTEGER NOT NULL,
    `label` VARCHAR(80) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `currentSessionId` INTEGER NULL,
    `pairingCodeHash` CHAR(64) NULL,
    `pairingExpiresAt` DATETIME(3) NULL,
    `deviceTokenHash` CHAR(64) NULL,
    `pairedAt` DATETIME(3) NULL,
    `lastSeenAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Booth_currentSessionId_key`(`currentSessionId`),
    UNIQUE INDEX `Booth_deviceTokenHash_key`(`deviceTokenHash`),
    UNIQUE INDEX `Booth_electionId_number_key`(`electionId`, `number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ballot` (
    `id` CHAR(36) NOT NULL,
    `electionId` INTEGER NOT NULL,
    `candidateId` INTEGER NOT NULL,
    `castHour` DATETIME(3) NOT NULL,

    INDEX `Ballot_electionId_candidateId_idx`(`electionId`, `candidateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `electionId` INTEGER NULL,
    `actorType` ENUM('USER', 'BOOTH', 'SYSTEM') NOT NULL,
    `actorId` INTEGER NULL,
    `actorLabel` VARCHAR(150) NULL,
    `action` VARCHAR(60) NOT NULL,
    `entityType` VARCHAR(40) NULL,
    `entityId` VARCHAR(40) NULL,
    `metadata` JSON NULL,
    `ip` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `prevHash` CHAR(64) NULL,
    `hash` CHAR(64) NULL,

    INDEX `AuditLog_electionId_createdAt_idx`(`electionId`, `createdAt`),
    INDEX `AuditLog_action_idx`(`action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ElectionMember` ADD CONSTRAINT `ElectionMember_electionId_fkey` FOREIGN KEY (`electionId`) REFERENCES `Election`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ElectionMember` ADD CONSTRAINT `ElectionMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuthSession` ADD CONSTRAINT `AuthSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Candidate` ADD CONSTRAINT `Candidate_electionId_fkey` FOREIGN KEY (`electionId`) REFERENCES `Election`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Voter` ADD CONSTRAINT `Voter_electionId_fkey` FOREIGN KEY (`electionId`) REFERENCES `Election`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VotingSession` ADD CONSTRAINT `VotingSession_electionId_fkey` FOREIGN KEY (`electionId`) REFERENCES `Election`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VotingSession` ADD CONSTRAINT `VotingSession_voterId_fkey` FOREIGN KEY (`voterId`) REFERENCES `Voter`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VotingSession` ADD CONSTRAINT `VotingSession_boothId_fkey` FOREIGN KEY (`boothId`) REFERENCES `Booth`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booth` ADD CONSTRAINT `Booth_electionId_fkey` FOREIGN KEY (`electionId`) REFERENCES `Election`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booth` ADD CONSTRAINT `Booth_currentSessionId_fkey` FOREIGN KEY (`currentSessionId`) REFERENCES `VotingSession`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ballot` ADD CONSTRAINT `Ballot_electionId_fkey` FOREIGN KEY (`electionId`) REFERENCES `Election`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ballot` ADD CONSTRAINT `Ballot_candidateId_fkey` FOREIGN KEY (`candidateId`) REFERENCES `Candidate`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_electionId_fkey` FOREIGN KEY (`electionId`) REFERENCES `Election`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
