const Alexa = require('ask-sdk-core');  
const AWS = require('aws-sdk');
const API = require('apicalls');    //importing API functions from apicalls.js

//Waiting on family search for certification key, currently set up and will go to amazon alexa

///////////////////////////////
// Current Handlers:
// LaunchRequestHandler
// SetNameHandler
// ExploreHandler
// ExploreParentHandler
// GoBackHandler
// ExploreThisHandler
// GetMemoryHandler
// GetTempleNamesHandler
// ForwardPathHandler
// ReversePathHandler
// GetFeaturesHandler
// LinkAccountHandler
// HelpHandler
// YesHandler
// NoHandler
// TestAPIHandler
// CancelAndStopHandler
// SessionEndedRequestHandler
// ErrorHandler
///////////////////////////////


///////////////////////////////
// Session Attributes:
// y_n_case: remembers what the user is responding yes/no to
// have_account: remembers during the session if the user has a family search account
// user_name: remembers the user's name, NOTE WILL LATER MOVE THIS TO A PERSISTANT ATTRIBUTE
// current_person: remembers which person they want to explore/are on, originally want to set to user
// generation: remembers which generation they are on, starting with 0
// parent_side: remembers if we are on their mother or father's side
// id_stack: stack that remembers the id's of the explored path
// m_f_stack: stack remembers the mother/father of the explored path, includes 'me'
// access_token: this keeps the access token
///////////////////////////////

///////////////////////////////
//This is the code that I (Kevin) just added (delete this comment):
//Another (working) way of using dynamoDB
Alexa.dynamoDBTableName = 'Family Search Alexa'; //What do we want the table to be named?

function updateAttributes(handlerInput) {
  if (!this.attributes) {
    //If the database has no attributes (first time)
    this.attributes = { //Create the attributes (I did not know what format to do so I did the following: )
      'person': {
        'name': '',
        'account': {
          'username': '',
          'password': ''
        }
      }
    };
    
    //The structure of the database is:
      //.person
        //.name
        //.account
          //.username
          //.password
    
    //so if I wanted the username I would do .person.account.username (ex. sessionAttributes.person.account.username)
    
    handlerInput.attributesManager.setSessionAttributes(this.attributes); //initalizes the session attributes
    return false; //returns false because the database did not have any atributes (first time)
  }
  else if (!handlerInput.attributesManager.getSessionAttributes().person) {
    //the database has attributes, but the session attributes have not been initalized
    handlerInput.attributesManager.setSessionAttributes(this.attributes); //initializes the session attributes to the attributes in the database
  }
  else {
    //the database has attributes and the session attributes are initalized
    this.attributes = handlerInput.attributesManager.getSessionAttributes(); //updates the attributets in the database by setting them equal to the session attributes
  }
  
  return true; //returns true because the database had attributes (not first time)
}

////////////////////////////////////////////////////////////////////////////////

const LaunchRequestHandler = {
  //purpose: this handler will operate when the user opens our skill
  
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  
  async handle(handlerInput) {
    console.log('In LaunchRequestHandler');
   
    //need to implement and if statement if it the user's first time
    var sessionAttributes = handlerInput.attributesManager.getSessionAttributes();  //gets the session's attributes, NOT YET IMPLEMENTED, DYNAMO DB, FIXME
    sessionAttributes.y_n_case = 'none';    //we will use this in our yes/no intent handlers, we use it to identify what the user is responding to
    //sessionAttributes.have_account = 'na';
    sessionAttributes.current_person = 'none';
    sessionAttributes.generation = 0;
    sessionAttributes.parent_side = 'na';
    sessionAttributes.id_stack = [];    //person identifier stack, only used in session
    sessionAttributes.m_f_stack = [];   //mother/father stack, only used in session
    sessionAttributes.access_token = '';
    
    //const { accessToken } = handlerInput.requestEnvelope.context.System.user; //this should be empty is the user does not have an account linked
    var speak_output = '';
    var reprompt_output = '';
        //Another way of working the database
    var attributes;
    
    if(!updateAttributes(handlerInput)) { //creates the database if not created and initalizes the session attributes
                                            //should I add a case where the database is created but the user does not have a name
                                            //(in case the user quit the program prematurely)?
                                            //e.g. !updateAttributes(handlerInput) || handlerInput.attributesManager.getSessionAttributes().name === ''
      //This code executes if it is the user's first time
      speak_output = 'Welcome to BYU Family History. You can ask me things like explore my family tree, ' +
      'tell me a story about my ancestors, and do I have any temple names? To get started, what name would you like me to call you.';
      reprompt_output = 'Welcome to BYU Family History. What name would you like me to call you.';
    }
    else {
      attributes = handlerInput.attributesManager.getSessionAttributes();  //gets the session's attributes
      
      /*if(!accessToken) {  //attributes.person.account.username === '') {  //this changes depending on how we set up account verification
        //the person is returning and has not set up his/her account
        speak_output = 'Welcome back ' + attributes.person.name + '. Would you like to set up your account now?';
        reprompt_output = 'Would you like to set up your account now?';
        attributes.y_n_case = 'existing account';   //this clarifies we are looking to set up user account
      }
      else {*/
        //the person is returning and has set up his/her account
        speak_output = 'Welcome to BYU Family History. What can I help you find today, ' + attributes.person.name + '?';
        reprompt_output = 'Welcome to BYU Family History. You can ask me things like tell me something about my ancestors.';
      }
    //}
    
    //FIXME, later we will want to fix this so only works if we have the login info
    //FIXME, later will need to account for errors in getting
    
    const response = await API.getVerification();
    //an error occured when we were trying to verify, we need to figure out how we want to handle this (in this hander or in another)
    if(response.errors || response.error) {
      console.log('ERROR ' + response.error);
      
    }
    else sessionAttributes.access_token = response.access_token;
    //console.log('SESSION?' + sessionAttributes.access_token);
    
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes); //new line
    return handlerInput.responseBuilder
      .speak(speak_output)
      .reprompt(reprompt_output)  //if the user fails to respond, Alexa will ask them this question
      .getResponse();
    
  },
};


////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////


