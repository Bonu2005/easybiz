const express = require("express");
const { Users, Roles } = require("../composables/imports");
const middleWare = require("../middlewares/token.middleware");
const passedRole = require("../middlewares/role.police");
const selfPolice = require("../middlewares/self.police");
const upload = require("../config/multer/multer");
const refreshTokenMiddleware = require("../middlewares/refresh_token.middleware");
const Router = express.Router();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Получить список пользователей
 *     description: Возвращает всех пользователей с их ролями, общее количество и количество страниц.
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: Успешный ответ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: Ivan
 *                       email:
 *                         type: string
 *                         example: ivan@example.com
 *                       role:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           name:
 *                             type: string
 *                             example: Admin
 *                 total_count:
 *                   type: integer
 *                   example: 100
 *                 total_page:
 *                   type: integer
 *                   example: 5
 *       400:
 *         description: Ошибка при получении пользователей
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unexpected error!
 *                 error:
 *                   type: string
 *                   example: Cannot read properties of undefined
 */
Router.get("/", (req, res) => {
    Users.get_users(req, res)
})

/**
 * @swagger
 * /users/sign-up:
 *   post:
 *     summary: Регистрация нового пользователя
 *     description: Создаёт нового пользователя после валидации данных и проверки уникальности email, username и социальных сетей.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - roleId
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 example: johndoe@.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 10
 *                 example: MyPass1
 *               roleId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               telegram:
 *                 type: string
 *                 example: ohndoe
 *               facebook:
 *                 type: string
 *                 example: johndoe.fb
 *               instagram:
 *                 type: string
 *                 example: johndoe.ig
 *               image:
 *                 type: string
 *                 example: https://example.com/profile.jpg
 *     responses:
 *       200:
 *         description: Пользователь успешно зарегистрирован, требуется подтверждение аккаунта
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Verify your account
 *                 data:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                       example: johndoe
 *                     email:
 *                       type: string
 *                       example: johndoeexample.com
 *       400:
 *         description: Ошибка валидации или пользователь уже существует
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User with this email or username already exists.
 *                 error:
 *                   type: string
 *                   example: Unexpected error!
 *       404:
 *         description: Указанная роль не найдена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Role with this id not found.
 */

Router.post("/sign-up", (req, res) => {
    Users.signup(req, res);
})

/**
 * @swagger
 * /users/send-otp:
 *   post:
 *     summary: Отправка OTP-кода на почту пользователя
 *     description: Генерирует одноразовый код и отправляет его на указанную почту, если пользователь существует.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - subject
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *                 example: user.com
 *               subject:
 *                 type: string
 *                 example: OTP Verification
 *     responses:
 *       200:
 *         description: OTP успешно отправлен на указанную почту
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OTP sent successfully
 *       403:
 *         description: Отсутствует одно из обязательных полей (to или subject)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: to is required!
 *       404:
 *         description: Пользователь с указанной почтой не найден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User with this email not found
 *       400:
 *         description: Неожиданная ошибка
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unexpected error
 *                 error:
 *                   type: string
 *                   example: Detailed error message
 */

Router.post("/send-otp", (req, res) => {
    Users.send_otp(req, res)
})

/**
 * @swagger
 * /users/verify-otp:
 *   post:
 *     summary: Верификация OTP-кода
 *     description: Проверяет правильность введённого OTP-кода и активирует учётную запись пользователя при успешной верификации.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp_code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@exa.com
 *               otp_code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Успешная активация аккаунта
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Account successfully activated
 *       400:
 *         description: Неверный код или ошибка верификации
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Wrong OTP code
 *       404:
 *         description: Пользователь с такой почтой не найден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User with this email not found
 */

Router.post("/verify-otp", (req, res) => {
    Users.verify_otp(req, res)
})

