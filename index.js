var express = require('express');
var router = express.Router();
var fs = require('fs');
const request = require('request');

router.get('/gettest', function(req, res) {
  console.log(req.query);
        var jsonresult = {"name":"Joseph Smith","story":"There was in the place where I lived, an unusual excitement on the subject of religion","father":"Joseph Smith Senior","mother":"Lucy Mac Smith"};
        res.status(200).json(jsonresult);
});
router.get('/request', function(req, res) {
  console.log("In Request");
  console.log(req.query);
  request('https://fhtl-api-prd.byu-dept-fhtl-prd.amazon.byu.edu',{ json: true }, (err, newres, body) => {
                if (err) { 
                console.log("Error");
                        return console.log(err); 
                }
        console.log("Worked");
                console.log(body);
                res.json(body);
  });
});
router.get('/familysearch', function(req, res) {
  console.log("In FamilySearch");
  console.log(req.query);
  request('https://integration.familysearch.org/platform/tree/current-person',{ json: true }, (err, newres, body) => {
                if (err) { 
                console.log("Error");
                        return console.log(err); 
                }
        console.log("Worked");
                console.log(body);
                res.json(body);
  });
});

module.exports = router;
