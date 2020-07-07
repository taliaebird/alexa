//The following file contains functions that connect to external API's
var https = require('https');   //getting access to the secure https library
var fs = require('fs');
var qs = require('querystring');


//login information
//note this is for an integration account, found at
//    url: https://integration.familysearch.org/
const client_id = 'a023Z00000Xqz9nQAB';
const username = 'archiza';
const password = '123sorocaba';

//list of functions availble in index.js
module.exports = {
  httpGet,
  getVerification,
  getName,
  getParentID,
  getUserID,
}

///////////////////////////////
// Current Functions:
// httpGet
// getVerification
// getPerson
// getParent
// getUser
// getName
// getParentID
// getUserID
///////////////////////////////


////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////


function httpGet () {
  //purpose: connect to Dr. Clement Sample API, can later delete
  return new Promise(((resolve, reject) => {
    var options = {
        host: 'fhtl-api-prd.byu-dept-fhtl-prd.amazon.byu.edu',    
        path: '/',    
        method: 'GET',
    };
    
    const request = https.request(options, (response) => {
      response.setEncoding('utf8');
      let returnData = '';

      response.on('data', (chunk) => {
        returnData += chunk;
      });

      response.on('end', () => {
        resolve(JSON.parse(returnData));
      });

      response.on('error', (error) => {
        reject(error);
      });
    });
    request.end();
  }));
}


////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////


