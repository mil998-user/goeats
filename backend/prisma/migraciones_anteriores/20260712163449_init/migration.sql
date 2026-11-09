/*
  Warnings:

  - You are about to drop the column `deliveryDriver` on the `order` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cedula]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `cashregister` ADD COLUMN `assignedUserId` INTEGER NULL;

-- AlterTable
ALTER TABLE `order` DROP COLUMN `deliveryDriver`,
    ADD COLUMN `customerId` INTEGER NULL,
    ADD COLUMN `deliveryDriverId` INTEGER NULL,
    ADD COLUMN `deliveryDriverName` VARCHAR(191) NULL,
    ADD COLUMN `deliveryObservation` VARCHAR(191) NULL,
    ADD COLUMN `paymentMethodString` VARCHAR(191) NULL,
    ADD COLUMN `paymentReceipt` LONGTEXT NULL,
    ADD COLUMN `paymentStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `payphoneTransactionId` VARCHAR(191) NULL,
    ADD COLUMN `shippingCost` DOUBLE NOT NULL DEFAULT 0.0,
    MODIFY `status` ENUM('PENDING', 'PREPARING', 'READY', 'DELIVERING', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `restaurant` ADD COLUMN `bankAccountsJson` LONGTEXT NULL,
    ADD COLUMN `coverImage` LONGTEXT NULL,
    ADD COLUMN `description` LONGTEXT NULL,
    ADD COLUMN `faqsJson` LONGTEXT NULL,
    ADD COLUMN `mapIframe` LONGTEXT NULL,
    ADD COLUMN `mapLatitude` DOUBLE NULL,
    ADD COLUMN `mapLongitude` DOUBLE NULL,
    ADD COLUMN `openingHours` LONGTEXT NULL,
    ADD COLUMN `payphoneToken` LONGTEXT NULL,
    ADD COLUMN `reference` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `cedula` VARCHAR(191) NULL,
    ADD COLUMN `isPlus` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `walletBalance` DOUBLE NOT NULL DEFAULT 0.0,
    MODIFY `role` ENUM('SUPER_ADMIN', 'RESTAURANT_OWNER', 'CAJERO', 'PRODUCCION', 'MOZO', 'CUSTOMER', 'MOTORIZADO') NOT NULL DEFAULT 'MOZO';

-- CreateTable
CREATE TABLE `DeliveryRate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `basePrice` DOUBLE NOT NULL DEFAULT 1.0,
    `pricePerKm` DOUBLE NOT NULL DEFAULT 0.5,
    `costPerOrder` DOUBLE NOT NULL DEFAULT 0.5,
    `plusDriverBonus` DOUBLE NOT NULL DEFAULT 0.50,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WalletTransaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SaaSOrder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `planName` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `paymentMethod` VARCHAR(191) NOT NULL,
    `paymentReceipt` LONGTEXT NULL,
    `payphoneTransactionId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SaaSCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SaaSCategory_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SaaSSubcategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `categoryId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SaaSSubcategory_name_categoryId_key`(`name`, `categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SaaSPlan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `period` VARCHAR(191) NULL,
    `discount` VARCHAR(191) NULL,
    `description` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SaaSPlan_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_RestaurantToSaaSCategory` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_RestaurantToSaaSCategory_AB_unique`(`A`, `B`),
    INDEX `_RestaurantToSaaSCategory_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_RestaurantToSaaSSubcategory` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_RestaurantToSaaSSubcategory_AB_unique`(`A`, `B`),
    INDEX `_RestaurantToSaaSSubcategory_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `User_cedula_key` ON `User`(`cedula`);

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_deliveryDriverId_fkey` FOREIGN KEY (`deliveryDriverId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CashRegister` ADD CONSTRAINT `CashRegister_assignedUserId_fkey` FOREIGN KEY (`assignedUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WalletTransaction` ADD CONSTRAINT `WalletTransaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SaaSOrder` ADD CONSTRAINT `SaaSOrder_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SaaSSubcategory` ADD CONSTRAINT `SaaSSubcategory_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `SaaSCategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_RestaurantToSaaSCategory` ADD CONSTRAINT `_RestaurantToSaaSCategory_A_fkey` FOREIGN KEY (`A`) REFERENCES `Restaurant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_RestaurantToSaaSCategory` ADD CONSTRAINT `_RestaurantToSaaSCategory_B_fkey` FOREIGN KEY (`B`) REFERENCES `SaaSCategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_RestaurantToSaaSSubcategory` ADD CONSTRAINT `_RestaurantToSaaSSubcategory_A_fkey` FOREIGN KEY (`A`) REFERENCES `Restaurant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_RestaurantToSaaSSubcategory` ADD CONSTRAINT `_RestaurantToSaaSSubcategory_B_fkey` FOREIGN KEY (`B`) REFERENCES `SaaSSubcategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
