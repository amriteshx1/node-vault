exports.getHomepage = (req,res) => {
    res.render("index", {title : "Homepage"});
}