/**
 * @swagger
 * /users/sign-in:
 *   post:
 *     summary: Авторизация пользователя
 *     description: Авторизует пользователя по email и паролю, устанавливает refresh токен в cookie и возвращает access токен.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@exampl.com
 *               password:
 *                 type: string
 *                 example: "Password123"
 *               location:
 *                 type: string
 *                 example: "Tashkent, Uzbekistan"
 *     responses:
 *       200:
 *         description: Успешная авторизация
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Successfully login!
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       403:
 *         description: Неверные учетные данные
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid credentials
 *       404:
 *         description: Пользователь или роль не найдены
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User with this email not found
 *       400:
 *         description: Неожиданная ошибка
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unexpected error
 *                 error:
 *                   type: string
 *                   example: Подробности ошибки
 */
Router.post("/sign-in", (req, res) => {
    Users.signin(req, res);
})

/**
 * @swagger
 * /users/ban-user:
 *   post:
 *     summary: Заблокировать пользователя
 *     description: Блокирует пользователя, добавляя его в таблицу `ban` и меняя статус на `BANNED`. Доступно только для ADMIN и SUPER ADMIN.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - ban_reason
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *               ban_reason:
 *                 type: string
 *                 example: "Violation of terms of service"
 *     responses:
 *       200:
 *         description: Пользователь успешно заблокирован
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User successfully banned
 *       400:
 *         description: Ошибка валидации или неожиданный сбой
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unexpected error"
 *                 error:
 *                   type: string
 *                   example: "userId is required"
 *       403:
 *         description: Пользователь уже заблокирован
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User already banned
 *       404:
 *         description: Пользователь не найден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 */

Router.post("/ban-user", middleWare, passedRole(["ADMIN", "SUPER ADMIN"]), (req, res) => {
    Users.ban_user(req, res)
})

/**
 * @swagger
 * /users/activate-user:
 *   post:
 *     summary: Активировать пользователя
 *     description: Активирует пользователя, меняя его статус на `ACTIVE` и добавляя запись в таблицу `activation`. Доступ разрешён только для ролей ADMIN и SUPER ADMIN.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *     responses:
 *       200:
 *         description: Пользователь успешно активирован
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User successfully activated
 *       400:
 *         description: Ошибка валидации или внутренняя ошибка
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unexpected error
 *                 error:
 *                   type: string
 *                   example: userId is required
 *       403:
 *         description: Пользователь уже активирован
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User already activated
 *       404:
 *         description: Пользователь не найден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 */
Router.post("/activate-user", middleWare, passedRole(["ADMIN", "SUPER ADMIN"]), (req, res) => {
    Users.activate_user(req, res)
})

/**
 * @swagger
 * /users/send-otp-reset:
 *   post:
 *     summary: Отправка OTP для сброса пароля
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - subject
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *                 description: Email пользователя, которому отправляется OTP
 *                 example: user@example.com
 *               subject:
 *                 type: string
 *                 description: Тема письма с OTP
 *                 example: "Password Reset OTP"
 *     responses:
 *       200:
 *         description: OTP успешно отправлен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "OTP sent successfully"
 *       403:
 *         description: Ошибка валидации (например, отсутствует поле)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "to is required!"
 *       404:
 *         description: Пользователь с указанным email не найден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *       400:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unexpected error"
 *                 error:
 *                   type: string
 *                   example: "Some error message"
 */

Router.post("/send-otp-reset", (req, res) => {
    Users.send_otp_reset(req, res)
})

/**
 * @swagger
 * /users/verify-otp-reset:
 *   post:
 *     summary: Проверка OTP-кода для сброса пароля
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp_code
 *               - email
 *             properties:
 *               otp_code:
 *                 type: string
 *                 description: OTP код, полученный на email
 *                 example: "123456"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email пользователя
 *                 example: "user@exampl.com"
 *     responses:
 *       200:
 *         description: OTP успешно подтвержден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "OTP verified. You can now reset your password."
 *       400:
 *         description: Неправильный OTP код или истекший запрос
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Wrong OTP code"
 *       404:
 *         description: Пользователь с данным email не найден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *       403:
 *         description: OTP запрос истек
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "OTP request expired. Please request again."
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unexpected error"
 *                 error:
 *                   type: string
 *                   example: "Some error message"
 */
