//in this file we set up the express app and connect it to firebase as well.

const express = require("express");
const app = express(); //intialize app

const functions = require("firebase-functions");
const admin = require("firebase-admin"); //-admin sdk this is nodejs code - not using import from

//to use admin we need to initialize application
admin.initializeApp(); //usually pass in an applicaiton but project already knows our applicaiton id. check .firebaserc file - gives us access to admin object

const firebaseConfig = {
  //config object from app on firebase
  apiKey: "AIzaSyBgw--SVRimmKTuv-eP9Uh3HwsO747NXc0",
  authDomain: "blue-music-box.firebaseapp.com",
  databaseURL: "https://blue-music-box.firebaseio.com",
  projectId: "blue-music-box",
  storageBucket: "blue-music-box.appspot.com",
  messagingSenderId: "100027773946",
  appId: "1:100027773946:web:6ad1344f047b4212206a43",
  measurementId: "G-G3TFJV9LGG",
};

//initalize firebase app
const firebase = require("firebase"); //require in firebase after installing
firebase.initializeApp(firebaseConfig); //pass in config object  so firebase knows what app we are talking about

const db = admin.firestore(); //wherever we need firestore we just do "db." - replaces admin.firestore()

//fetching posts from database - essentially a GET request
app.get("/notes", (req, res) => {
  //need access to database - use admin sdk or db. --check line 28
  db.collection("notes")
    .orderBy("createdAt", "desc") //making sure we order the documents by date to make sure we get the latest on first - note that by default it would of done it by ascending order
    .get() //admin.firestore() takes place of db.collection
    .then((data) => {
      //data.docs has a property called "docs" which has an array of document snapshots
      let notes = []; //empty array to store notes from DB
      data.forEach((doc) => {
        notes.push({
          noteId: doc.id, //making sure we also get back the id of each document in DB
          ...doc.data(), //doc.data() is a function that returns the data inside document
        });
      }); //now the notes array should be populated with all our notes from the database
      return res.json(notes); //res.json to return as json object
    })
    .catch((err) => console.error(err)); //above code returns promise so we catch any errors
});

//writing a function that intercepts request and does something depending on what the request has and decides whether or not to proceed to handler or stop and send response (middleware) FBAuth = firebase authentication- so in any route where we add FBAuth as middleware, if we get past it then that means that the beggining block of code of that route then ther user has already been verified and authenticated and we have access to request.user- add this middleware whenever there is a protected route
const FBAuth = (req, res, next) => {
  let idToken;

  //check if there is authorization in headers and there is a standard that says the token has to start with the 'Bearer ' string - startsWith
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    idToken = req.headers.authorization.split("Bearer ")[1]; //use split because we need to extract token because there is "Bearer " infront of it- we will have an array of two strings, 2nd one will be token
  } //no we have our token and can proceed with logic
  else {
    console.err("No token found");
    return res.status(403).json({ error: "Unauthorized" });
  }
  //if we get here there is a token but we need to verify that the token was issues by this application
  admin
    .auth()
    .verifyIdToken(idToken) //promises holds a decoded token
    .then((decodedToken) => {
      //console.log(decodedToken);
      //decoded token holds the data that is inside token which is user data, we need to add data to request object so that when request proceeds forward to any route that uses this FBAuth func, our request paramater in those routes will have extra data we added in this middleware function
      req.user = decodedToken;
      //we need to also get the handle because the handle is not stored in FB authentication system but instead in the collection "users" -so we do a DB request
      return db
        .collection("users")
        .where("userId", "==", req.user.uid) //also store userId in users collection - we already have the user in the request of this middleware
        .limit(1) //limits our result to just one document
        .get();
    })
    .then((data) => {
      //even though db collection query and we where, and it is limited to 1 above, what is returned will still have a docs property which is array with one element so we need to access it
      req.user.handle = data.docs[0].data().handle; //.data() extracts all data in document - attaching it to our request.user obj
      return next(); //allows user request to proceed to routes
    })
    .catch((err) => {
      //if admin.auth() fails to verify token- maybe its expired, or blacklisted or from other issuer
      console.error("Error while verifying token", err);
      return res.status(403).json(err);
    });
};

