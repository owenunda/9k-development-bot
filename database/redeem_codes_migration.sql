CREATE TABLE IF NOT EXISTS `RedeemCodes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(100) NOT NULL UNIQUE,
  `cash_value` INT NOT NULL DEFAULT 0,
  `active` TINYINT(1) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS `UsedCodes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userid` VARCHAR(50) NOT NULL,
  `code_id` INT NOT NULL,
  `used_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `user_code_unique` (`userid`, `code_id`),
  FOREIGN KEY (`code_id`) REFERENCES `RedeemCodes`(`id`) ON DELETE CASCADE
);

-- Migración de los códigos hardcodeados
INSERT IGNORE INTO `RedeemCodes` (`code`, `cash_value`) VALUES
('!9k Lazyyy', 125),
('!9k CalOFduty9000', 25),
('!9k Bunny', 50),
('!9k HootHoot', 125),
('!9k Filthy', 50),
('!9k BigGay', 75),
('!9k MrBreast', 200),
('!9k 9kStudiosReborn', 100),
('!9k iloveyou', 25),
('!9k FREE', 60),
('!9k Daddy', 25),
('!9k uwu', 25),
('!9k Weeaboo', 25),
('!9k Aids', 25),
('!9k Crippling Depression Intensifies', 1),
('!9k Harambe', 25),
('!9k 9kmc', 25),
('!9k chocolate', 50),
('!9k revive', 25),
('!9k SuperGremlin', 90);