Router.post("/verify-otp-reset", (req, res) => {
    Users.verify_otp_reset(req, res)
})

/**
 * @swagger
 * /users/reset-password:
 *   post:
 *     summary: Сброс пароля пользователя после верификации OTP
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email пользователя
 *                 example: "user@exampl.com"
 *               newPassword:
 *                 type: string
 *                 description: Новый пароль (минимум 6, максимум 10 символов, с заглавной буквой, строчной и цифрой)
 *                 example: "NewPass1"
 *     responses:
 *       200:
 *         description: Пароль успешно сброшен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password successfully reset"
 *       400:
 *         description: Ошибка валидации или неожиданный сбой
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password should have min one UpperCase ,one LowerCase and Number"
 *       403:
 *         description: OTP не подтвержден или истек срок действия
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "OTP not verified or expired"
 *       404:
 *         description: Пользователь с указанным email не найден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not found"
 */
Router.post("/reset-password", (req, res) => {
    Users.reset_password(req, res)
})

/**
 * @swagger
 * /users/refresh-token:
 *   post:
 *     summary: Обновление access токена с помощью refresh токена
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Новый access токен успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                   description: Новый access токен JWT
 *                 updateUser:
 *                   type: object
 *                   description: Обновленные данные пользователя
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "123"
 *                     was_online:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-06-09T12:34:56.789Z"
 *                     status:
 *                       type: string
 *                       example: "ACTIVE"
 *                     role:
 *                       type: string
 *                       example: "USER"
 *       400:
 *         description: Ошибка сервера или непредвиденная ошибка
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unexpected error"
 *                 error:
 *                   type: string
 *                   example: "Some error message"
 *       401:
 *         description: Неавторизованный доступ (например, refresh token неверный или пользователь не найден)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 */
Router.post("/refresh-token", refreshTokenMiddleware, (req, res) => {
    Users.refresh_token(req, res)
})

/**
 * @swagger
 * /users/get-my-data:
 *   get:
 *     summary: Получение данных текущего пользователя
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные пользователя успешно получены
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "123"
 *                 email:
 *                   type: string
 *                   example: "user@example.com"
 *                 status:
 *                   type: string
 *                   example: "ACTIVE"
 *                 role:
 *                   type: string
 *                   example: "USER"
 *                 Sessions:
 *                   type: array
 *                   description: Сессии пользователя
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       ip:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 Ban:
 *                   type: object
 *                   nullable: true
 *                   description: Информация о блокировке пользователя (если есть)
 *                   properties:
 *                     id:
 *                       type: string
 *                     ban_reason:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                 Activation:
 *                   type: object
 *                   nullable: true
 *                   description: Информация об активации пользователя
 *                   properties:
 *                     id:
 *                       type: string
 *                     activation_status:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Неавторизован или сессия не найдена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "not authorized"
 *       400:
 *         description: Ошибка сервера или неожиданная ошибка
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unexpected error"
 *                 error:
 *                   type: string
 *                   example: "Error message here"
 */
Router.get("/get-my-data", middleWare, (req, res) => {
    Users.get_my_data(req, res)
})

/**
 * @swagger
 * /users/update-self/{id}:
 *   patch:
 *     summary: Обновление собственного профиля пользователя (username, telegram, facebook, instagram)
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID пользователя, который обновляется (должен совпадать с текущим пользователем)
 *         schema:
 *           type: string
 *           example: "123"
 *     requestBody:
 *       description: Обновляемые данные пользователя
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "new_username"
 *               telegram:
 *                 type: string
 *                 example: "@new_telegram"
 *               facebook:
 *                 type: string
 *                 example: "https://facebook.com/new.profile"
 *               instagram:
 *                 type: string
 *                 example: "https://instagram.com/new.profile"
 *     responses:
 *       200:
 *         description: Профиль успешно обновлён
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User profile updated successfully"
 *                 updated_user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "123"
 *                     username:
 *                       type: string
 *                       example: "new_username"
 *                     telegram:
 *                       type: string
 *                       example: "@new_telegram"
 *                     facebook:
 *                       type: string
 *                       example: "https://facebook.com/new.profile"
 *                     instagram:
 *                       type: string
 *                       example: "https://instagram.com/new.profile"
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     status:
 *                       type: string
 *                       example: "ACTIVE"
 *                     role:
 *                       type: string
 *                       example: "USER"
 *       400:
 *         description: Ошибка валидации или неожиданная ошибка
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Validation error"
 *                 error:
 *                   type: string
 *                   example: "telegram must be a string"
 *       401:
 *         description: Неавторизован или нет доступа
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 */

