//jshint esversion:6
require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const saltRounds = 10 ;


const app = express();

app.set('view engine', 'ejs');
app.use( bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));

app.use(session({
    secret : process.env.SECRET ,
    resave : false,
    saveUninitialized : false
}));
app.use(passport.initialize());
app.use(passport.authenticate('session'));


mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    username : String,
    password : String
});

const User = new mongoose.model("User", userSchema);

const secretSchema = new mongoose.Schema({
    secretContent : String
});

const Secret = new mongoose.model("Secret", secretSchema);

passport.use(new LocalStrategy(
    function(username, password, done) {
      User.findOne({ username: username }, function (err, foundUser) {
        if (err) { 
            console.log(err); 
        }
        if (!foundUser) {
             return done( null, false); 
            }
        bcrypt.compare( password, foundUser.password, function(req, res){
            if (!true) {
                return done(null, false); 
               }
        });
        return done(null, foundUser);
      });
    }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});


app.get("/", function(req, res){
    res.render("home");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.get("/submit", function( req, res){
    res.render("submit");
});

app.get("/secrets",  function( req, res){
    if (req.isAuthenticated()){
        Secret.find({}, function( err, secretList){
            if(!err){
                res.render("secrets", { secretList : secretList });
            }   
        });  
    }else{
        res.redirect("/login");
    }
});

app.get("/logout", function( req, res){
    req.logout();
    res.redirect("/");
});

app.post("/submit", function(req, res){
    const newSecret = new Secret({
        secretContent : req.body.secret
    });
    newSecret.save(function (err) {
        if (!err) {
            res.redirect("/secrets");
        }
    });

});

app.post("/login", passport.authenticate('local', { failureRedirect: '/login' }), function(req, res) {
    res.redirect('/secrets');
  });

app.post("/register", function(req, res) {
    bcrypt.hash ( req.body.password, saltRounds, function(err, hash){
        const newUser = new User({
            username : req.body.username ,
            password : hash
        });
        newUser.save(function(err){
          if (err) {
              console.log(err);
          } else {
            req.login(newUser, function(err) {
                if (err) { 
                    console.log(err); 
                }
                res.redirect('/secrets');
              }); 
          };
      });
    });
});

app.post("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});


app.listen( 3000, function(){
    console.log("Server working on port 3000!");
});