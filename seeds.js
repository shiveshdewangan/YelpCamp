var mongoose = require("mongoose");
var Campground = require("./models/campground");
var Comment = require("./models/comment");

var data = [
        {
            name : "Salmon Creek", 
            image:"http://haulihuvila.com/wp-content/uploads/2012/09/hauli-huvila-campgrounds-lg.jpg",
            description : "This is the description"
        },
        {
            name : "Salmon Creek", 
            image:"http://haulihuvila.com/wp-content/uploads/2012/09/hauli-huvila-campgrounds-lg.jpg",
            description : "This is the description"
        },
        {
            name : "Salmon Creek", 
            image:"http://haulihuvila.com/wp-content/uploads/2012/09/hauli-huvila-campgrounds-lg.jpg",
            description : "This is the description"
        }
    ];

function seedDB(){
    //Remove all campgrounds
    Campground.remove({}, function(err){
        if(err){
            console.log(err);
        } else {
        console.log("removed campgrounds !!");
        // add a few campgrounds
            data.forEach(function(seed){
                Campground.create(seed, function(err, campground){
                    if(err){
                        console.log(err);
                    } else {
                        console.log("added a campground");
                        //creat few comments
                        Comment.create(
                            {
                                text: "this is the first comment!!",
                                author : "Shivesh Dewangan"
                            }, function(err, comment){
                                if(err){
                                    console.log(err);
                                } else {
                                    campground.comments.push(comment);
                                    campground.save();
                                    console.log("created new comment");
                                }
                            });
                    }
                });    
            });
        };
    });    
};

module.exports = seedDB;