Router.patch("/update-self/:id", middleWare, selfPolice(["USER", "ADMIN","SUPER ADMIN"]), (req, res) => {
    Users.update_user(req, res)
})

/**
 * @swagger
 * /users/get-my-sessions:
 *   get:
 *     summary: Получить список сессий текущего пользователя
 *     tags:
 *       - Sessions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Успешный ответ со списком сессий пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "session-id-123"
 *                       userId:
 *                         type: string
 *                         example: "user-id-456"
 *                       ip:
 *                         type: string
 *                         example: "192.168.1.1"
 *                       userAgent:
 *                         type: string
 *                         example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-06-09T12:34:56Z"
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "user-id-456"
 *                           username:
 *                             type: string
 *                             example: "john_doe"
 *                           email:
 *                             type: string
 *                             example: "john@example.com"
 *       400:
 *         description: Ошибка выполнения запроса
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unexpected error"
 *                 error:
 *                   type: string
 *                   example: "Error message here"
 *       401:
 *         description: Неавторизован или сессия не найдена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 */
Router.get("/get-my-sessions", middleWare, (req, res) => {
    Users.get_my_session(req, res)
})

/**
 * @swagger
 * /users/del-my-sessions/{id}:
 *   delete:
 *     summary: Удалить сессию текущего пользователя по ID
 *     tags:
 *       - Sessions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID сессии, которую нужно удалить
 *         required: true
 *         schema:
 *           type: string
 *           example: "session-id-123"
 *     responses:
 *       200:
 *         description: Сессия успешно удалена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Session deleted"
 *       403:
 *         description: Пользователь не авторизован удалять эту сессию
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Not authorized to delete this session"
 *       404:
 *         description: Сессия не найдена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Session not found"
 *       400:
 *         description: Ошибка выполнения запроса
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unexpected error"
 *                 error:
 *                   type: string
 *                   example: "Error message here"
 */
Router.delete("/del-my-sessions/:id", middleWare, (req, res) => {
    Users.del_my_session(req, res)
})

/**
 * @swagger
 * /users/session-end:
 *   patch:
 *     summary: Обновить время окончания сессии (только ADMIN и SUPER ADMIN)
 *     tags:
 *       - Sessions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Данные для обновления времени окончания сессии
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - endDate
 *             properties:
 *               sessionId:
 *                 type: string
 *                 example: "session-id-123"
 *                 description: ID сессии для обновления
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-06-10T18:30:00Z"
 *                 description: Время окончания сессии в формате ISO 8601
 *     responses:
 *       200:
 *         description: Время окончания сессии успешно обновлено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Session end time updated"
 *                 updatedSession:
 *                   type: object
 *                   description: Обновленные данные сессии
 *       400:
 *         description: Ошибка валидации или неожиданный сбой
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unexpected error"
 *                 error:
 *                   type: string
 *                   example: "Error message here"
 *       404:
 *         description: Сессия с указанным ID не найдена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "SessionId not found"
 *       401:
 *         description: Пользователь не авторизован или не имеет права доступа
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 */
Router.patch("/session-end", middleWare,passedRole("ADMIN","SUPER ADMIN"), (req, res) => {
    Users.end_time_session(req, res)
})

//-----------------------------------------------------------------------------------------statistics


