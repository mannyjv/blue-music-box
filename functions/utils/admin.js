//set up admin for FB
//intialize FB application
//creating of db variable

const admin = require("firebase-admin"); //-admin sdk this is nodejs code - not using import from
//to use admin we need to initialize application
admin.initializeApp(); //usually pass in an applicaiton but project already knows our applicaiton id. check .firebaserc file - gives us access to admin object
const db = admin.firestore(); //wherever we need firestore we just do "db." - replaces admin.firestore()

module.exports = { admin, db };
