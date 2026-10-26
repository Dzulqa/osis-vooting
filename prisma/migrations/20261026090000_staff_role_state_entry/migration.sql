-- DropForeignKey
ALTER TABLE `Voter` DROP FOREIGN KEY `Voter_electionId_fkey`;

-- DropIndex
DROP INDEX `Voter_electionId_className_name_idx` ON `Voter`;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `staffRole` ENUM('SUPERADMIN', 'KETUA', 'REGISTRATOR', 'CALLER', 'SAKSI') NULL;

-- AlterTable: Voter.className is replaced by Voter.classroom (same type). Copy the values
-- across before the old column is dropped so no class names are lost.
-- allow-destructive: Voter.className is dropped only after its values are copied into Voter.classroom
ALTER TABLE `Voter` ADD COLUMN `classroom` VARCHAR(80) NULL;
UPDATE `Voter` SET `classroom` = `className` WHERE `classroom` IS NULL;

ALTER TABLE `Voter` DROP COLUMN `className`,
    ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `classroomId` INTEGER NULL,
    ADD COLUMN `code` VARCHAR(50) NULL,
    ADD COLUMN `competencyId` INTEGER NULL,
    ADD COLUMN `competencyName` VARCHAR(150) NULL,
    ADD COLUMN `graduated` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isPondok` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `lastStudy` VARCHAR(100) NULL,
    ADD COLUMN `phone` VARCHAR(40) NULL,
    ADD COLUMN `raw` JSON NULL,
    ADD COLUMN `year` VARCHAR(20) NULL,
    ADD COLUMN `yearId` INTEGER NULL,
    MODIFY `nis` VARCHAR(50) NULL;

-- CreateTable
CREATE TABLE `Classroom` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `electionId` INTEGER NOT NULL,
    `sourceId` INTEGER NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `level` INTEGER NULL,
    `yearId` INTEGER NULL,
    `yearName` VARCHAR(20) NULL,
    `studyLevel` VARCHAR(20) NULL,
    `studyMajor` VARCHAR(150) NULL,
    `competency` VARCHAR(150) NULL,
    `homeroomTeacher` VARCHAR(150) NULL,
    `homeroomTeacherEmail` VARCHAR(150) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `studentCount` INTEGER NULL,
    `syncedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Classroom_electionId_name_idx`(`electionId`, `name`),
    UNIQUE INDEX `Classroom_electionId_sourceId_key`(`electionId`, `sourceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StateEntry` (
    `key` VARCHAR(191) NOT NULL,
    `value` LONGTEXT NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedById` INTEGER NULL,

    INDEX `StateEntry_updatedAt_idx`(`updatedAt`),
    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Voter_electionId_classroomId_name_idx` ON `Voter`(`electionId`, `classroomId`, `name`);

-- AddForeignKey
ALTER TABLE `Classroom` ADD CONSTRAINT `Classroom_electionId_fkey` FOREIGN KEY (`electionId`) REFERENCES `Election`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (dropped at the top so the old index could go; restore it)
ALTER TABLE `Voter` ADD CONSTRAINT `Voter_electionId_fkey` FOREIGN KEY (`electionId`) REFERENCES `Election`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;



-- Backfill: accounts created before staffRole existed keep the role they had in an election
UPDATE `User` u JOIN `ElectionMember` m ON m.userId = u.id SET u.staffRole = m.role WHERE u.isSuperadmin = 0;
