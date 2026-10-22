CREATE DATABASE CCC_Learning_Hub;
USE CCC_Learning_Hub;

CREATE TABLE admin (
	email VARCHAR(50) PRIMARY KEY,
    password VARCHAR(20),
    firstName VARCHAR(30),
    lastName VARCHAR(30)
);

DROP TABLE admin;

INSERT INTO admin
VALUES
('lamancilla@ccc.edu.ph', 'adminlyca123', 'Lyca', 'Mancilla'),
('mlaggabao@ccc.edu.ph', 'adminleonard456', 'Mark Leonard', 'Aggabao'),
('ragarmao@ccc.edu.ph', 'adminrommel789', 'Rommel', 'Garma');