const SetNameHandler = {
  //purpose: this intitally sets the user's name
  
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'set_name';
  },
  handle(handlerInput) {
    console.log('In SetNameHandler');
    
    //the following lines of code save the name in global variable 'user_name', later will need to save with Dynamo DB
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();    //this was a const, need to check if it changes anything
    const user_name = handlerInput.requestEnvelope.request.intent.slots.name.value; 
    const { accessToken } = handlerInput.requestEnvelope.context.System.user; //this should be empty is the user does not have an account linked
    
    let speak_output = '';
    let reprompt_output = '';
    
    //the user does not have an account set up
    if(!accessToken) {
      //we need to check if the user has an existing family search account
      if(sessionAttributes.have_account === undefined || sessionAttributes.have_account === '' || sessionAttributes.have_account === 'na') {
        sessionAttributes.y_n_case = 'existing account';   //this clarifies we are looking to set up user account
        speak_output = `I will remember your name is ${user_name}. Now lets connect to your family search account. Yes or no, do you have an existing account on familysearch.org?`;
        reprompt_output = 'Do you have an existing Family Search account?';
      }
      //the user has an existing family search account
      else if(sessionAttributes.have_account === 'yes') {
        speak_output = `I will remember your name is ${user_name}. Would you like to set up your account now?`;
        reprompt_output = 'Would you like to set up your account now?';
        sessionAttributes.y_n_case = 'set up account';    //sessionAttributes was const so this wasn't updating, should work now
      }
      //the user does not have an existing family search account
      else {  //sessionAttributes.have_account === 'no'
        speak_output =  `I will remember your name is ${user_name}. To access additional features, you will need to create an account at familysearch.org.`;
        reprompt_output = `Before you can access additional features, you will need to create a family search account at familysearch.org.`;
      }
      //Another way to update the user's name and store it in the database
      
    }
    
    //the user has an account set up and connected
    else {
      speak_output = `Okay, I will remember your name is ${user_name}.`;
      reprompt_output = 'Is there anything else I can help you with today?';
      sessionAttributes.y_n_case = 'anything else';   //this clarifies we are asking the user has something else they want
    }
    
    sessionAttributes.person.name = user_name; //stores the person's name in the copy of the session attributes
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes); //saves the copy of the session attributes to the session attributes
    updateAttributes(handlerInput); //updates the database (the database is updated to match the session attributes, hench the need to save the session attributes first)
      
    return handlerInput.responseBuilder
      .speak(speak_output)
      .reprompt(reprompt_output)
      .getResponse();
  },
};


////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////


const ExploreHandler = {
  //purpose: this handler initiates the user exploring their family tree
  
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'explore_tree';
  },
  
  async handle(handlerInput) {    //needs to be async or else won't work
    console.log('In ExploreHandler');
    
    //const { accessToken } = handlerInput.requestEnvelope.context.System.user; //this should be empty is the user does not have an account linked,  FIXME linked to amazon
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();  //gets the session's attributes
    //resetting session attributes
    sessionAttributes.current_person = 'none';
    sessionAttributes.generation = 0;
    sessionAttributes.parent_side = 'na';
    
    sessionAttributes.id_stack = [];    //person identifier stack, only used in session
    sessionAttributes.m_f_stack = [];   //mother/father stack, only used in session
    
    var speak_output = '';
    var reprompt_output = '';
  
  //i'd love to have a function that does this and deals with it all
  //for now, we are going to assume the user has their account set up
  /*
    //user has set up no info, including name
    if(!sessionAttributes.person.name) {
      speak_output = 'Sorry. You will need to set up your account first. What name would you like me to call you?';
      reprompt_output = speak_output;
    }
    
    //user saved a name but hasn't set up their account yet
    else if(!accessToken) {
      const user_name = sessionAttributes.person.name;
      //we need to check if the user has an existing family search account
      if(sessionAttributes.have_account === undefined || sessionAttributes.have_account === '' || sessionAttributes.have_account === 'na') {
        speak_output = `Sorry ${user_name}. Before you can use BYU Family History Alexa features you will need to link a Family Search account. Yes or no. Do you have an existing account on familysearch.org?`; //Maybe fix this?
        reprompt_output = 'Yes or no. Do you have an existing Family Search account?';
        sessionAttributes.y_n_case = 'existing account';   //this clarifies we are looking to set up user account
      }
      //the user has an existing family search account
      else if(sessionAttributes.have_account === 'yes') {
        speak_output = `Sorry ${user_name}, before you can use BYU Family History Alexa features you will need to link your Family Search account. Would you like to set up your account now?`;
        reprompt_output = 'Would you like to set up your account now?';
        sessionAttributes.y_n_case = 'set up account';
      }
      //the user does not have an existing family search account
      else {  //sessionAttributes.have_account === 'no'
        speak_output =  `Sorry ${user_name}. To access additional features, you will need to create an account at familysearch.org.`;
        reprompt_output = `Before you can access additional features, you will need to create a family search account at familysearch.org.`;
      }
    }
    
    //assuming the user has set up their account, FIXME starting with Joseph Smith
    else { */
      //getting response from function, will later need to update this function to allow us to pass in a personID
      //const response = await API.httpGet();   //don't forget the async or else won't work
      //console.log(response);
      //console.log('IN ET SA?' + sessionAttributes.access_token);
      
      var response = await API.getUserID(sessionAttributes.access_token);   //this returns the user's pid

      sessionAttributes.current_person = response;    //making the current person the user's pid
      
      speak_output = `Would you like to explore your mother or father's side.`;
      reprompt_output = speak_output;
      
    //}
    return handlerInput.responseBuilder
      .speak(speak_output)
      .reprompt(reprompt_output)
      .getResponse();
  },
};


////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////


