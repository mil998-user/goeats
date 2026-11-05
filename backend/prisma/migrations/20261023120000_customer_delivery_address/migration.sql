ALTER TABLE `User`
  ADD COLUMN `deliveryAddress` TEXT NULL,
  ADD COLUMN `deliveryLatitude` DOUBLE NULL,
  ADD COLUMN `deliveryLongitude` DOUBLE NULL,
  ADD COLUMN `deliveryFloorApartment` VARCHAR(191) NULL,
  ADD COLUMN `deliverySecondaryStreet` VARCHAR(191) NULL,
  ADD COLUMN `deliveryReferences` TEXT NULL;
