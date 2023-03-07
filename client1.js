const axios = require('axios');


const postData1 = {
    
    "width":"150",
    "height":"97",
    "src":"C:/Users/Keus/Downloads/Pizigani_1367_Chart_10MB.jpg"   
};
const postData2 = {
  
    "width":500,
    "height":330,
    "left":120,
    "top":70,
    "src":"C:/Users/Keus/Downloads/Pizigani_1367_Chart_10MB.jpg"

};
const postData3 = {
    "format":"jpg",
    
    "src":"C:/Users/Keus/Downloads/image.png"
};
const postData4 = {
  
    "width":"150",
    "height":"97",
    "src":"C:/Users/Keus/Downloads/7132-cristal-3.jpg"   
};
const postData5 = {
  
    "width":"150",
    "height":"97",
    "src":"C:/Users/Keus/Downloads/dsc00430.jpg"   
};
const headerData1={
  "token":"FXmBawfLepALwT1NbDh3qR"
}

// Define an array of Axios post requests
const postRequests = [
  axios.post('http://localhost:3000/resize', postData1,{
    headers:headerData1
  }),
  axios.post('http://localhost:3000/crop', postData2,{
    headers:headerData1
  }),
  axios.post('http://localhost:3000/format', postData3,{
    headers:headerData1
  }),
  axios.post('http://localhost:3000/resize', postData4,{
    headers:headerData1
  }),
  axios.post('http://localhost:3000/resize', postData5,{
    headers:headerData1
  }),
];

// Execute the requests in parallel
Promise.all(postRequests)
  .then(responses => {
    // Handle the responses from all requests here
    console.log('All requests completed successfully:', responses);
  })
  .catch(error => {
    // Handle errors from any request here
    console.error('Error executing requests:', error);
  });