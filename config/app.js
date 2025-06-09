const express = require("express");
const app = express();
const dotenv = require("dotenv");
const Users = require("../routes/users.routes");
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const cors = require("cors")
app.use(cors({
  origin: "*", // or '*' in dev if needed
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true // if you're using cookies or auth headers
}));
app.use(express.json({ limit: 1024 * 1024 * 10 }));
app.use(express.urlencoded({ limit: 1024 * 1024 * 10, extended: true }));
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Express API with Swagger',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT', // можно опустить, но полезно для UI
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js'], // путь к вашим js-файлам с JSDoc-комментариями
};


const swaggerSpec = swaggerJsdoc(options);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Router
app.use("/users", Users);


// Dotenv
dotenv.config();

module.exports = app;