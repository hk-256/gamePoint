
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const app = express();
const ejsMate = require("ejs-mate");
// const Joi = require("joi");
const methodOverride = require("method-override");
const session = require("express-session");
const flash =  require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");
const mongoSanitize = require("express-mongo-sanitize");

const MongoStore = require("connect-mongo");

const cors = require('cors');

app.use(cors())


const User = require("./models/user");
app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname,"public")));
app.engine("ejs",ejsMate);


app.use(mongoSanitize({
    replaceWith: '_'
}));

const {isLoggedIn,isAuthor} = require("./middleware");
const sportsCenter = require("./models/sportsCenter");
const bookings = require("./models/bookings");
const sport = require("./models/sport");
const { brotliCompressSync } = require("zlib");

// const dbUrl = 'mongodb://127.0.0.1:27017/gametheory'
const dbUrl = "mongodb+srv://iit2021256:lkNiJDmvpsgs5V50@cluster0.xonmd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
// const dbUrl = "mongodb+srv://nandaaman1234:5BHbKoY9dGvAJRFu@cluster0.zi3ou.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
// const dbUrl = process.env.DB_URL;
mongoose.connect(dbUrl)
  .then(()=>{
    console.log("connected");
  })
  .catch((err)=>{
    console.log("there is an error in connecting");
    console.log(err);
  })


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({extended:true}));


// const connect = async () => {
//     try {
//         await mongoose.connect(dbUrl, { useNewUrlParser: true });
//         console.log("object")
// 		app.listen(5500, () => {
// 			console.log(`Connection established at localhost:${5500}`);
// 		});
// 	} catch (err) {
// 		console.error('Error connecting to MongoDB:', err);
// 	}
// };

// connect();



  app.listen(5500,()=>{
      console.log("started listening to the port 5500");
  })

  
const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret: 'fuckthisshit'
    }
});

const sessionConfig = {
    store,
    name: "session",
    secret: "ThisIsSecret",
    resave: false,
    saveUninitialized: true,
    cookie:{
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000*60*60*24*7,
        maxAge:  1000*60*60*24*7
    }
}

app.use(session(sessionConfig));
app.use(flash());


app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req,res,next)=>{
    
    res.locals.currUser = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
})



app.get("/user/login" , (req,res)=>{
    res.render("login");
})
app.post("/user/login" , passport.authenticate('local', {failureFlash: true, failureRedirect: '/user/login'}) , (req,res)=>{
    req.flash('success', 'Welcome back!');
    res.redirect("/");
})

app.get("/user/register" , (req,res)=>{
    res.render("register");
})
app.post("/user/register" , async (req,res)=>{
    try{
        const {username,email,password,phoneNumber} = req.body;
        const user = new User({
            username: username,
            email: email,
            phoneNumber : phoneNumber
        });
        const registerdUser = await User.register(user,password);
        req.login(registerdUser,(e)=>{
            if(e) next(e);
            req.flash('success',"welcome to yelpcamp");
            res.redirect("/");
        })
    }
    catch(e){
        req.flash('error',e.message);
        res.redirect("/register");    
    }
})

app.get("/logout" , async(req,res,next)=>{
    req.logout((e)=>{
        if(e){
            next(e);
        }
        else{
            req.flash("success","you are successfully logged out");
            res.redirect("/");
        }
    });
})

// those sections are for autheticatoin purposes


app.get("/",isLoggedIn , async(req,res)=>{
    const centers = await sportsCenter.find();
    res.render("home.ejs",{centers});
})


app.get("/user/:id" , async (req,res)=>{
    const {id} = req.params;
    if(req.user._id!=id){
        res.redirect(`/user/${user._id}`);
    }
    const user = await User.findById(id);
    const centers = [];
    const books = [];
    for(let Center of user.sportsCenters){
        const sC = await sportsCenter.findById(Center._id);
        if(sC!=null) centers.push(sC);
    }
    for(let booking of user.bookings){
        const book = await bookings.findById(booking._id);
        if(!book){
            continue;
        }
        const game = await sport.findById(book.sport._id);
        const center = await sportsCenter.findById(game.Center._id);
        const obj = {
            sportName : game.sportsName,
            courtNumber : book.courtNumber,
            centerName : center.name,
            slot : book.slot
        }
        books.push(obj);
        // if(book!=null) books.push(book);
    }
    // console.log(user);
    // console.log(centers);
    console.log(books);

    res.render("user/profile" , {user,centers,books});
})

