import dotenv from 'dotenv';
import Server from './src/server.mjs';

dotenv.config();

const server = new Server();

server.run();
