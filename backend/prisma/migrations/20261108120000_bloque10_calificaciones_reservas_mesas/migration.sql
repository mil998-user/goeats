-- Bloque 10: calificaciones, propina, reservas, unir mesas, historial de cocina,
-- espera del llamado al mesero, pagar antes de comer y motorizado más cercano con temporizador
-- AlterTable
ALTER TABLE `Restaurant` ADD COLUMN `payBeforeEating` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `reservationsEnabled` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `waiterCallEnabled` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `waiterCallWaitMin` INTEGER NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `lastLat` DOUBLE NULL,
    ADD COLUMN `lastLng` DOUBLE NULL,
    ADD COLUMN `lastLocationAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Table` ADD COLUMN `joinedToId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Order` ADD COLUMN `dispatchAlertAt` DATETIME(3) NULL,
    ADD COLUMN `readyAt` DATETIME(3) NULL,
    ADD COLUMN `tipAmount` DOUBLE NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `OrderItem` ADD COLUMN `readyAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `DeliveryRate` ADD COLUMN `dispatchRadiusKm` DOUBLE NOT NULL DEFAULT 5.0,
    ADD COLUMN `dispatchWaitMin` INTEGER NOT NULL DEFAULT 3;

-- CreateTable
CREATE TABLE `OrderRating` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `restaurantId` INTEGER NOT NULL,
    `customerId` INTEGER NULL,
    `driverId` INTEGER NULL,
    `restaurantStars` INTEGER NULL,
    `driverStars` INTEGER NULL,
    `comment` VARCHAR(500) NULL,
    `customerStars` INTEGER NULL,
    `customerRatedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `OrderRating_orderId_key`(`orderId`),
    INDEX `OrderRating_restaurantId_idx`(`restaurantId`),
    INDEX `OrderRating_driverId_idx`(`driverId`),
    INDEX `OrderRating_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reservation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `restaurantId` INTEGER NOT NULL,
    `customerId` INTEGER NULL,
    `tableId` INTEGER NULL,
    `name` VARCHAR(120) NOT NULL,
    `phone` TEXT NOT NULL,
    `people` INTEGER NOT NULL,
    `reservedAt` DATETIME(3) NOT NULL,
    `notes` VARCHAR(300) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Reservation_restaurantId_reservedAt_idx`(`restaurantId`, `reservedAt`),
    INDEX `Reservation_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Table` ADD CONSTRAINT `Table_joinedToId_fkey` FOREIGN KEY (`joinedToId`) REFERENCES `Table`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderRating` ADD CONSTRAINT `OrderRating_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderRating` ADD CONSTRAINT `OrderRating_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `Restaurant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderRating` ADD CONSTRAINT `OrderRating_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderRating` ADD CONSTRAINT `OrderRating_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `Restaurant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_tableId_fkey` FOREIGN KEY (`tableId`) REFERENCES `Table`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