const ExploreParentHandler = {
  //purpose: this handler initiates the user exploring their family tree
  
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'explore_parent';
  },
  
  async handle(handlerInput) {    //needs to be async or else won't work
    console.log('In ExploreParentHandler');
    
    //const { accessToken } = handlerInput.requestEnvelope.context.System.user; //this should be empty is the user does not have an account linked,  FIXME linked to amazon
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();  //gets the session's attributes
    var speak_output = '';
    var reprompt_output = '';
  
  /*
    //user has set up no info, including name
    if(!sessionAttributes.person.name) {
      speak_output = 'Sorry. You will need to set up your account first. What name would you like me to call you?';
      reprompt_output = speak_output;
    }
    
    //user saved a name but hasn't set up their account yet
    else if(!accessToken) {
      const user_name = sessionAttributes.person.name;
      //we need to check if the user has an existing family search account
      if(sessionAttributes.have_account === undefined || sessionAttributes.have_account === '' || sessionAttributes.have_account === 'na') {
        speak_output = `Sorry ${user_name}. Before you can use BYU Family History Alexa features you will need to link a Family Search account. Yes or no. Do you have an existing account on familysearch.org?`; //Maybe fix this?
        reprompt_output = 'Yes or no. Do you have an existing Family Search account?';
        sessionAttributes.y_n_case = 'existing account';   //this clarifies we are looking to set up user account
      }
      //the user has an existing family search account
      else if(sessionAttributes.have_account === 'yes') {
        speak_output = `Sorry ${user_name}, before you can use BYU Family History Alexa features you will need to link your Family Search account. Would you like to set up your account now?`;
        reprompt_output = 'Would you like to set up your account now?';
        sessionAttributes.y_n_case = 'set up account';
      }
      //the user does not have an existing family search account
      else {  //sessionAttributes.have_account === 'no'
        speak_output =  `Sorry ${user_name}. To access additional features, you will need to create an account at familysearch.org.`;
        reprompt_output = `Before you can access additional features, you will need to create a family search account at familysearch.org.`;
      }
    }
    
    //assuming the user has set up their account, FIXME starting with Joseph Smith (and only Joseph Smith)
    else { */
    
    //FIXME, for now, I want to assume the user had their account setup and everything is working
    
      //getting response from function, will later need to update this function to allow us to pass in a personID
      
      const prev_person = sessionAttributes.current_person; //pid of the previous person
      var parent = '';  //will either be mother or father, used in output
     
      //const response = await API.httpGet();   //don't forget the async or else won't work
      //console.log(response);
      //add update which generation
      var parentID = '';
      sessionAttributes.id_stack.push(prev_person);     //adding the previous person to id stack
      
       
      if(!handlerInput.requestEnvelope.request.intent.slots.mother.value) { //no mother (so retriving father)
        parentID = await API.getParentID(prev_person, sessionAttributes.access_token, 'father');  //getting pid of the father
        sessionAttributes.current_person = parentID;    //updating the current person to father's pid
        parent = 'father';
      }
      else {  //mother
        parentID = await API.getParentID(prev_person, sessionAttributes.access_token, 'mother');    //getting pid of the mother
        sessionAttributes.current_person = parentID;    //updating the current person to the mother's pid
        parent = 'mother';
      }
      
      if(sessionAttributes.generation === 0 || !sessionAttributes.generation) {  //first mother/father call, want to set mother/father side
          sessionAttributes.parent_side = parent;
          sessionAttributes.m_f_stack.push('me');     //adding 'me' to the mother/father stack
      }
      
      sessionAttributes.m_f_stack.push(parent);   //adding the mother/father (includes current person) on stack
      sessionAttributes.generation = sessionAttributes.generation + 1; //increment up a generation
      const parent_name = await API.getName(parentID, sessionAttributes.access_token); //get the name of the parent using their pid
      
      if (sessionAttributes.generation === 1) {
        speak_output = `Your ${parent}'s name is ${parent_name}. Would you like to explore this person, or their mother or father.`;
      }
      else if(sessionAttributes.generation === 2) {
        speak_output = `Your grand${parent} on your ${sessionAttributes.parent_side}'s side is ${parent_name}. Would you like to explore this person, or their mother or father.`
      }
      else {
        if (sessionAttributes.generation <= 5) {      //we want to cap the 'great's at three, ex. your great great great grandmother
          var great = '';   //this variable holds the 'great's we need
          //iterates through to see how many we need
          for(let i = 0; i < (sessionAttributes.generation - 2); i++) {   //needs two less than the generation we are on
            great = great + 'great ';
          }
          speak_output = `Your ${great}grand${parent} on your ${sessionAttributes.parent_side}'s side is ${parent_name}. Would you like to explore this person, or their mother or father.`
        }
        else if (sessionAttributes.generation <= 17) {    //currently capping it at going back 17 generations, can add more if we would like
          const num_of_greats = sessionAttributes.generation - 2;   //keeps track of the number of greats, not the generation
          var great_replacement = '';     //keeps track of the word we want to replace 'great great ...' with, ex. seventh
          if(num_of_greats === 4) great_replacement = 'fourth';
          else if(num_of_greats === 5) great_replacement = 'fifth';
          else if(num_of_greats === 6) great_replacement = 'sixth';
          else if(num_of_greats === 7) great_replacement = 'seventh';
          else if(num_of_greats === 8) great_replacement = 'eigth';
          else if(num_of_greats === 9) great_replacement = 'ninth';
          else if(num_of_greats === 10) great_replacement = 'tenth';
          else if(num_of_greats === 11) great_replacement = 'eleventh';
          else if(num_of_greats === 12) great_replacement = 'twelfth';
          else if(num_of_greats === 13) great_replacement = 'thirteenth';
          else if(num_of_greats === 14) great_replacement = 'fourteenth';
          else great_replacement = 'fifthteenth';
          speak_output  = `Your ${great_replacement} great grand${parent} on your ${sessionAttributes.parent_side}'s side is ${parent_name}. Would you like to explore this person, or their mother or father.`;
        }
        else  {   //if the user goes back 18 or more generations, we will simply tell them how many generations they are back 
          speak_output = `You are currently back ${sessionAttributes.generation} generations on your ${sessionAttributes.parent_side}'s side. The current person is ${parent_name}. Would you like to explore this person, or their mother or father.`;
        }
      }
      reprompt_output = speak_output;
      
    //}
    return handlerInput.responseBuilder
      .speak(speak_output)
      .reprompt(reprompt_output)
      .getResponse();
  },
};



////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////


