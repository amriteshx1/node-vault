const { body, validationResult } = require("express-validator");
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require("multer");
const path = require("path");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const axios = require("axios");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "FileUploaderApp", 
    allowed_formats: ["jpg", "png", "pdf", "txt", "docx", "zip"],
    public_id: (req, file) => `${Date.now()}-${file.originalname}`,
  },
});

const upload = multer({ storage });


const alphaErr = "must only contain letters & numbers.";
const lengthErr = "must be between 1 and 10 characters.";

const validateUser = [

    body("username").trim().notEmpty()
       .isAlphanumeric().withMessage(`Username ${alphaErr}`)
       .isLength({ min: 1, max: 10 }).withMessage(`Username ${lengthErr}`),
    body("email").trim().notEmpty()
       .isEmail().normalizeEmail().withMessage('Enter a valid email'),
    body("password").trim().notEmpty()
       .isStrongPassword({
           minLength: 8,
           minUppercase: 1,
           minLowercase: 1,
           minNumbers: 1,
           minSymbols: 1
        })
    .withMessage('Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters'),
    body('confirmPassword')
      .custom((value, { req }) => value === req.body.password)
      .withMessage('Passwords do not match'),
  ];


exports.getHomepage = (req,res) => {
    res.render("index", {title : "Homepage"});
}

exports.getSignUp = (req, res) => {
    res.render('signup', {title : 'Sign Up', errors: []});
}

exports.postSignUp = [
    validateUser,
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).render("signup", {
              title: "Sign Up",
              errors: errors.array(),
            });
          }

        try{

        await prisma.user.create({
            data: {
              username: req.body.username,
              email: req.body.email,
              password: await bcrypt.hash(req.body.password, 10),
              createdAt: new Date(),
            }
          });
        } catch (err){
            if (err.code === 'P2002') {
                return res.render('signup', {
                  title: 'Sign Up',
                  errors: [{ msg: 'Username or email already exists' }]
                });
              }
              throw err; 
        }

        res.redirect('/');
    }
];

exports.getLogin = (req, res) => {
  res.render('login', {title: "Login"});
}

exports.postLogin = passport.authenticate("local", {
  successRedirect: "/loginHome",
  failureRedirect: "/login",
});

exports.getLogout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
}


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

exports.getLoginHome = [
  ensureAuthenticated,
  async (req, res) => {
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { username: true } 
    });

    const folders = await prisma.folder.findMany({
      where: { userId: req.user.id }
    });

    res.render("loginHome", { title: "Home", folders, username: user.username });
  }
];


exports.getCreateFolder = (req,res) => {
  res.render("createFolder", {title: "Create"});
}

exports.postCreateFolder = [
  ensureAuthenticated,
  async (req, res) => {
    const { foldername } = req.body;

    try {
      await prisma.folder.create({
        data: {
          name: foldername,
          userId: req.user.id,
          createdAt: new Date()
        }
      });

      res.redirect("/loginHome");
    } catch (err) {
      console.error("Error creating folder:", err);
      res.status(500).send("Something went wrong");
    }
  }
];


exports.getEditFolder = async (req, res) => {
  const folderId = parseInt(req.params.id);
  const folder = await prisma.folder.findUnique({ where: { id: folderId } });
  
  res.render("editFolder", { folder });
};

exports.postEditFolder = async (req, res) => {
  const folderId = parseInt(req.params.id);
  const newName = req.body.name;

  await prisma.folder.update({
    where: { id: folderId },
    data: { name: newName },
  });

  res.redirect("/loginHome");
};

exports.getDeleteFolder = async(req,res) => {
  const folderId = parseInt(req.params.id);
  await prisma.folder.delete({
    where: {id: folderId}
  });
  res.redirect("/loginHome");
}

exports.getFolderDetails = async (req, res) => {
  const folderId = parseInt(req.params.id);

  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    include: {
      files: true
    }
  });

  if (!folder) {
    return res.status(404).send("Folder not found");
  }

  res.render("folderDetails", { title: folder.name, folder });
};

exports.postUploadFile = [
  ensureAuthenticated,
  upload.single("file"),
  async (req, res) => {
    const folderId = parseInt(req.params.id);

    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    await prisma.file.create({
      data: {
        name: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        userId: req.user.id,
        folderId: folderId,
      },
    });

    res.redirect(`/loginHome/folder/${folderId}`);
  }
];

exports.getFileDetails = async (req, res) => {
  const fileId = parseInt(req.params.id);

  const file = await prisma.file.findUnique({
    where: { id: fileId }
  });

  if (!file) return res.status(404).send("File not found");

  res.render("fileDetails", {
    title: "File Details",
    file
  });
};

/* THIS DOWNLOAD PROBLEM IS SOLVED BY CHATGPT */

exports.downloadFile = async (req, res) => {
  const fileId = parseInt(req.params.id);
  const file = await prisma.file.findUnique({ where: { id: fileId } });

  if (!file) return res.status(404).send("File not found");

  try {
    const response = await axios.get(file.path, { responseType: "stream" });

    res.setHeader("Content-Disposition", `attachment; filename="${file.name}"`);
    res.setHeader("Content-Type", response.headers["content-type"]);

    response.data.pipe(res); // stream it to client
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).send("Failed to download the file.");
  }
};