/**
 * @swagger
 * /users/average-time-statistics:
 *   get:
 *     summary: Получить среднее время завершённых сессий
 *     tags:
 *       - Statistics
 *     responses:
 *       200:
 *         description: Среднее время сессий успешно получено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 averageSiteTime:
 *                   type: string
 *                   example: "1h 35m"
 *                   description: Среднее время сессии в формате "Xh Ym"
 *       404:
 *         description: Не найдено завершённых сессий
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No completed sessions found"
 *       500:
 *         description: Ошибка при вычислении среднего времени
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error calculating average session time"
 *                 error:
 *                   type: string
 *                   example: "Error message here"
 */
Router.get("/average-time-statistics",  (req, res) => {
    Users.average_session_time(req, res)
}
)

/**
 * @swagger
 * /users/browser-statistics:
 *   get:
 *     summary: Получить статистику браузеров пользователей
 *     tags:
 *       - Statistics
 *     responses:
 *       200:
 *         description: Статистика браузеров успешно получена
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   browser:
 *                     type: string
 *                     example: "Chrome"
 *                     description: Название браузера
 *                   count:
 *                     type: integer
 *                     example: 150
 *                     description: Количество сессий в данном браузере
 *                   percentage:
 *                     type: string
 *                     example: "37%"
 *                     description: Процент сессий этого браузера от общего числа
 *       400:
 *         description: Ошибка при обработке запроса
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unexpected error!"
 *                 error:
 *                   type: string
 *                   example: "Error message here"
 */

Router.get("/browser-statistics",(req,res)=>{
    Users.browsers_statistics(req,res)
})

/**
 * @swagger
 * /users/devices-statistics:
 *   get:
 *     summary: Получить статистику типов устройств пользователей
 *     tags:
 *       - Statistics
 *     responses:
 *       200:
 *         description: Статистика устройств успешно получена
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   deviceType:
 *                     type: string
 *                     example: "Mobile"
 *                     description: Тип устройства (например, Mobile, Desktop, Tablet)
 *                   count:
 *                     type: integer
 *                     example: 200
 *                     description: Количество сессий с данного типа устройства
 *                   percentage:
 *                     type: string
 *                     example: "45%"
 *                     description: Процент сессий данного типа устройства от общего числа
 *       400:
 *         description: Ошибка при обработке запроса
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unexpected error!"
 *                 error:
 *                   type: string
 *                   example: "Error message here"
 */
Router.get("/devices-statistics",(req,res)=>{
    Users.devices_statistics(req,res)
})

/**
 * @swagger
 * /users/user-statistics:
 *   get:
 *     summary: Получить статистику пользователей
 *     description: Возвращает общее количество активных пользователей и общее количество страниц (по 20 пользователей на страницу).
 *     tags:
 *       - Statistics
 *     responses:
 *       200:
 *         description: Успешный ответ со статистикой пользователей
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_count:
 *                       type: integer
 *                       example: 150
 *                       description: Общее количество активных пользователей
 *                     total_page:
 *                       type: integer
 *                       example: 8
 *                       description: Общее количество страниц с пользователями (по 20 на страницу)
 *       400:
 *         description: Ошибка обработки запроса
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unexpected error!"
 *                 error:
 *                   type: string
 *                   example: "Error message here"
 */
Router.get("/user-statistics",(req,res)=>{
    Users.user_statistics(req,res)
})

//-----------------------------------------------------------------------------------------role

/**
 * @swagger
 * /users/roles:
 *   get:
 *     summary: Получить список всех ролей
 *     description: Возвращает массив всех ролей из базы данных.
 *     tags:
 *       - Roles
 *     responses:
 *       200:
 *         description: Успешный ответ со списком ролей
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "ADMIN"
 *                       description:
 *                         type: string
 *                         example: "Administrator role with full permissions"
 *       500:
 *         description: Ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unexpected error!"
 */
Router.get("/roles", (req, res) => {    
    Roles.getRole(req, res)
})

