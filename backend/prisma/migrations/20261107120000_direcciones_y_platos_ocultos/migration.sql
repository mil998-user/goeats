-- Bloque 5: varias direcciones por cliente y platos ocultos sin perder el historial de pedidos
-- DropForeignKey
ALTER TABLE `OrderItem` DROP FOREIGN KEY `OrderItem_variantId_fkey`;

-- AlterTable
ALTER TABLE `MenuItem` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `CustomerAddress` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `label` VARCHAR(40) NOT NULL,
    `address` TEXT NOT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `floorApartment` VARCHAR(120) NULL,
    `secondaryStreet` VARCHAR(160) NULL,
    `references` TEXT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CustomerAddress_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `MenuItemVariant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustomerAddress` ADD CONSTRAINT `CustomerAddress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Each customer's current address becomes their first saved address
INSERT INTO `CustomerAddress` (`userId`, `label`, `address`, `latitude`, `longitude`, `floorApartment`, `secondaryStreet`, `references`, `isDefault`, `updatedAt`)
SELECT `id`, 'Casa', `deliveryAddress`, `deliveryLatitude`, `deliveryLongitude`, LEFT(`deliveryFloorApartment`, 120), LEFT(`deliverySecondaryStreet`, 160), `deliveryReferences`, true, CURRENT_TIMESTAMP(3)
FROM `User`
WHERE `role` = 'CUSTOMER' AND `deliveryAddress` IS NOT NULL AND TRIM(`deliveryAddress`) <> '';