const GoBackHandler = {
  //purpose: navigates back one in family tree
  
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'go_back';
  },
  
  async handle(handlerInput) {  //need the async for the api call
    console.log('In GoBackHandler');
    //const { accessToken } = handlerInput.requestEnvelope.context.System.user; //this should be empty is the user does not have an account linked
    
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();  //gets the session's attributes
    var speak_output = '';
    var reprompt_output = '';
  /*
    //user hasn't provided any info
    if(!sessionAttributes.person.name) {
      speak_output = 'Sorry. You will need to set up your account first. What name would you like me to call you?';
      reprompt_output = speak_output;
    }
    
    //user saved a name, but hasn't set up their account
    else if(!accessToken) {
      const user_name = sessionAttributes.person.name;
      //we need to check if the user has an existing family search account
      if(sessionAttributes.have_account === undefined || sessionAttributes.have_account === '' || sessionAttributes.have_account === 'na') {
        speak_output = `Sorry ${user_name}. Before you can use BYU Family History Alexa features you will need to link a Family Search account. Yes or no. Do you have an existing account on familysearch.org?`;
        reprompt_output = 'Yes or no. Do you have an existing Family Search account?';
        sessionAttributes.y_n_case = 'existing account';   //this clarifies we are looking to set up user account
      }
      //the user has an existing family search account
      else if(sessionAttributes.have_account === 'yes') {
        speak_output = `Sorry ${user_name}, before you can use BYU Family History Alexa features you will need to link your Family Search account. Would you like to set up your account now?`;
        reprompt_output = 'Would you like to set up your account now?';
        sessionAttributes.y_n_case = 'set up account';
      }
      //the user does not have an existing family search account
      else {  //sessionAttributes.have_account === 'no'
        speak_output =  `Sorry ${user_name}. To access additional features, you will need to create an account at familysearch.org.`;
        reprompt_output = `Before you can access additional features, you will need to create a family search account at familysearch.org.`;
      }
    }
    
    //assuming the user has set up their account, FIXME
    else { */
      //if user is trying to go back when they haven't gone anywhere
      var response = '';
      
      if(sessionAttributes.generation === 0) {
        //if going back to original position, we need to remember to change current person to the user
        response = await API.getUserID(sessionAttributes.access_token);   //getting the user pid
        sessionAttributes.current_person = response;    //making user pid current person
        
        speak_output = 'You have gone back to start. Would you like to explore your mother or father\'s side.';
      }
      //going back to original start position
      else if(sessionAttributes.generation === 1) {
        sessionAttributes.generation = sessionAttributes.generation - 1;    //updating user's position
        sessionAttributes.id_stack.pop();     //removes the user's mother or father pid from the id stack
        sessionAttributes.m_f_stack.pop();    //removes the user 'mother' or 'father' from the mother/father stack
        sessionAttributes.m_f_stack.pop();    //removes 'me' from the mother/father stack
        
        //if going back to original position, we need to remember to change current person to the user
        response = await API.getUserID(sessionAttributes.access_token);   //getting the user pid
        sessionAttributes.current_person = response;    //making user pid current person
        
        speak_output = 'Going back to start. Would you like to explore your mother or father\'s side.';
      }
      else {
        sessionAttributes.generation = sessionAttributes.generation - 1;
        var prev_ID = sessionAttributes.id_stack.pop();    //removing user from the stack saving as prev pid
        sessionAttributes.m_f_stack.pop();    //removes 'mother' or 'father' from the mother/father stack
        sessionAttributes.current_person = prev_ID; //resetting the position to the previous pid
        
        const prev_name = await API.getName(prev_ID, sessionAttributes.access_token); //get the name of the parent using their pid
        speak_output = `Going back to ${prev_name}. Would you like to explore their mother or father\'s side.`;
      }
      
      reprompt_output = speak_output; //setting reprompt to same as speak
    //}
    
    return handlerInput.responseBuilder
      .speak(speak_output)
      .reprompt(reprompt_output)
      .getResponse();
  },
};


////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////

//FIXME, fix this handler
const ExploreThisHandler = {
  //purpose: allows user to explore this person in family tree
  
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'explore_this';
  },
  //FIXMEFIXMEFIXMEFIXMEFIXME you have to open explore this thing
  async handle(handlerInput) {
    console.log('In GoBackHandler');
    //const { accessToken } = handlerInput.requestEnvelope.context.System.user; //this should be empty is the user does not have an account linked
    
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();  //gets the session's attributes
    var speak_output = '';
    var reprompt_output = '';
  /*  
    //user hasn't provided any info
    if(!sessionAttributes.person.name) {
      speak_output = 'Sorry. You will need to set up your account first. What name would you like me to call you?';
      reprompt_output = speak_output;
    }
    
    //user saved a name, but hasn't set up their account
    else if(!accessToken) {
      const user_name = sessionAttributes.person.name;
      //we need to check if the user has an existing family search account
      if(sessionAttributes.have_account === undefined || sessionAttributes.have_account === '' || sessionAttributes.have_account === 'na') {
        speak_output = `Sorry ${user_name}. Before you can use BYU Family History Alexa features you will need to link a Family Search account. Yes or no. Do you have an existing account on familysearch.org?`;
        reprompt_output = 'Yes or no. Do you have an existing Family Search account?';
        sessionAttributes.y_n_case = 'existing account';   //this clarifies we are looking to set up user account
      }
      //the user has an existing family search account
      else if(sessionAttributes.have_account === 'yes') {
        speak_output = `Sorry ${user_name}, before you can use BYU Family History Alexa features you will need to link your Family Search account. Would you like to set up your account now?`;
        reprompt_output = 'Would you like to set up your account now?';
        sessionAttributes.y_n_case = 'set up account';
      }
      //the user does not have an existing family search account
      else {  //sessionAttributes.have_account === 'no'
        speak_output =  `Sorry ${user_name}. To access additional features, you will need to create an account at familysearch.org.`;
        reprompt_output = `Before you can access additional features, you will need to create a family search account at familysearch.org.`;
      }
    }
    
    //assuming the user has set up their account, FIXME FIXME FIXME later need to add multiple if/else depending on whether user is alive etc.
    else {*/  //FIXME, for now assuming everything is right
      var person_name = '';
      //if user is trying to ask for information about themself
      if(sessionAttributes.generation === 0 || !sessionAttributes.generation) {
        speak_output = `Sorry. You can only explore information about user's in your family tree. Would you like to explore your mother or father's side?`;
        var response = await API.getUserID(sessionAttributes.access_token);   //getting the user pid
        sessionAttributes.current_person = response;    //making user pid current person
      }
      
      else if (sessionAttributes.generation === 1) {
        person_name = await API.getName(sessionAttributes.current_person, sessionAttributes.access_token);
        speak_output = `Your ${sessionAttributes.m_f_stack[1]}'s name is ${person_name}. They were born on... married to...`;
      }
      else if(sessionAttributes.generation === 2) {
        person_name = await API.getName(sessionAttributes.current_person, sessionAttributes.access_token);
        speak_output = `${person_name} is your grand${sessionAttributes.m_f_stack[2]} on your ${sessionAttributes.parent_side}'s side. They were born on ...married to...`
      }
      else {
        person_name = await API.getName(sessionAttributes.current_person, sessionAttributes.access_token);
        if (sessionAttributes.generation <= 5) {      //we want to cap the 'great's at three, ex. your great great great grandmother
          var great = '';   //this variable holds the 'great's we need
          //iterates through to see how many we need
          for(let i = 0; i < (sessionAttributes.generation - 2); i++) {   //needs two less than the generation we are on
            great = great + 'great ';
          }
          speak_output = `${person_name} is your ${great}grand${sessionAttributes.m_f_stack[sessionAttributes.generation]} on your ${sessionAttributes.parent_side}'s side. They were born on... died on... married in...`;
        }
        else if (sessionAttributes.generation <= 17) {    //currently capping at 17 generations, can later add more
          const num_of_greats = sessionAttributes.generation - 2;   //keeps track of the number of greats, not the generation
          var great_replacement = '';     //keeps track of the word we want to replace 'great great ...' with, ex. seventh
          if(num_of_greats === 4) great_replacement = 'fourth';
          else if(num_of_greats === 5) great_replacement = 'fifth';
          else if(num_of_greats === 6) great_replacement = 'sixth';
          else if(num_of_greats === 7) great_replacement = 'seventh';
          else if(num_of_greats === 8) great_replacement = 'eigth';
          else if(num_of_greats === 9) great_replacement = 'ninth';
          else if(num_of_greats === 10) great_replacement = 'tenth';
          else if(num_of_greats === 11) great_replacement = 'eleventh';
          else if(num_of_greats === 12) great_replacement = 'twelfth';
          else if(num_of_greats === 13) great_replacement = 'thirteenth';
          else if(num_of_greats === 14) great_replacement = 'fourteenth';
          else great_replacement = 'fifthteenth';
          speak_output  = `${person_name} is your ${great_replacement} great grand${sessionAttributes.m_f_stack[sessionAttributes.generation]} on your ${sessionAttributes.parent_side}'s side. They were born on... died on... married in...`;
        }
        else  {   //for 18 or more generations, we will simply say how many generations we have gone back
          speak_output = `You are currently back ${sessionAttributes.generation} generations on ${person_name}. They were born on... died on... married in...`;
        }
      }
      reprompt_output = speak_output;
      
    //}

    return handlerInput.responseBuilder
      .speak(speak_output)
      .reprompt(reprompt_output)
      .getResponse();
  },
};


