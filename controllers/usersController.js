exports.getHomepage = (req,res) => {
    res.render("index", {title : "Homepage"});
}

exports.getSignUp = (req, res) => {
    res.render('signup', {title : 'Sign Up', errors: []});
}