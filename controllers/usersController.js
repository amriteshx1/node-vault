const { body, validationResult } = require("express-validator");
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require("multer");
const path = require("path");

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

/* Multer Area */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

exports.getLoginHome = [
  ensureAuthenticated,
  async (req, res) => {
    const folders = await prisma.folder.findMany({
      where: { userId: req.user.id }
    });

    res.render("loginHome", { title: "Home", folders });
  }
];


exports.postUpload = [
  ensureAuthenticated,
  upload.single("file"), (req, res) => {
    console.log("File uploaded:", req.file);
    res.send("File uploaded successfully!");
  }
]

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

exports.getUploadPage = [ ensureAuthenticated, (req, res) => {
  res.render("upload", { title: "Upload" });
}];

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