////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////


const GetMemoryHandler = {
  //purpose: this handler gives the user a story/fact about their ancestors
  
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'get_memory';
  },
  
  handle(handlerInput) {
    console.log('In GetMemoryHandler');
    const { accessToken } = handlerInput.requestEnvelope.context.System.user; //this should be empty is the user does not have an account linked
    
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();  //gets the session's attributes
    var speak_output = '';
    var reprompt_output = '';
    
    //user has not set up any info
    if(!sessionAttributes.person.name) {
      speak_output = 'Sorry. You will need to set up your account first. What name would you like me to call you?';
      reprompt_output = speak_output;
    }
    
    //user saved a name, but hasn't set up their account
    else if(!accessToken) {
      const user_name = sessionAttributes.person.name;
      //we need to check if the user has an existing family search account
      if(sessionAttributes.have_account === undefined || sessionAttributes.have_account === '' || sessionAttributes.have_account === 'na') {
        speak_output = `Sorry ${user_name}. Before you can use BYU Family History Alexa features you will need to link a Family Search account. Yes or No. Do you have an existing account on familysearch.org?`;
        reprompt_output = 'Yes or no. Do you have an existing Family Search account?';
        sessionAttributes.y_n_case = 'existing account';   //this clarifies we are looking to set up user account
      }
      //the user has an existing family search account
      else if(sessionAttributes.have_account === 'yes') {
        speak_output = `Sorry ${user_name}, before you can use BYU Family History Alexa features you will need to link your Family Search account. Would you like to set up your account now?`;
        reprompt_output = 'Would you like to set up your account now?';
        sessionAttributes.y_n_case = 'set up account';
      }
      //the user does not have an existing family search account
      else {  //sessionAttributes.have_account === 'no'
        speak_output =  `Sorry ${user_name}. To access additional features, you will need to create an account at familysearch.org.`;
        reprompt_output = `Before you can access additional features, you will need to create a family search account at familysearch.org.`;
      }
    }
    
    //assuming the user has set up their account, FIXME
    else {
      const user_name = sessionAttributes.person.name;
      speak_output = `Sorry ${user_name}. The story feature is still in development.`;
      reprompt_output = 'The story feature is still in development.';
    }
    
    return handlerInput.responseBuilder
      .speak(speak_output)
      .reprompt(reprompt_output)
      .getResponse();
  },
};


////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////


const GetTempleNamesHandler = {
  //purpose: this handler informs users of any available temple work they have, tell them how many, reads off the names, etc.
  
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'get_temple_names';
  },
  
  handle(handlerInput) {
    console.log('In GetTempleNamesHandler');
    const { accessToken } = handlerInput.requestEnvelope.context.System.user; //this should be empty is the user does not have an account linked
    
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();  //gets the session's attributes
    var speak_output = '';
    var reprompt_output = '';
    
    //user has not set up any info
    if(!sessionAttributes.person.name) {
      speak_output = 'Sorry. You will need to set up your account first. What name would you like me to call you?';
      reprompt_output = speak_output;
    }
    
    //user saved a name, but hasn't set up their account
    else if(!accessToken) {
      const user_name = sessionAttributes.person.name;
      //we need to check if the user has an existing family search account
      if(sessionAttributes.have_account === undefined || sessionAttributes.have_account === '' || sessionAttributes.have_account === 'na') {
        speak_output = `Sorry ${user_name}. Before you can use BYU Family History Alexa temple names feature, you will need to link a Family Search account. Yes or no. Do you have an existing account on familysearch.org?`;
        reprompt_output = 'Yes or no. Do you have an existing Family Search account?';
        sessionAttributes.y_n_case = 'existing account';   //this clarifies we are looking to set up user account
      }
      //the user has an existing family search account
      else if(sessionAttributes.have_account === 'yes') {
        speak_output = `Sorry ${user_name}, before you can use BYU Family History Alexa temple names feature, you will need to link your Family Search account. Would you like to set up your account now?`;
        reprompt_output = 'Would you like to set up your account now?';
        sessionAttributes.y_n_case = 'set up account';
      }
      //the user does not have an existing family search account
      else {  //sessionAttributes.have_account === 'no'
        speak_output =  `Sorry ${user_name}. To access additional features, you will need to create an account at familysearch.org.`;
        reprompt_output = `Before you can access additional features, you will need to create a family search account at familysearch.org.`;
      }
    }
    
    //assuming the user has set up their account, FIXME
    else {
      const user_name = sessionAttributes.person.name;
      speak_output = `Sorry ${user_name}. The temple work feature is still in development.`;
      reprompt_output = 'The temple work feature is still in development. Unable to access family names.';
    }
    
    return handlerInput.responseBuilder
      .speak(speak_output)
      .reprompt(reprompt_output)
      .getResponse();
  },
};


////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////