app.get("/createSportsCenter", (req,res)=>{
    res.render("sportCenter/create");
})

app.post("/createSportsCenter", async (req,res)=>{
    const user = await User.findById(req.user._id);
    const center = new sportsCenter(req.body.center);
    center.owner = user;
    await center.save();
    user.sportsCenters.push(center);
    await user.save();
    res.redirect(`/user/${user._id}`);
})


app.get("/sportsCenter/:id" ,async(req,res)=>{

    const {id}  = req.params;
    const center = await sportsCenter.findById(id).populate({
        path : "sports"
    });

    // console.log(center);
    res.render("sportCenter/show" , {center});
})

app.get("/:id/createSport" , (req,res)=>{
    const {id} = req.params;
    res.render("sportCenter/createSport" , {id});
})

app.post("/:id/createSport" ,async(req,res)=>{
    const {id} = req.params;
    const {game,count} = req.body;
    const sports = new sport(game);
    let num = parseInt(count)+1;
    while(num--){
        sports.courts.push({});
    }
    const center = await sportsCenter.findById(id);
    sports.Center = center;
    sports.save();
    center.sports.push(sports);
    center.save();
    res.redirect(`/sportsCenter/${id}`);
    // res.render("sportCenter/createSport" , {id});
})



app.get("/sport/:id" , async (req,res)=>{
    
    const {id} = req.params;
    const game = await sport.findById(id);
    console.log(game);
    const center = await sportsCenter.findById(game.Center._id);

    console.log(game.Center);
    if(!center.owner.equals(req.user._id)){
        res.redirect(`/sport/${id}/book`);
    }

    let availability = {};

    for (let hour = 6; hour <= 23; hour++) {
      availability[hour] = {}; // Create an entry for each hour
      for(let i = 0;i<game.courts.length;i++){
        availability[hour][i] = true;
      }
    }

    for(let i = 0;i<game.courts.length;i++){

        for(let book of game.courts[i].courtBooking){
            const booking = await bookings.findById(book._id);
    
            availability[booking.slot][i-1] = false;
            
        }

    }

    let courts = game.courts.length;
    res.render("sportCenter/book",{availability,courts,id});
})

app.get("/sport/:id/book" , async(req,res)=>{

    const {id} = req.params; 
    const game = await sport.findById(id);
    let availability = {};

    for (let hour = 6; hour <= 23; hour++) {
      availability[hour] = {}; // Create an entry for each hour
      for(let i = 0;i<game.courts.length;i++){
        availability[hour][i] = true;
      }
    }

    for(let i = 0;i<game.courts.length;i++){

        for(let book of game.courts[i].courtBooking){
            const booking = await bookings.findById(book._id);
    
            availability[booking.slot][i-1] = false;
            
        }

    }

    let courts = game.courts.length;
    res.render("sportCenter/book",{availability,courts,id});


})

app.post("/sport/:id/book" , async(req,res)=>{
    const {id} = req.params;
    const {selectedSlots} = req.body;
    const selectedSlotsArray = selectedSlots ? selectedSlots.split(',') : [];
    const books = selectedSlotsArray.map(slot => {
        // Split the slot string into hour and court number
        const [hour, court] = slot.split('-');
        return {
          courtNumber: parseInt(court, 10), // Convert to integer
          slotTime: parseInt(hour) // Format time
        };
      });
      // console.log('Parsed Bookings:', books);
    const game = await sport.findById(id);
    const center = game.Center;
    const user = await User.findById(req.user._id);
    const ans = [];
    for(let book of books ){
        const booking = new bookings();

        booking.user = req.user
        booking.sport = game
        booking.courtNumber = book.courtNumber
        booking.slot = book.slotTime;
        await booking.save();
        user.bookings.push(booking);
        await user.save();
        game.courts[book.courtNumber].courtBooking.push(booking);
        await game.save();
    }

    res.redirect(`/sport/${id}/book`);
})