const { admin } = require("./admin");

//writing a function that intercepts request and does something depending on what the request has and decides whether or not to proceed to handler or stop and send response (middleware) FBAuth = firebase authentication- so in any route where we add FBAuth as middleware, if we get past it then that means that the beggining block of code of that route then ther user has already been verified and authenticated and we have access to request.user- add this middleware whenever there is a protected route
module.exports = (req, res, next) => {
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