const ForwardPathHandler = {
  //purpose: this handler gives the forward path, going from user to the current person
  //uses the m_f_stack
  
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'forward_path';
  },
  
  async handle(handlerInput) {
    console.log('In ForwardPathHandler');
    //const { accessToken } = handlerInput.requestEnvelope.context.System.user; //this should be empty is the user does not have an account linked
    
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();  //gets the session's attributes
    var speak_output = '';
    var reprompt_output = '';
    /*
    //user has not set up any info
    if(!sessionAttributes.person.name) {
      speak_output = 'Sorry. You will need to set up your account before you can get path information. What name would you like me to call you?';
      reprompt_output = speak_output;
    }
    
    //user saved a name, but hasn't set up their account
    else if(!accessToken) {
      const user_name = sessionAttributes.person.name;
      //we need to check if the user has an existing family search account
      if(sessionAttributes.have_account === undefined || sessionAttributes.have_account === '' || sessionAttributes.have_account === 'na') {
        speak_output = `Sorry ${user_name}. Before you can get path information, you will need to link a Family Search account. Yes or no. Do you have an existing account on familysearch.org?`;
        reprompt_output = 'Yes or no. Do you have an existing Family Search account?';
        sessionAttributes.y_n_case = 'existing account';   //this clarifies we are looking to set up user account
      }
      //the user has an existing family search account
      else if(sessionAttributes.have_account === 'yes') {
        speak_output = `Sorry ${user_name}, before you can get path information, you will need to link your Family Search account. Would you like to set up your account now?`;
        reprompt_output = 'Would you like to set up your account now?';
        sessionAttributes.y_n_case = 'set up account';
      }
      //the user does not have an existing family search account
      else {  //sessionAttributes.have_account === 'no'
        speak_output =  `Sorry ${user_name}. To access additional features, you will need to create an account at familysearch.org.`;
        reprompt_output = `Before you can access additional features, you will need to create a family search account at familysearch.org.`;
      }
    }
    
    //assuming the user has set up their account
    else {*/
      //the user has not gone anywhere, current_person is themselves or empty
      if (sessionAttributes.generation === 0 || !sessionAttributes.generation) {  
        speak_output = 'You do no have a current path. In order to get started on a path, you can say \'explore family tree\'';
        reprompt_output = speak_output;
      }
      //the user is currently on their parent
      else if (sessionAttributes.generation === 1) {  
        const parent_name = await API.getName(sessionAttributes.current_person, sessionAttributes.access_token);  //getting the name of the person
        speak_output = `The current person is your ${sessionAttributes.parent_side}, ${parent_name}.`;
        reprompt_output = 'If you would like to hear the forward path again, say \'forward path\'';
      }
      //the user is back multiple generations
      else {  
        //an error check, should always be longer than these values if it goes to this case
        if(sessionAttributes.id_stack.length < 2 || sessionAttributes.m_f_stack.length < 3) {
          return handlerInput.responseBuilder
          .speak('Something went wrong. Please say \'exit\' and try again')
          .reprompt('Something went wrong. Please say \'exit\' and try again')
          .getResponse();
        }
        //initial speak_output
        var person_name = await API.getName(sessionAttributes.id_stack[1], sessionAttributes.access_token);   //getting person name from stack pid
        speak_output = `Starting on your ${sessionAttributes.parent_side}'s side is ${person_name}. ${person_name}'s ${sessionAttributes.m_f_stack[2]} is `;
        
        //iterating through generations
        for(let i = 2; i < sessionAttributes.id_stack.length; i++) {    //starting at their parent, not them
          person_name = await API.getName(sessionAttributes.id_stack[i], sessionAttributes.access_token);   //getting person name from stack pid
          speak_output = speak_output + `${person_name}. ${person_name}'s ${sessionAttributes.m_f_stack[i+1]} is `
        }
        //finally arrived at current_person
        person_name = await API.getName(sessionAttributes.current_person, sessionAttributes.access_token);  //getting person name from pid
        speak_output = speak_output + `the current person, ${person_name}.`;
        reprompt_output = 'If you would like to hear the forward path again, say \'forward path\'.';
      }
    //}
    return handlerInput.responseBuilder
      .speak(speak_output)
      .reprompt(reprompt_output)
      .getResponse();
  },
};


////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////

const ReversePathHandler = {
  //purpose: this handler gives the reverse path, going from current person to the user
  //uses the id_stack
  
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'reverse_path';
  },
  
  async handle(handlerInput) {
    console.log('In ReversePathHandler');
    //const { accessToken } = handlerInput.requestEnvelope.context.System.user; //this should be empty is the user does not have an account linked
    
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();  //gets the session's attributes
    var speak_output = '';
    var reprompt_output = '';
    /*
    //user has not set up any info
    if(!sessionAttributes.person.name) {
      speak_output = 'Sorry. You will need to set up your account before you can get path information. What name would you like me to call you?';
      reprompt_output = speak_output;
    }
    
    //user saved a name, but hasn't set up their account
    else if(!accessToken) {
      const user_name = sessionAttributes.person.name;
      //we need to check if the user has an existing family search account
      if(sessionAttributes.have_account === undefined || sessionAttributes.have_account === '' || sessionAttributes.have_account === 'na') {
        speak_output = `Sorry ${user_name}. Before you can get path information, you will need to link a Family Search account. Yes or no. Do you have an existing account on familysearch.org?`;
        reprompt_output = 'Yes or no. Do you have an existing Family Search account?';
        sessionAttributes.y_n_case = 'existing account';   //this clarifies we are looking to set up user account
      }
      //the user has an existing family search account
      else if(sessionAttributes.have_account === 'yes') {
        speak_output = `Sorry ${user_name}, before you can get path information, you will need to link your Family Search account. Would you like to set up your account now?`;
        reprompt_output = 'Would you like to set up your account now?';
        sessionAttributes.y_n_case = 'set up account';
      }
      //the user does not have an existing family search account
      else {  //sessionAttributes.have_account === 'no'
        speak_output =  `Sorry ${user_name}. To access additional features, you will need to create an account at familysearch.org.`;
        reprompt_output = `Before you can access additional features, you will need to create a family search account at familysearch.org.`;
      }
    }
    
    //assuming the user has set up their account
    else {*/
      if (sessionAttributes.generation === 0 || !sessionAttributes.generation) {  
        speak_output = 'You do no have a current path. In order to get started on a path, you can say \'explore family tree\'';
        reprompt_output = speak_output;
      }
      else if (sessionAttributes.generation === 1) {  //the user is on their parent
        const parent_name = await API.getName(sessionAttributes.current_person, sessionAttributes.access_token);
        speak_output = `The current person is your ${sessionAttributes.parent_side}, ${parent_name}.`;
        reprompt_output = 'If you would like to hear the reverse path again, say \'reverse path\'';
      }
      else {  //the user is back multiple generations
        const stack = [...sessionAttributes.id_stack];  //this is a new, temporary stack we will use as we pop off the original stack; the '...' copys the elements from the original array into a new array
        var current_pid = ''; //keeps tracks of the current person, used in loop
        var person_name = await API.getName(sessionAttributes.current_person, sessionAttributes.access_token);    //getting name from pid
        speak_output = `You are back ${sessionAttributes.generation} generations. You are currently on ${person_name}. ${person_name}'s child is `;   //# of generations
        
        for(let i = 0; i < (sessionAttributes.generation - 2); i++) {   //needs two less than the generation we are on
          current_pid = stack.pop();  //removing person from temporary stack
          person_name = await API.getName(current_pid, sessionAttributes.access_token); //getting name from pid
          
          speak_output = speak_output + `${person_name}. ${person_name}'s child is `; 
        }
        current_pid = stack.pop();  //removing person from temporary stack
        person_name = await API.getName(current_pid, sessionAttributes.access_token); //getting name from pid
        
        speak_output = speak_output + `${person_name}, your ${sessionAttributes.parent_side}.`;
        reprompt_output = 'If you would like to hear the reverse path again, say \'reverse path\'';
        
        //note 'stack' array is not global (we don't want it to be or alter our original array)
      }
    //}
    
    return handlerInput.responseBuilder
      .speak(speak_output)
      .reprompt(reprompt_output)
      .getResponse();
  },
};


