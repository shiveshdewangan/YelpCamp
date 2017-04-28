var express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    flash = require("connect-flash"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    methodOverride = require("method-override"),
    Campground = require("./models/campground"),
    Comment = require("./models/comment"),
    User = require("./models/user");
    //seedDB = require("./seeds");



//PASSPORT CONFIG
app.use(require("express-session")({
    secret: "Once again Rusty is the cutest dog!",
    resave: false,
    saveUninitialized : false
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

mongoose.connect("mongodb://localhost/yelp_camp");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
//seedDB();
app.use(methodOverride("_method"));



app.get("/", function(req, res){
    res.render("landing.ejs");
});

//==================
//CAMPGROUNDS ROUTES
//==================

app.get("/campgrounds", function(req, res){
    //GET all data from DB
    Campground.find({}, function(err, allCampgrounds){
        if(err){
            console.log(err);
        } else {
            res.render("campgrounds/index.ejs", {campgrounds : allCampgrounds});
        }
    });
    
});

//POST Campgrounds
app.post("/campgrounds", isLoggedIn, function(req, res){
    //posts
    var name = req.body.name;
    var image = req.body.image;
    var desc = req.body.description;
    
    var author = {
        id: req.user._id,
        username : req.user.username
    };
    
    var newCampground = {name : name, image : image, description : desc, author : author};
    //Create a new campground and save it to DB
    
    Campground.create(newCampground, function(err, newlyCreate){
        
        if(err){
            console.log(err);
        } else {
            console.log(newlyCreate);
            res.redirect("/campgrounds");
        }
    });
    //campgrounds.push(newCampground);
});

//NEW
app.get("/campgrounds/new", isLoggedIn, function(req, res){
    res.render("campgrounds/new.ejs");
});

// SHOW - shows more info about one campground
app.get("/campgrounds/:id", function(req, res){
    
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        
        if(err){
            console.log(err);
        } else {
            //res.send("This will be the show page on day !!");
            console.log(foundCampground);
            res.render("campgrounds/show.ejs", {campground : foundCampground});            
        }
    });
});

//EDIT CAMPGROUND ROUTE
app.get("/campgrounds/:id/edit", checkCampgroundOwnership, function(req, res) {
    Campground.findById(req.params.id, function(err, foundCampground) {
        res.render("campgrounds/edit", {campground : foundCampground});
    });
});

//UPDATE CAMPGROUND ROUTE
app.put("/campgrounds/:id", checkCampgroundOwnership, function(req, res){
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
        if(err){
            res.redirect("/campgrounds");
        } else {
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
    
});

//DESTROY CAMPGROUND ROUTE
app.delete("/campgrounds/:id", checkCampgroundOwnership, function(req, res) {
    Campground.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.redirect("/campgrounds");
        } else {
            res.redirect("/campgrounds");
        }
    });
});

//=================
// COMMENTS ROUTES
//=================
app.get("/campgrounds/:id/comments/new", isLoggedIn, function(req, res) {
   //res.render("comments/new");
   Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
        } else {
            res.render("comments/new", {campground : campground});
        }
    });
});

//POST COMMENT
app.post("/campgrounds/:id/comments", isLoggedIn, function(req, res){
    Campground.findById(req.params.id, function(err, campground) {
        if(err){
            console.log(err);
            res.redirect("/campgrounds");
        } else {
            Comment.create(req.body.comment, function(err, comment){
              if(err){
                  req.flash("error", "Something went wrong");
                  console.log(err);
              }  else {
                  //add username and id to the comment
                  comment.author.id = req.user._id;
                  comment.author.username = req.user.username;
                  //save comment
                  comment.save();
                  campground.comments.push(comment);
                  campground.save();
                  console.log(comment);
                  req.flash("success", "Successfully added a comment");
                  res.redirect("/campgrounds/" + campground._id);
              }
            });
        }
    })
});

//COMMENT EDIT ROUTE
app.get("/campgrounds/:id/comments/:comment_id/edit", checkCommentOwnership, function(req, res) {
    Comment.findById(req.params.comment_id, function(err, foundComment){
        if(err){
            console.log(err);
        } else {
            res.render("comments/edit", {campground_id : req.params.id, comment : foundComment});
        }
    });
});

//COMMENT UPDATE ROUTE
app.put("/campgrounds/:id/comments/:comment_id", checkCommentOwnership, function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
       if(err){
           res.redirect("back");
       } 
           res.redirect("/campgrounds/" + req.params.id);
    });
});

//COMMENT DESTROY ROUTE
app.delete("/campgrounds/:id/comments/:comment_id", checkCommentOwnership, function(req, res){
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err){
            res.redirect("back");
        } else {
            req.flash("success", "Successfully deleted a comment");
            res.redirect("/campgrounds/" + req.params.id);         
        }
    });
});

//===========
//AUTH ROUTES
//===========
app.get("/register", function(req, res) {
    res.render("register");
});

//handle sign up logic
app.post("/register", function(req, res) {
   var newUser = new User({username : req.body.username});
   User.register(newUser, req.body.password, function(err, user){
       if(err){
           req.flash("error", err.message);
           return res.render("register");
       }
       passport.authenticate("local")(req, res, function(){
          req.flash("success", "Welcome to YelpCamp" + user.username);
          res.redirect("/campgrounds"); 
       });
   });
});

//show login form
app.get("/login", function(req, res) {
    res.render("login");
});

//handle login logic
app.post("/login", passport.authenticate("local",
    {
        successRedirect : "/campgrounds",
        failureRedirect : "/login"
    }), function(req, res){
        
});

//logout logic
app.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/campgrounds");
});

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in to do that !!");
    res.redirect("/login");
}

function checkCampgroundOwnership(req, res, next){
    if(req.isAuthenticated()){
        Campground.findById(req.params.id, function(err, foundCampground) {
        if(err){
            req.flash("error", "Campground not found");
            console.log(err);
            res.redirect("back");
        } else {
            //does the user own the campground
            if(foundCampground.author.id.equals(req.user._id)){
                next();
            } else {
                req.flash("error", "You do not have permission to do that");
                res.redirect("back");
            }
        }
        });
    } else {
        res.redirect("back");
    }
}

function checkCommentOwnership(req, res, next){
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment) {
        if(err){
            console.log(err);
            res.redirect("back");
        } else {
            //does the user own the comment
            if(foundComment.author.id.equals(req.user._id)){
                next();
            } else {
                req.flash("error", "You do not have permission to do that");
                res.redirect("back");
            }
        }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
}

app.listen(process.env.PORT, process.env.IP, function(req, res){
    console.log("Server is running !!");
});