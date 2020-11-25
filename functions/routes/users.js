const { db } = require("../utils/admin");
const config = require("../../secrets.js");
const firebase = require("firebase"); //require in firebase after installing
firebase.initializeApp(config); //initalize firebase app

const {
  validateSignupData,
  validateLoginData,
} = require("../utils/validators");

//sign-up route
exports.signup = (req, res) => {
  //extract form data from request body
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  };

  //sending newUser obj from above to validators
  const { valid, errors } = validateSignupData(newUser);
  if (!valid) return res.status(400).json(errors); //if data goes through validator func and returned object has a "valid" property of false then we send the errors obj inside that object.

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
};

//login routes
exports.login = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  //sending newUser obj from above to validators
  const { valid, errors } = validateLoginData(user);
  if (!valid) return res.status(400).json(errors); //if data goes through validator func and returned object has a "valid" property of false then we send the errors obj inside that object.

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
};
