//file just to write how data is gonna look like for reference - no implication on our code
//so you dont have to open firebase to reference

//*each time we get a Note we dont want to have to check the comments that have the id of string and count them and then return number because firebase charges you on the amount of reads that you do. So we need to minimize the amount of reads we execute each time a user sends a request so thats why we want to store the likecount and comment count here to get charged less

let db = {
  notes: [
    {
      userHandle: "user", //used to identify owner of eaech new note
      body: "this is notes body",
      createdAt: "2020-11-22T15:05:21.373Z", //ISO String
      likeCount: 5,
      commentCount: 2,
    },
  ],
};
