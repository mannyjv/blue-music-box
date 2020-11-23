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

exports.validateSignupData = (data) => {
  let errors = {}; //initalize errors object to be used to send errors during validation below- we will return all errors together

  //validate data - each field from newUser obj from above

  if (isEmpty(data.email)) {
    errors.email = "Must not be empty"; //assigning email property in error object above
  } else if (!isEmail(data.email)) {
    //if not a vaild email
    errors.email = "Must be a valid email address";
  }

  if (isEmpty(data.password)) errors.password = "Must not be empty";
  if (data.password !== data.confirmPassword)
    errors.confirmPassword = "Passwords must match";

  if (isEmpty(data.handle)) errors.handle = "Must not be empty";

  //here we make sure that we can continue if the errors obj is empty, if not we break and return a object with all the errors, and a boolean
  //make sure array of keys is not bigger than 0
  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false, //adding one new field to returned object, now we return the errors object in an object with a boolean on whether or not the inputed data is valid. If this property has a value of true then we should carry on with rest of code logic
  };
};

exports.validateLoginData = (data) => {
  let errors = {};

  //validations
  if (isEmpty(data.email)) errors.email = "Must not be empty";
  if (isEmpty(data.password)) errors.password = "Must not be empty";

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};
