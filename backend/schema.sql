-- ============================================================
--  Teen Patti – Virtual Ledger App
--  MySQL Database Schema
--  Run this file once to bootstrap the database:
--    mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS teen_patti
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE teen_patti;

-- -------------------------------------------------------
-- 1. Users
-- -------------------------------------------------------
-- No authentication: users are identified by username only.
-- Auto-created on first request via identifyUser middleware.
CREATE TABLE IF NOT EXISTS Users (
  id          INT          NOT NULL AUTO_INCREMENT,
  username    VARCHAR(255) NOT NULL UNIQUE,
  balance     INT          NOT NULL DEFAULT 100000,
  createdAt   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
-- 2. Rooms
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS Rooms (
  id                   VARCHAR(10)                          NOT NULL,
  status               ENUM('waiting','playing','finished') NOT NULL DEFAULT 'waiting',
  entry_amount         INT                                  NOT NULL DEFAULT 100,
  host_id              INT                                  NOT NULL,
  current_turn_index   INT                                  NOT NULL DEFAULT 0,
  current_highest_bet  INT                                  NOT NULL DEFAULT 0,
  pot_amount           INT                                  NOT NULL DEFAULT 0,
  createdAt            DATETIME                             NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt            DATETIME                             NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_room_host FOREIGN KEY (host_id) REFERENCES Users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
-- 3. Players
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS Players (
  id           INT          NOT NULL AUTO_INCREMENT,
  user_id      INT              NULL,          -- NULL for offline / guest players
  guest_name   VARCHAR(255)     NULL,
  room_id      VARCHAR(10)  NOT NULL,
  current_bet  INT          NOT NULL DEFAULT 0,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,  -- 0 = folded
  has_passed   TINYINT(1)   NOT NULL DEFAULT 0,
  turn_order   INT          NOT NULL DEFAULT 0,
  createdAt    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_player_user FOREIGN KEY (user_id) REFERENCES Users (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_player_room FOREIGN KEY (room_id) REFERENCES Rooms (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
-- 4. Transactions
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS Transactions (
  id          INT          NOT NULL AUTO_INCREMENT,
  user_id     INT              NULL,          -- NULL for guests
  guest_name  VARCHAR(255)     NULL,
  room_id     VARCHAR(10)  NOT NULL,
  amount      INT          NOT NULL,
  type        ENUM('entry','bet','win','loss','pass','fold','show') NOT NULL,
  timestamp   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  createdAt   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_tx_user FOREIGN KEY (user_id) REFERENCES Users (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_tx_room FOREIGN KEY (room_id) REFERENCES Rooms (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  Useful indexes for query performance
-- ============================================================
CREATE INDEX idx_players_room    ON Players     (room_id);
CREATE INDEX idx_players_user    ON Players     (user_id);
CREATE INDEX idx_tx_room         ON Transactions (room_id);
CREATE INDEX idx_tx_user         ON Transactions (user_id);
CREATE INDEX idx_tx_type         ON Transactions (type);
