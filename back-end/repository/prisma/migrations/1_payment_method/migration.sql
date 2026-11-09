-- Payment method per sale: cash, (bank) card, or the club's prepaid drinking card.
-- Additive on purpose: payedCash stays, so a backend that predates this column keeps working.

-- AlterTable
ALTER TABLE `sold_items` ADD COLUMN `paymentMethod` ENUM('CASH', 'CARD', 'DRINK_CARD') NOT NULL DEFAULT 'CARD';

-- Existing sales only knew cash or not-cash
UPDATE `sold_items` SET `paymentMethod` = 'CASH' WHERE `payedCash` = true;
