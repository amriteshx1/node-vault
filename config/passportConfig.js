const LocalStrategy = require('passport-local').Strategy;
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

function initialize(passport) {
    passport.use(
        new LocalStrategy(
            {
                usernameField: 'email', 
                passwordField: 'password',
            },
            async (email, password, done) => {
                const user = await prisma.user.findUnique({ where: { email } });
                if (!user) return done(null, false, { message: "No user found with that email" });

                const match = await bcrypt.compare(password, user.password);
                if (!match) return done(null, false, { message: "Incorrect password" });

                return done(null, user);
            }
        )
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        const user = await prisma.user.findUnique({ where: { id } });
        done(null, user);
    });
}

module.exports = initialize;
