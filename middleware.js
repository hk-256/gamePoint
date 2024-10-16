const ExpressError = require("./utils/ExpressError")

module.exports.storeReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
    }
      
        next();
    
}


module.exports.isLoggedIn = (req, res, next) => {
   
    if (!req.isAuthenticated()) {
        // console.log(req.originalUrl);
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/user/login');
    }
    else{
        next();
    }
}




module.exports.isAuthor = async (req,res,next)=>{
    
    const {id} = req.params;
    const camp = await campground.findById(id);

    if(!camp.author.equals(req.user._id)){
        req.flash("error","You are not authorized");
        res.redirect(`/campground/${id}`);
    }
    else{
        next();
    }

}