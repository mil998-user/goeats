-- Bloque 6: inicio del traslado, regla de saldo e incidencias del motorizado
ALTER TABLE `Order` ADD COLUMN `pickedUpAt` DATETIME(3) NULL;

ALTER TABLE `DeliveryRate` ADD COLUMN `balanceRule` VARCHAR(20) NOT NULL DEFAULT 'PREPAID';

CREATE TABLE `DeliveryIncident` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `driverId` INTEGER NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `reason` TEXT NOT NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewedById` INTEGER NULL,
    `reviewNote` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DeliveryIncident_orderId_idx`(`orderId`),
    INDEX `DeliveryIncident_driverId_idx`(`driverId`),
    INDEX `DeliveryIncident_reviewedAt_idx`(`reviewedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `DeliveryIncident` ADD CONSTRAINT `DeliveryIncident_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `DeliveryIncident` ADD CONSTRAINT `DeliveryIncident_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Pedidos que ya estaban en camino se consideran retirados
UPDATE `Order` SET `pickedUpAt` = `updatedAt` WHERE `status` = 'DELIVERING' AND `deliveryDriverId` IS NOT NULL;
