var express = require('express');
const UIDGenerator = require('uid-generator');

const workerpool = require('workerpool');
const sharp = require("sharp");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
var app = express();
var activeUsers = {};
app.use(bodyParser.json())
const pool = workerpool.pool(__dirname+"/resize-worker.js",{
    maxWorkers: 5,
    //workerType: 'worker.js'
});
const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

app.use(bodyParser.urlencoded({ extended: false }))
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
                res.send("already logged in");
            } else {


                const uidgen = new UIDGenerator();
                uidgen.generate((err, uid) => {
                    if (err) throw err;
                    else {
                        res.send("logged in with token: " + uid);
                        activeUsers[username] = {
                            token: uid
                        }
                        console.log(activeUsers);

                    }
                });
            }
        } else {
            res.send("username not exists");
        }
    }).catch((err) => {
        if (err) res.send(err);
    })

})
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
app.post('/logout', function (req, res) {
    var username = req.body.username;
    delete activeUsers[username];
    res.send("logged out");
})
app.post('/resize', function (req, res) {
    var username = req.body.username;
    if (Object.keys(activeUsers).indexOf(username) == -1) {
        res.send("not logged in");
    } else {
        var src = process.argv[2];
        var width = parseInt(req.body.width);
        var height = parseInt(req.body.height);
        //resizeImage(width,height,src)
        pool.exec("resize", [width, height,username]).then(() => {

            res.send("successfully resized")
        }).catch((err) => {
            res.send(err);
        })
    }
})
app.post('')
var server = app.listen(3000, function () {
    var host = "localhost"
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)
})
/* newUser.save().then(()=>{
    res.render("secrets");
}).catch((err)=>{
    console.log(err);
}) */