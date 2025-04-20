const { Router } = require("express");
const usersController = require("../controllers/usersController");
const usersRouter = Router();

usersRouter.get("/", usersController.getHomepage);
usersRouter.get("/signup", usersController.getSignUp);
usersRouter.post("/signup", usersController.postSignUp);
usersRouter.get("/login", usersController.getLogin);
usersRouter.post("/login", usersController.postLogin);
usersRouter.get("/logout", usersController.getLogout);
usersRouter.get("/loginHome", usersController.getLoginHome);
usersRouter.get("/loginHome/upload", usersController.getUploadPage);
usersRouter.post("/upload", usersController.postUpload);
usersRouter.get("/loginHome/folder", usersController.getCreateFolder);
usersRouter.post("/loginHome/folder", usersController.postCreateFolder);

module.exports = usersRouter;