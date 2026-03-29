CREATE TABLE `BotDailyTiers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `required_days` int NOT NULL DEFAULT 0,
  `points` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `BotDailyTiers` (`name`, `required_days`, `points`) VALUES
('Beginner', 0, 10),
('Dedicated', 31, 30),
('Super Active', 50, 40),
('God Tier', 100, 50);
