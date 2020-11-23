const { db } = require("../utils/admin"); //require db that is used in below route

//fetching posts from database - essentially a GET request
exports.getAllNotes = (req, res) => {
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
};

//creating/posting a note -new addition to db --essentially a POST request
exports.postOneNote = (req, res) => {
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
};