////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////


const GetFeaturesHandler = {
  //purpose: gives the user extra direction as to what they can do with the fh application
  
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'get_features';
  },
  handle(handlerInput) {
    console.log('In GetFeaturesHandler');
    const { accessToken } = handlerInput.requestEnvelope.context.System.user; //this should be empty is the user does not have an account linked
    
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();  //gets the session's attributes
    var speak_output = '';
    var reprompt_output = '';
    
    //user hasn't given us any info
    if(!accessToken) {
      speak_output = 'After you set up your account, you can use me to check if you have any available temple names, ' +
      'explore your family tree, and ask for a story about your ancestors. Would you like to set up your account?';   
      reprompt_output = 'Would you like me to set up your account?';        
      sessionAttributes.y_n_case = 'set up account';   //this clarifies we are looking to set up user account
    }
    
    //assuming the user has set up their account
    else {
      speak_output = 'With your account, you can use me to check if you have any available temple names, ' +
      'explore your family tree, and ask for a story about your ancestors.';           
      reprompt_output = 'Would you like to hear more?';                     
      
      sessionAttributes.y_n_case = 'more info';   //we "reset" the session attribute, this is the case when the user wants more information
    }
    
    return handlerInput.responseBuilder
      .speak(speak_output)
      .reprompt(reprompt_output)
      .getResponse();
  },
};


////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////


const HelpHandler = {
  //template AWS help function
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    console.log('In HelpHandler');
    const speak_output = 'You can say hello to me!';

    return handlerInput.responseBuilder
      .speak(speak_output)
      .getResponse();
  },
};


////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////


const LinkAccountHandler = {
  //template AWS help function
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'link_account';
  },
  handle(handlerInput) {
    console.log('In LinkAccountHandler');
    const speak_output = 'I just sent directions to your Alexa app. If you don\'t see instructions or do not have the app, visit amazon.alexa.com. . . From there, click on the family search card. . .Then, link account.';  //I added the ... to make Alexa pause
    const reprompt_output = 'Directions were sent to your Alexa app. If you don\'t see instructions or do not have the app, visit amazon.alexa.com. . . From there, click on the family search card. . .Then, link account.';  //I added the ... to make Alexa pause
    return handlerInput.responseBuilder
      .speak(speak_output)
      .reprompt(reprompt_output)    //Check this
      .withLinkAccountCard()
      .getResponse();
  },
};


////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////


const YesHandler = {
  //purpose: this handles yes responses from the user
  
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent';
  },
  
  handle(handlerInput) {
    console.log('In YesHandler');
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();  //gets the session's attributes
    var speak_output = '';
    var reprompt_output = '';
    
    ////////////////////////////////////////////
    // case: we want to set up their account, from GetFeaturesHandler
    
    //user wants to set up account and does not yet have a name
    if(sessionAttributes.y_n_case === 'set up account' && !sessionAttributes.person.name) {
      speak_output = 'To get started, what name would you like me to call you.';
      reprompt_output = 'What name would you like me to call you?';
    }
    
    //user wants to set up account but does have a name, shouldn't actually ever go to this case yet
    else if (sessionAttributes.y_n_case === 'set up account') {
      speak_output = 'In order to link your account, go online at amazon.alexa.com. Click on the Family Search Account Setup card, then Link Account'; //ADD THIS LATER, FIXME
      reprompt_output = speak_output;
      
      sessionAttributes.y_n_case = 'none';
      return handlerInput.responseBuilder
        .speak(speak_output)
        .reprompt(reprompt_output)    //Check this
        .withLinkAccountCard()
        .getResponse();
    }
    ////////////////////////////////////////////
    
    ////////////////////////////////////////////
    // case: the user wants more features/information, from GetFeaturesHandler
    else if (sessionAttributes.y_n_case === 'more info') {
      speak_output = `Sorry ${sessionAttributes.person.name}. More features coming soon.`; //ADD THIS LATER, FIXME
      reprompt_output = 'Check back soon for more features.';
    }
    ////////////////////////////////////////////
    
    ////////////////////////////////////////////
    // case: the user already has an account, from LaunchRequestHandler and SetNameHandler 
    else if (sessionAttributes.y_n_case === 'existing account') {
      speak_output = 'In order to link your account, go online at amazon.alexa.com. Click on the Family Search Account Setup card, then Link Account'; //ADD THIS LATER, FIXME
      reprompt_output = speak_output;
      
      sessionAttributes.have_account = 'yes';    //we will use this in our yes/no intent handlers, we use it to identify what the user is responding to
      sessionAttributes.y_n_case = 'none';
      return handlerInput.responseBuilder
        .speak(speak_output)
        .reprompt(reprompt_output)    //Check this
        .withLinkAccountCard()
        .getResponse();
    }
    ////////////////////////////////////////////
    
    ////////////////////////////////////////////
    // case: the user is asked if there is anything else we can help with, from SetNameHandler 
    else if (sessionAttributes.y_n_case === 'anything else') {
      speak_output = 'What can I help you with?'; 
      reprompt_output = speak_output;
      
    }
    ////////////////////////////////////////////
    
    ////////////////////////////////////////////
    // case: the user randomly says yes or no, session.Attributes.y_n_case should be 'none'
    else {
      speak_output = 'Sorry I don\'t understand. To ask me about my family history features, ask Alexa, what can I do with you?';
      reprompt_output = 'To ask me about my family history features, ask Alexa, what can I do with you?';
    }
    
    sessionAttributes.y_n_case = 'none';   //we "reset" the session attributes
    
    return handlerInput.responseBuilder
      .speak(speak_output)
      .reprompt(reprompt_output)
      .getResponse();
  },
};


////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////


