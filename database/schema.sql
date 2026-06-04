CREATE DATABASE IF NOT EXISTS slife_gateway;
USE slife_gateway;

CREATE TABLE passerelles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  operator ENUM('mvola','orange','airtel') NOT NULL,
  numero VARCHAR(20) NOT NULL,
  imei VARCHAR(50),
  solde DECIMAL(15,2) DEFAULT 0,
  statut ENUM('connecte','deconnecte') DEFAULT 'deconnecte',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(50) UNIQUE NOT NULL,
  type ENUM('depot','retrait') NOT NULL,
  montant DECIMAL(15,2) NOT NULL,
  numero_client VARCHAR(20) NOT NULL,
  operator ENUM('mvola','orange','airtel') NOT NULL,
  passerelle_id INT,
  statut ENUM('en_attente','complete','echoue') DEFAULT 'en_attente',
  ussd_message TEXT,
  session VARCHAR(100),
  api_source VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (passerelle_id) REFERENCES passerelles(id)
);

CREATE TABLE sms_recus (
  id INT AUTO_INCREMENT PRIMARY KEY,
  operator ENUM('mvola','orange','airtel') NOT NULL,
  expediteur VARCHAR(20),
  corps TEXT NOT NULL,
  montant DECIMAL(15,2),
  numero_client VARCHAR(20),
  trans_id VARCHAR(100),
  solde_apres DECIMAL(15,2),
  frais DECIMAL(15,2) DEFAULT 0,
  type ENUM('depot','retrait','autre') DEFAULT 'autre',
  transaction_id INT,
  recu_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);

CREATE TABLE api_keys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  cle VARCHAR(255) UNIQUE NOT NULL,
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_statut ON transactions(statut);
CREATE INDEX idx_transactions_order_id ON transactions(order_id);
CREATE INDEX idx_sms_trans_id ON sms_recus(trans_id);