/**
 * @swagger
 * /users/roles/{id}:
 *   get:
 *     summary: Получить роль по ID
 *     description: Возвращает одну роль по заданному идентификатору.
 *     tags:
 *       - Roles
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Уникальный идентификатор роли
 *     responses:
 *       200:
 *         description: Успешный ответ с информацией о роли
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "clv1kj13h0000s1xyz1abcd12"
 *                     name:
 *                       type: string
 *                       example: "USER"
 *                     description:
 *                       type: string
 *                       example: "Basic user role with limited permissions"
 *       404:
 *         description: Роль не найдена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Role with this id not found"
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unexpected error!"
 */
Router.get("/roles/:id", (req, res) => {
    Roles.getOneRole(req, res)
})

/**
 * @swagger
 * /users/roles:
 *   post:
 *     summary: Создать новую роль
 *     description: Добавляет новую роль в систему. Название роли будет автоматически приведено к верхнему регистру.
 *     tags:
 *       - Roles
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: admin
 *     responses:
 *       200:
 *         description: Роль успешно создана
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: clv1kj13h0000s1xyz1abcd12
 *                     name:
 *                       type: string
 *                       example: ADMIN
 *       403:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "\"name\" is required"
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unexpected error!
 *                 message:
 *                   type: string
 *                   example: "Prisma error or other internal exception message"
 */
Router.post("/roles", (req, res) => {
    Roles.createRole(req, res)
})

/**
 * @swagger
 * /users/roles/{id}:
 *   patch:
 *     summary: Обновить существующую роль
 *     description: Обновляет имя роли по её идентификатору. Доступно только для пользователей с ролью ADMIN.
 *     tags:
 *       - Roles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Уникальный идентификатор роли
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: moderator
 *     responses:
 *       200:
 *         description: Роль успешно обновлена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Role updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: clv1kj13h0000s1xyz1abcd12
 *                     name:
 *                       type: string
 *                       example: MODERATOR
 *       403:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "\"name\" is required"
 *       404:
 *         description: Роль с указанным ID не найдена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Role with this id not found
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unexpected error!
 */
Router.patch("/roles/:id", middleWare, passedRole(["ADMIN"]), (req, res) => {
    Roles.updateRole(req, res)
})

/**
 * @swagger
 * /users/roles/{id}:
 *   delete:
 *     summary: Удалить роль
 *     description: Удаляет существующую роль по ID. Доступно только для пользователей с ролью ADMIN.
 *     tags:
 *       - Roles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Уникальный идентификатор роли
 *     responses:
 *       200:
 *         description: Роль успешно удалена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Role deleted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: clv1kj13h0000s1xyz1abcd12
 *                     name:
 *                       type: string
 *                       example: MODERATOR
 *       404:
 *         description: Роль с указанным ID не найдена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Role with this id not found
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unexpected error!
 */
Router.delete("/roles/:id", middleWare, passedRole(["ADMIN"]), (req, res) => {
    Roles.deleteRole(req, res)
})

//-----------------------------------------------------------------------------------------uploads


/**
 * @swagger
 * /users/upload:
 *   post:
 *     summary: Загрузка изображения
 *     description: Загружает файл изображения (формат multipart/form-data).
 *     tags:
 *       - Uploads
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *             required:
 *               - image
 *     responses:
 *       200:
 *         description: Файл успешно загружен
 *       400:
 *         description: Неверный запрос
 *       401:
 *         description: Неавторизован
 *       500:
 *         description: Внутренняя ошибка сервера
 */
Router.use("/upload", upload.single("image"), middleWare, (req, res) => {
    Users.upload_file(req, res)
});


/**
 * @swagger
 * /users/image/{filename}:
 *   get:
 *     summary: Получить изображение
 *     description: Возвращает изображение по имени файла из папки `uploads`.
 *     tags:
 *       - Files
 *     parameters:
 *       - in: path
 *         name: filename
 *         schema:
 *           type: string
 *         required: true
 *         description: Имя файла изображения
 *     responses:
 *       200:
 *         description: Успешно получен файл
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Файл не найден
 */
Router.use("/image", express.static("uploads"));

module.exports = Router;