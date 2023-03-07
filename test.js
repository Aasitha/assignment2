var express = require('express');
const UIDGenerator = require('uid-generator');
const fs = require("fs");
const workerpool = require('workerpool');
const request=require('request');
const sharp = require("sharp");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
var app = express();
var activeUsers = {};
app.use(bodyParser.json())
const pool = workerpool.pool(__dirname + "/resize-worker.js", {
    maxWorkers: 5,
});
const userSchema = new mongoose.Schema({
    username: String,
    password: String
});
async function createDirectory(path){
await fs.access(path, (error) => {
    if (error) {
        fs.mkdir(path, (error) => {
            if (error) {
                console.log(error);
            } else {
                console.log("New Directory created successfully !!");
            }
        });
    } else {
        console.log("Given Directory already exists !!");
    }
});
}
app.use(bodyParser.urlencoded({ extended: false }))
/**
 * @api {post} /register Register user
 * @apiName registerUser
 * @apiGroup Authentication
 *
 * @apiBody {String} username Mandatory unique username
 * @apiBody {String} password Mandatory password
 * 
 *
 * @apiSuccess {String} Message User registered.
 * @apiError UserAlreadyExists Occurs when provided username is not unique
 *
 */
app.post('/register', function (req, res) {
    var username = req.body.username
    var password = req.body.password
    mongoose.set("strictQuery", false);
    mongoose.connect("mongodb://127.0.0.1:27017/assignment2", {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(() => {
        //res.send("connected successfully");
    }).catch((err) => {
        console.error(err);
    })
    var userModel = mongoose.model('users', userSchema);
    const user = new userModel({
        username: username,
        password: password
    })
    userModel.find({ username: username }).then((docs) => {
        if (Object.keys(docs).length > 0) {
            res.send("username already exixts");
        } else {
            user.save().then(() => {
                res.send("user registered");
            }).catch((err) => {
                res.send(err);
            })
        }
    }).catch((err) => {
        res.send(err);
    })

})
var data={

}
/**
 * @api {post} /login User login
 * @apiName loginUser
 * @apiGroup Authentication
 *
 * @apiBody {String} username Mandatory username
 * @apiBody {String} password Mandatory password
 *
 * @apiSuccess {Number} status OK
 * @apiSuccess {String} token Unique token generated
 * @apiSuccess {String} message Logged in
 *
 *
 * @apiError UserNotFound Invalid credentials
 *
 
 */
app.post('/login', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    mongoose.set("strictQuery", false);
    mongoose.connect("mongodb://127.0.0.1:27017/assignment2", {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(() => {
        //res.send("connected successfully");
    }).catch((err) => {
        console.error(err);
    })
    var userModel = mongoose.model('users', userSchema);
    const user = new userModel({
        username: username,
        password: password
    })
    userModel.findOne({ username: username, password: password }).then((docs) => {
        if (docs) {
            //res.send("Logged in");
            if (Object.keys(activeUsers).indexOf(username) != -1) {
                res.status(200).send("already logged in");
            } else {
                var path = "./" + username;
                createDirectory(path)
                path="./"+username+"/resized"
                createDirectory(path);
                path="./"+username+"/cropped"
                createDirectory(path);
                path="./"+username+"/formatted"
                createDirectory(path);
                const uidgen = new UIDGenerator();
                uidgen.generate((err, uid) => {
                    if (err) throw err;
                    else {
                        data.status=200;
                        data.token=uid;
                        data.msg="Logged in!"
                        res.send(data);

                        activeUsers[uid] = {
                            uname:username,
                            token: uid,
                            resized: 0,
                            cropped: 0,
                            formatted: 0
                        }
                        console.log(activeUsers);

                    }
                });

            }
        } else {
            res.status(400).send("invalid credentials");
        }
    }).catch((err) => {
        if (err) res.send(err);
    })

})
/**
 * @api {post} /changePassword Updating user password
 * @apiName Change user password
 * @apiGroup Authentication
 *
 * @apiBody {String} username Mandatory username
 * @apiBody {String} password Mandatory password
 * @apiBody {String} newPassword Mandatory new password
 *
 * @apiSuccess {String} message Password updated
 *
 *
 * @apiError UserNotFound The specified username not exists in database
 *

 */
app.post('/changePassword', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    mongoose.set("strictQuery", false);
    mongoose.connect("mongodb://127.0.0.1:27017/assignment2", {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(() => {
        //res.send("connected successfully");
    }).catch((err) => {
        console.error(err);
    })
    var userModel = mongoose.model('users', userSchema);
    const user = new userModel({
        username: username,
        password: password
    })
    userModel.findOneAndUpdate({ username: username }, { password: req.body.newPassword }).then(() => {
        res.send("password updated");
    }).catch((err) => {
        if (err) res.send(err);
    })

})
/**
 * @api {post} /logout User logging out
 * @apiName User logout
 * @apiGroup Authentication

 * @apiHeader {String} token Token that represents the authenticated user
 * @apiSuccess {String} message Logged out
 *
 * @apiError UserNotFound The specified username not exists in database
 *
 */
app.post('/logout', function (req, res) {
    
    var token=req.headers.token;
    if(Object.keys(activeUsers).indexOf(token)==-1){
        res.status(400).send("Bad request");
    }else{
    delete activeUsers[token];
    res.send("logged out");
    }
})
/**
 * @api {post} /resize Resize the image
 * @apiName Resize image
 * @apiGroup Functionalities
 *
 * @apiBody {String} width Width of resized image
 * @apiBody {String} height Height of resized image
 * @apiBody {String} src Path for the image
 * @apiHeader {string} token token that represents the authenticated user
 *
 * @apiSuccess {String} message Image resized
 *
 * @apiError Error Error occured while processing the image
 *
 */
app.post('/resize', function (req, res) {
    var token=req.headers.token;

    if (Object.keys(activeUsers).indexOf(token) == -1) {
        data.status=400;
        data.msg="not logged in";
        res.send(data);
    } else {
        
        var username=activeUsers[token].uname;
        var src = req.body.src;
        var width = parseInt(req.body.width);
        var height = parseInt(req.body.height);
        activeUsers[token].resized += 1;
        var filePath="./"+username+"/resized/"+activeUsers[token].resized+".jpg";
        pool.exec("resize", [src, width, height, username, filePath]).then(() => {
            res.send("successfully resized");
        }).catch((err) => {
            res.send(err);
        })
    }
})
app.post('/resizeOnline',function(req,res){
    var token=req.headers.token;
    var imageUrl="https://c8.alamy.com/zooms/9/228070d0c6474a858fe644de260af0b3/j9bpjb.jpg"
    request(imageUrl).pipe(sharp().resize(200)).toFile('onlineResized.jpg',function(err){
        if(err){
            console.log("Error: "+err);
            res.send(err);
        }else{
            res.send("image resized successfully!");
        }
    });
})

/**
 * @api {post} /crop Crop the image
 * @apiName Crop image
 * @apiGroup Functionalities
 *
 * @apiBody {String} width Width in pixels
 * @apiBody {String} height Height in pixels
 * @apiBody {String} left Left in pixels
 * @apiBody {String} top top in pixels
 * @apiBody {String} src Path for the image
 * @apiHeader {string} token token that represents the authenticated user
 *
 * @apiSuccess {String} message Image cropped
 *
 * @apiError Error Error occured while processing the image
 *
 */
app.post('/crop', function (req, res) {
    var token = req.headers.token;
    if (Object.keys(activeUsers).indexOf(token) == -1) {

        res.send("not logged in");
    } else {
        var username=activeUsers[token].uname;
        var src = req.body.src;
        var width = req.body.width;
        var height = req.body.height;
        var left = req.body.left;
        var top = req.body.top;
        activeUsers[token].cropped += 1;
        var filePath="./"+username+"/cropped/"+activeUsers[token].cropped+".jpg";
        pool.exec("crop", [src, width, height, left, top, username,filePath]).then(() => {
            res.send("cropped successfully");
        }).catch((err) => {
            res.send(err);
        })
    }
})
/**
 * @api {post} /format Change the image format
 * @apiName Format image
 * @apiGroup Functionalities
 *
 * @apiBody {String} format required format
 * @apiBody {String} src Path for the image
 * @apiHeader {string} token token that represents the authenticated user
 *
 * @apiSuccess {String} message Image formatted
 *
 * @apiError Error Error occured while processing the image
 *
 */
app.post('/format', function (req, res) {
    var token=req.headers.token;
    if (Object.keys(activeUsers).indexOf(token) == -1) {
        res.send("not logged in");
    } else {
        var username=activeUsers[token].uname;
        var src = req.body.src;
        var format = req.body.format;
        activeUsers[token].formatted += 1;
        var filePath="./"+username+"/formatted/"+activeUsers[token].formatted+".jpg";
        pool.exec("format", [src, format, username,filePath]).then(() => {
            res.send("formatted successfully");
        }).catch((err) => {
            res.send(err);
        })
    }
})
var server = app.listen(3000, function () {
    var host = "localhost"
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)
});