const NoHandler = {
  //purpose: this handles no responses from the user
  
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NoIntent';
  },
  
  handle(handlerInput) {
    console.log('In NoHandler');
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();  //gets the session's attributes
    var speak_output;
    var reprompt_output = 'Is there anything else I can help you with?';
    
    ////////////////////////////////////////////
    // case: the user does not want to set up their account, from GetFeaturesHandler
    if(sessionAttributes.y_n_case === 'set up account') {
      speak_output = 'Ok. You can set me up anytime by saying (Alexa, link my family search account) after you open byu family search. ';   //ADD THIS LATER, FIXME
    }
    ////////////////////////////////////////////
    
    ////////////////////////////////////////////
    // case: the user does not want more informationt, from GetFeaturesHandler
    else if(sessionAttributes.y_n_case === 'more info') {
      speak_output = 'Okay.';   
    }
    ////////////////////////////////////////////
    
    ////////////////////////////////////////////
    // case: the user does not have an existing account, from LaunchRequestHandler and SetNameHandler
    else if (sessionAttributes.y_n_case === 'existing account') {
      speak_output = 'Before starting with the Alexa feature, you will need to create an account. You can create an account at familysearch.org.'; //ADD THIS LATER, FIXME
      reprompt_output = 'You need to set up an account online at familysearch.org.';
      sessionAttributes.have_account = 'no';
    }
    ////////////////////////////////////////////
    
    ////////////////////////////////////////////
    // case: the user is asked if there is anything else we can help with, from SetNameHandler 
    else if (sessionAttributes.y_n_case === 'anything else') {
      speak_output = 'Okay. Exiting BYU Family History.'; //Check this
      
      sessionAttributes.y_n_case = 'none';
      reprompt_output = speak_output;
      return handlerInput.responseBuilder
        .speak(speak_output)
      
    }
    ////////////////////////////////////////////
    
    ////////////////////////////////////////////
    // case: the user randomly says yes or no, session.Attributes.y_n_case should be 'none'
    else {
      speak_output = 'Sorry I don\'t understand. To ask me about my features, ask Alexa, what can I do with you?';
      reprompt_output = 'To ask me about my features, ask Alexa, what can I do with you?';
    }
    
    sessionAttributes.y_n_case = 'none';   //we "reset" the session attribute
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);   //this updates the session attributes
    
    return handlerInput.responseBuilder
      .speak(speak_output)
      .reprompt(reprompt_output)
      .getResponse();
  },
};


////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////


const TestAPIHandler = {
  //purpose: using this to test getting an API call response, later will delete
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'test_api_sample');
  },
  async handle(handlerInput) {
    console.log('In TestAPIHandler');
    const response  = await API.getVerification();     
    console.log('POSTDATA?' + response);    //logs correctly
    
    console.log('ACCESSTOKEN?' + response.access_token);    //undefined without the JSON.parse(), FIXME need to account for errors
    
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    sessionAttributes.access_token = response.access_token;

    
    const speak_output = '';//`To test this API, let me tell you a story about ${response.name}, the son of ${response.mother} and ${response.father}. ${response.story}`;
    

    return handlerInput.responseBuilder
      .speak(speak_output)
      .reprompt(speak_output)
      .getResponse();
  },
};

const TestAPIGetPersonHandler = {
  //purpose: using this to test getting an API 'httpGetPerson' function
  //parses from following JSON format: 
  //      https://www.familysearch.org/developers/docs/api/types/json_Person_conclusion
  
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'test_api_get_person');
  },
  async handle(handlerInput) {
    console.log('In TestAPIGetPersonHandler');
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    //sessionAttributes.access_token = response.access_token;
    
    var speak_output = '';
    var name =  await API.getName('LRMV-37V', sessionAttributes.access_token);          //KWCZ-66Q');  //calling function that returns the name
    
    if(name === 'error') speak_output = 'There was a problem.';   //FIXME, later need to customize to error
    else if(name === '401 error') speak_output = 'There was a problem with authorizing your account.';
    else if(name === '404 error') speak_output = 'Unable to find the person.';
    else speak_output = `The name of the person is ${name}.`;     //if it correctly obtained a name
    
    var parentID = await API.getParentID('LRMV-37V', sessionAttributes.access_token, 'father');
    
    if(parentID === 'error') speak_output = speak_output + ' There was a problem.';   //FIXME, later need to customize to error
    else if(parentID === '401 error') speak_output = speak_output + ' There was a problem with authorizing your account.';
    else if(parentID === '404 error') speak_output = speak_output + 'Unable to find the person.';
    else console.log('PARENTID?' + parentID);
    
    var fathername = await API.getName(parentID, sessionAttributes.access_token);
    speak_output = speak_output + ` The name of their father is ${fathername}`;
    
    return handlerInput.responseBuilder
      .speak(speak_output)
      .reprompt(speak_output)
      .getResponse();
  },
};


////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////


const CancelAndStopHandler = {
  //template AWS function
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    console.log('In CancelAndStopHandler');
    const speak_output = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speak_output)
      .getResponse();
  },
};


////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////


const SessionEndedRequestHandler = {
  //template AWS function
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log('In SessionEndedRequestHandler');
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    
    this.emit(':saveState', true); //saves the attributes to the database
    return handlerInput.responseBuilder.getResponse();
  },
};


////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////


const ErrorHandler = {
  //template AWS function
  //COULD YOU FIGURE THE SESSION ATTRIBUTES
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log('In ErrorHandler');
    console.log(`Error handled: ${error.message}`);
    console.log(error.trace);
   
    this.emit(':saveState', true); //saves the attributes to the database (for some reason, this line here causes alexa to not work properly when you quit/exit.
                                    //This line can also be problemmatic if the error involved one of the fields that is being saved to the database being invalid,
                                    //as it will save the database and the the invalid field will be saved and will overrite what was previously there)
   
    return handlerInput.responseBuilder
      .speak('Sorry, something went wrong. Please say exit and reopen application.') 
      .getResponse();
  },
};


////////////////////////////////////////////////////////////////////////////////

//Exports Handler
//any additional handlers we add need to be put in the exports handler
const skillBuilder = Alexa.SkillBuilders.custom(); //CHANGED THIS LINE, FIXME

//const Adapter = require('ask-sdk-dynamodb-persistence-adapter');

exports.handler = skillBuilder
  
  .addRequestHandlers(
    LaunchRequestHandler,
    SetNameHandler,
    ExploreHandler,
    ExploreParentHandler,
    GoBackHandler,
    ExploreThisHandler,
    GetMemoryHandler,
    GetTempleNamesHandler,
    ForwardPathHandler,
    ReversePathHandler,
    GetFeaturesHandler,
    LinkAccountHandler,
    HelpHandler,
    YesHandler,
    NoHandler,
    TestAPIHandler,
    TestAPIGetPersonHandler,
    CancelAndStopHandler,
    SessionEndedRequestHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .withPersistenceAdapter(  //pretty sure this isn't working because using ask-sdk-core not the whole ask-sdk
     
 )
  //.withTableName('alexa-data')  //FIXME
  //.withAutoCreateTable(true)    //FIXME
  .lambda();
