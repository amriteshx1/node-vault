const { Router } = require("express");
const usersController = require("../controllers/usersController");
const usersRouter = Router();

usersRouter.get("/", usersController.getHomepage);
usersRouter.get("/signup", usersController.getSignUp);
usersRouter.post("/signup", usersController.postSignUp);

module.exports = usersRouter;