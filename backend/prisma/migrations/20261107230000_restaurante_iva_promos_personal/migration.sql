-- Bloque 7: IVA por local, promociones por plato y quién preparó cada plato
-- Los locales existentes quedan con 15 %, la tasa general vigente en Ecuador. Confirmar con los jefes.
ALTER TABLE `Restaurant` ADD COLUMN `taxRate` DOUBLE NOT NULL DEFAULT 15.0;

ALTER TABLE `MenuItemVariant` ADD COLUMN `promoEndsAt` DATETIME(3) NULL,
    ADD COLUMN `promoPrice` DOUBLE NULL;

ALTER TABLE `OrderItem` ADD COLUMN `preparedById` INTEGER NULL;

-- Las ventas ya hechas conservan la tasa con la que se cobraron
ALTER TABLE `Sale` MODIFY `taxRate` DOUBLE NOT NULL DEFAULT 15.0;

ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_preparedById_fkey` FOREIGN KEY (`preparedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
