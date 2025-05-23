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
usersRouter.get("/loginHome/folder", usersController.getCreateFolder);
usersRouter.post("/loginHome/folder", usersController.postCreateFolder);
usersRouter.get("/loginHome/edit/:id", usersController.getEditFolder);
usersRouter.post("/loginHome/edit/:id", usersController.postEditFolder);
usersRouter.get("/loginHome/delete/:id", usersController.getDeleteFolder);
usersRouter.get("/loginHome/folder/:id", usersController.getFolderDetails);
usersRouter.post("/loginHome/folder/:id/upload", usersController.postUploadFile);
usersRouter.get("/loginHome/file/:id", usersController.getFileDetails);
usersRouter.get("/file/download/:id", usersController.downloadFile);

module.exports = usersRouter;