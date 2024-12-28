drop schema if exists filemanagement;
CREATE SCHEMA filemanagement;
USE filemanagement;

CREATE TABLE user (
    ID CHAR(36) PRIMARY KEY,
    username VARCHAR(255) UNIQUE,
    password VARCHAR(255)
);

CREATE TABLE metadata (
    ID CHAR(36) PRIMARY KEY,
    name VARCHAR(255),
    path VARCHAR(500),
    size INT,
    content_type VARCHAR(255),
    created_at DATE,
    owner CHAR(36),
    FOREIGN KEY (owner) REFERENCES user(ID)
);