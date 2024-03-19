## Ryujin-server

Ryujin is a web-based multiplayer game inspired by the popular board game [Onitama](https://en.wikipedia.org/wiki/Onitama). This repository holds the server-side setup needed to make Ryujin's multiplayer gameplay possible. If you're interested in exploring the frontend side of Ryujin, you can check it out at [Ryujin-web](https://github.com/itsamirrezah/ryujin-web)

## Third Party Libraries 
Below are the external dependencies integrated into this project:

* [NestJS](https://github.com/nestjs/nest) A progressive Node.js framework for building efficient, reliable, and scalable server-side applications.
* [Socket.IO](https://github.com/socketio/socket.io) A library that enables real-time, bidirectional, and event-based communication between web clients and servers.
* [ioredis](https://github.com/redis/ioredis) A robust, full-featured Redis client for Node.js that provides high performance and reliability.
* [Prisma](https://github.com/prisma/prisma) An Object-Relational Mapping (ORM) library for TypeScript and JavaScript, simplifying database interactions with powerful features for managing entities, relationships, and queries.

## Usage
* Copy the .env.template file named .env in the root directory of the project and fill in the necessary environment variables in the .env file based on your configuration requirements 
* Ensure you have Docker and Docker Compose installed on your system. open the `docker-compose.yml` and customize the configuration of the services as needed.
* Start the PostgresSQL and Redis services defined in `docker-dompose.yml` by executing the following command:
```bash
docker-compose up -d
```
* Make sure you install needed dependencies
```bash
npm install
```
* Run the following command to start the NestJS server
```bash
npm run start:dev
```
