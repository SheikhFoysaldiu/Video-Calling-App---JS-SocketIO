const index = async (req, res, next) => {
    try {
            res.render('index', {
        });
    } catch (err) {
        console.log(err);
    }
}


module.exports = {
    index,
 
}