function getVerification() {
//purpose: connect to Family Search API to get accessToken
 //had to make promise or else didn't execute in order
 return new Promise(((resolve, reject) => {
    var options = {
      'method': 'POST',
      'hostname': 'identint.familysearch.org',
      'path': '/cis-web/oauth2/v3/token',
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      'maxRedirects': 20
    };
    var req = https.request(options, function (res) {
      var chunks = [];
    
      res.on("data", function (chunk) {
        chunks.push(chunk);
      });
      res.on("end", function (chunk) {
        var body = Buffer.concat(chunks);
        console.log('BODY?' + body.toString());     //logging correctly
        //resolve(body.toString());
        resolve(JSON.parse(body.toString()));     //we need this JSON.parse in order to correctly access the information
      });
      res.on("error", function (error) {
        console.error(error);
        resolve(error);
      });
    });
    var postData = qs.stringify({
      'client_id': client_id,
      'grant_type': 'password',
      'username': username,
      'password': password,
      'Content_Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    });
    
  req.write(postData);
  req.end();
  }));
}


////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////


function getPerson(pid, access_token) {
  //purpose: want to pass in credentials and personID (pid) and have it return information about the person
  //returns response with following format url: https://www.familysearch.org/developers/docs/api/types/json_Person_conclusion
  //var https = require('follow-redirects').https;
  
  return new Promise(((resolve, reject) => {
      var options = {
        'method': 'GET',
        'hostname': 'api-integ.familysearch.org',
        'path': `/platform/tree/persons/${pid}`,  //FIXME, need to have personID here
        'headers': {
          //'pid': pid,   //gets information given the personID
          'Accept': 'application/x-gedcomx-v1+json',
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        'maxRedirects': 20
      };
      
      var req = https.request(options, function (res) {
        var chunks = [];
      
        res.on("data", function (chunk) {
          chunks.push(chunk);
        });
      
        res.on("end", function (chunk) {
          var body = Buffer.concat(chunks);
          console.log('BODY?' + body.toString());
          resolve(JSON.parse(body.toString())); 
        });
      
        res.on("error", function (error) {
          console.error(error);
          reject(error);
        });
      });
      
      var postData = qs.stringify({
        'Content-Type': 'application/x-fs-v1+json',
        'Accept': 'application/json'
      });
      
      req.write(postData);
      
      req.end(); 
  }));
}


////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////


function getParent(pid, access_token) {
  //purpose: this gets the parent of the personID (pid)
  
  return new Promise(((resolve, reject) => {
    //var https = require('follow-redirects').https;
    //var fs = require('fs');
    
    var options = {
      'method': 'GET',
      'hostname': 'api-integ.familysearch.org',
      'path': `/platform/tree/persons/${pid}/parents?flag=fsh`,
      'headers': {
        'Content-Type': 'application/x-fs-v1+json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${access_token}`
      },
      'maxRedirects': 20
    };
    
    var req = https.request(options, function (res) {
      var chunks = [];
    
      res.on("data", function (chunk) {
        chunks.push(chunk);
      });
    
      res.on("end", function (chunk) {
        var body = Buffer.concat(chunks);
        console.log(body.toString());
        resolve(JSON.parse(body.toString()));
      });
    
      res.on("error", function (error) {
        console.error(error);
        resolve(error);   //FIXME, do I want this to be resolve or reject?
      });
    });
    
    req.end();
  }));
}


////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////


function getUser(access_token) {
  //purpose: this gets information about the user
  //FIXME, this might be a problem...
  
  //var https = require('follow-redirects').https;
  //var fs = require('fs');
  return new Promise(((resolve, reject) => {
  var options = {
    'method': 'GET',
    'hostname': 'api-integ.familysearch.org',
    'path': '/platform/users/current',
    'headers': {
      'Content-Type': 'application/x-fs-v1+json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${access_token}`
    },
    'maxRedirects': 20
  };
  
  var req = https.request(options, function (res) {
    var chunks = [];
  
    res.on("data", function (chunk) {
      chunks.push(chunk);
    });
  
    res.on("end", function (chunk) {
      var body = Buffer.concat(chunks);
      console.log(body.toString());
      resolve(JSON.parse(body.toString()));
    });
  
    res.on("error", function (error) {
      console.error(error);
      resolve(error); //FIXME, do I want this to be resolve or reject?
    });
  });
  
  req.end();
  }));
}
  
  
////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////


async function getName(pid, access_token) {
  //purpose: want to get person name, later should pass in personID (pid)
  console.log('PID?' + pid);  //logs pid
  
  const response = await getPerson(pid, access_token);  //calls the httpGetPerson function passing in pid
  console.log('POSTDATA?' + response);    //logging the response

  if(!response.errors) {  //if there are no errors
      console.log('POSTDATA?' + response['persons'][0]['display']['name']);       //['living']);
      return response['persons'][0]['display']['name']; //respond with the person's name
  }
  
  //404 error means the person was not found
  else if(response['errors'][0]['code'] === 404) {
    console.log('There was a 404 error.');
    return '404 error';
  }
  
  //401 error means the call was unauthorized
  else if(response['errors'][0]['code'] === 401) {
    console.log('There was a 401 error.');
    return '401 error';
  }
  
  else {    //FIXME, will later need to change depending on the error
      return 'error';
  }
}
   
   
////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////


async function getParentID(pid, access_token, parent_side) {
  //purpose: get the parent personID of the pid's parent
  console.log('In httpGetParentName Handler');
  const response = await getParent(pid, access_token);    //this makes the call to get the parents of the pid
  if(!response.errors) {  //if there are no errors
    if(parent_side === 'father') {
      return response['persons'][0]['id'];    //pid of the person's father
    }
    else {
      return response['persons'][1]['id'];    //pid of the person's mother
    }
  }
  //404 error means the person was not found
  else if(response['errors'][0]['code'] === 404) {
    console.log('There was a 404 error.');
    return '404 error';
  }
  //401 error means the call was unauthorized
  else if(response['errors'][0]['code'] === 401) {
    console.log('There was a 401 error.');
    return '401 error';
  }
  else {    //FIXME, will later need to change depending on the error
      return 'error';
  }
}
    
   
////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////


async function getUserID(access_token) {
  const response = await getUser(access_token);
  if (!response.errors) return response['users'][0]['personId'];
  else return 'error occured';
}


////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////


async function getInformation(pid, access_token) {  //WORK ON THIS SUCKER TMRW
  //purpose: want to get extra info about a particular person, called in ExploreThisHandler
  console.log('PID?' + pid);  //logs pid
  
  const response = await getPerson(pid, access_token);  //calls the httpGetPerson function passing in pid
  console.log('POSTDATA?' + response);    //logging the response

  if(!response.errors) {  //if there are no errors
      const person_name = response['persons'][0]['display']['name'];
      
      console.log('POSTDATA?' + response['persons'][0]['display']['name']);       //['living']);
      return response['persons'][0]['display']['name']; //respond with the person's name
  }
  
  //404 error means the person was not found
  else if(response['errors'][0]['code'] === 404) {
    console.log('There was a 404 error.');
    return '404 error';
  }
  
  //401 error means the call was unauthorized
  else if(response['errors'][0]['code'] === 401) {
    console.log('There was a 401 error.');
    return '401 error';
  }
  
  else {    //FIXME, will later need to change depending on the error
      return 'error';
  }
}