//creating/posting a note -new addition to db --essentially a POST request
app.post("/note", FBAuth, (req, res) => {
  //prevents problem when a user sends a get request to route that is meant for post request- this way they wont get a 500 server error
  // if (req.method !== "POST") {
  //   return res.status(400).json({ error: "Method not allowed" }); //400 means bad request- client side
  // } but we dont need this anymore because express handles all of that for us and will make sure that route fails if uses post on get route

  //should be request body
  const newNote = {
    // in the post request we only really need to add a body - we get userHandle from FbAuth using the token provided upon login
    //body of request
    body: req.body.body, //first body is body of request, 2nd body is the property in body object
    userHandle: req.user.handle, //FBAuth middleware added user to our request object
    createdAt: new Date().toISOString(), //to use normal date string instead of firestore timestamp to make sure we can format later
    // firestore default timestamp:admin.firestore.Timestamp.fromDate(new Date()), //fromDate func creates a timestamp from normal JS date object
  };

  //now we have a new object we need to persist in our DB
  db.collection("notes")
    .add(newNote) //takes json obj and adds it to DB -returns a new promise
    .then((doc) => {
      //gives us a doc ref as response
      //if we are here that means document has been created
      res.json({ message: `document ${doc.id} created successfully` }); //doc.id is a property in doc ref type
    })
    .catch((err) => {
      res.status(500).json({ error: "somethign went wrong" });
      console.error(err);
    });
});

//helper function to validate if a string is empty or not
const isEmpty = (string) => {
  if (string.trim() === "") return true;
  //.trim() to eliminate white spaces in case someone submits one space and would not be considered empty
  else return false;
};
//check if email is a valid emial after we know if an empty string was not given
const isEmail = (email) => {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/; //expression that matches for email pattern
  if (email.match(regEx)) return true;
  //.match() matches string against regular expression (regEx)
  else return false;
};

//sign-up route
app.post("/signup", (req, res) => {
  //extract form data from request body
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  };

  let errors = {}; //initalize errors object to be used to send errors during validation below- we will return all errors together

  //validate data - each field from newUser obj from above
  if (isEmpty(newUser.email)) {
    errors.email = "Must not be empty"; //assigning email property in error object above
  } else if (!isEmail(newUser.email)) {
    //if not a vaild email
    errors.email = "Must be a valid email address";
  }

  if (isEmpty(newUser.password)) errors.password = "Must not be empty";
  if (newUser.password !== newUser.confirmPassword)
    errors.confirmPassword = "Passwords must match";

  if (isEmpty(newUser.handle)) errors.handle = "Must not be empty";

  //here we make sure that we can continue if the errors obj is empty, if not we break and return
  if (Object.keys(errors).length > 0) return res.status(400).json(errors); //make sure array of keys is not bigger than 0

  let token, userId; //intialize token and userId variable
  db.doc(`/users/${newUser.handle}`)
    .get() //passes in path
    .then((doc) => {
      //holds document snapshot- even if doc doesnt exist we will have a snapshot
      if (doc.exists) {
        //booleab -if doc exists and is true then handle is taken
        return res.status(400).json({ handle: "this handle is already taken" }); //we will object containing errors- if error pertains to any field then the error's name will be that field
      } else {
        //we actually create user -returns promise
        return firebase //need return since we are in .then block
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then((data) => {
      userId = data.user.uid; //sets value of userId to be used later
      //this .then because we await the promise returned from above .then
      //if we are here then the user was created - we need to return access token an authentication token to user so that they later use it to request more data
      return data.user.getIdToken();
    })
    .then((idToken) => {
      token = idToken; //can use just token because name of property and value are same - we will use token for when we need to access routes that are protected
      const userCredentials = {
        //this is to create a user document for user whenever they register
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId, //shorthand
      };
      return db.doc(`/users/${newUser.handle}`).set(userCredentials); //give the handle as document id - .set() creates doc, opposite of .get() - this returns promise
      //now we need to persist these credentials in doc is user's collection
    })
    .then(() => {
      return res.status(201).json({ token }); //shorthand: same name of value and property
    })
    .catch((err) => {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        //we want to check if code of error is auth.. it means its not server error its a client error
        return res.status(400).json({ email: "Email is already in use" });
      }
      return res.status(500).json({ error: err.code });
    });
});

//login routes
app.post("/login", (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  let errors = {};

  //validations
  if (isEmpty(user.email)) errors.email = "Must not be empty";
  if (isEmpty(user.password)) errors.password = "Must not be empty";

  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  //if no errors - login the user
  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password) //returns promise
    .then((data) => {
      return data.user.getIdToken();
    })
    .then((token) => {
      return res.json({ token });
    })
    .catch((err) => {
      console.error(err);
      if (err.code === "auth/wrong-password") {
        return res
          .status(403)
          .json({ general: "Wrong credentials, please try again" });
      } else return res.status(500).json({ error: err.code });
    });
});

//here we are telling that the app on line 11 is the container for all the routes in the app- to make sure set up like this https://baseurl.com/api/ - make sure our api are at this url
exports.api = functions.https.onRequest(app); //instead of passing one route and one function, we just pass our app and it will automatically turn into different routes.

//by default firebase deploys to us-central1 region but by deploying to us-central region will slow down application in development- add latency on each request- using .region("europe-west1") will make sure next time we deploy it will be to that european zone
