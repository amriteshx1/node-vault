// app.js
require('dotenv').config();
const express = require("express");
const path = require("path");
const usersRouter = require("./routes/usersRouter");
const session = require("express-session");
const passport = require("passport");
const initializePassport = require("./config/passportConfig");
const PrismaStore = require('@quixo3/prisma-session-store').PrismaSessionStore;
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

initializePassport(passport);

app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: new PrismaStore(
        prisma,
        {
          checkPeriod: 15 * 60 * 1000,
          dbRecordIdIsSessionId: true,
          ttl: 24 * 60 * 60 * 1000,
          sessionModelName: 'Session'
        }
      ),
    })
  );

app.use(passport.initialize());
app.use(passport.session());

app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// const assetsPath = path.join(__dirname, "public");
// app.use(express.static(assetsPath));

app.use("/", usersRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Express app listening on port ${PORT}!`));
