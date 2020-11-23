//in this file we set up the express app and connect it to firebase as well.
const functions = require("firebase-functions");
const express = require("express");
const app = express(); //intialize app
const FBAuth = require("./utils/fbAuth");

const { getAllNotes, postOneNote } = require("./routes/notes");
const { signup, login } = require("./routes/users");

//NOTES routes
app.get("/notes", getAllNotes);
app.post("/note", FBAuth, postOneNote);

//USERS routes
app.post("/signup", signup);
app.post("/login", login);

//here we are telling that the app on line 11 is the container for all the routes in the app- to make sure set up like this https://baseurl.com/api/ - make sure our api are at this url
exports.api = functions.https.onRequest(app); //instead of passing one route and one function, we just pass our app and it will automatically turn into different routes.

//by default firebase deploys to us-central1 region but by deploying to us-central region will slow down application in development- add latency on each request- using .region("europe-west1") will make sure next time we deploy it will be to that european zone
