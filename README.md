## BYU Family History Alexa Documentation

The following is documentation about 'byuFamilyHistoryAlexa' AWS Lambda function. 
Originally written in Node.js runtime 10.x
    
Here is a link to a google doc with more information: 
https://docs.google.com/document/d/1weBOEOS9-OHGXN5uCNm5ZDAQ2mWkdzqH_te1CfBbn0M/edit?usp=sharing

Here is a link to the git repository:
https://github.com/mjcleme/alexa.git

---
## Current Handlers

LaunchRequestHandler
    -handler automatically called when we open our skill
        
SetNameHandler
    -allows the user to set their name that our skill will call them
        
ExploreHandler
    -allows the user to explore their tree
    -resets to start on user everytime it is called
    -resets generation, stacks, and current person
        
ExploreParentHandler
    -called when the user selects either their mother or father
    -gives the user their relationship with the person and which side of the family 
        
GoBackHandler
    -allows the user to 'reverse' back a generation after moving forward
    -if it moves back to start, resets generation, stacks, and current person
        
ExploreThisHandler
    -allows the user to get more information about the current person
##  -FIXME, this needs to be updated later so it retrieves info from the API

GetMemoryHandler
    -returns a story or memory about one of their ancestors
##  -FIXME, this needs to be updated later so it retrieves info from the API

GetTempleNamesHandler
    -returns and reads off avaiable names to take to the temple
##  -FIXME, this needs to be updated later so it retrieves info from the API

ForwardPathHandler
    -navigates the current path from the user to the current person
    -moves upwards through the tree, ex. user -> father -> grandmother
        
ReversePathHandler
    -navigates the current path from the current person to the user
    -moves downwards through the tree, ex. grandmother -> father -> user
        
GetFeaturesHandler
    -gives the user further instruction on what features are avaiable to the user
##  -FIXME, later need to update more features

LinkAccountHandler
    -walks the user through linking their account with Family Search
        
HelpHandler
    -responds to the user if they ask for help
        
YesHandler
    -responds to 'yes' responses by a user to alexa-prompted questions
        -'set up account': user wants to set up account but already has a name saved, from
              *SetNameHandler, ExploreHandler, ExploreParentHandler, GoBackHandler, GetMemoryHandler
              *GetTempleNamesHandler, ForwardPathHandler, ReversePathHandler
        -'more info': the user wants more features/information, from GetFeaturesHandler
        -'existing account': the user has a Family Search account, from 
              *LaunchRequestHandler, SetNameHandler, ExploreHandler, ExploreParentHandler, 
              *GoBackHandler, GetMemoryHandler, GetTempleNamesHandler, ForwardPathHandler, 
              *ReversePathHandler
        -'anything else': alexa asks if there is anything else they can help them with
        -'none': the user randomly says yes
         
NoHandler
  -responds to 'no' responses by a user to alexa-prompted questions
      -'set up account': the user does not want to set up their account now but already has name saved, from
              *SetNameHandler, ExploreHandler, ExploreParentHandler, GoBackHandler, GetMemoryHandler
              *GetTempleNamesHandler, ForwardPathHandler, ReversePathHandler
      -'more info': the user does not want to set up their account, from GetFeaturesHandler
      -'existing account': the user does not have an existing Family Search account, from
              *LaunchRequestHandler, SetNameHandler, ExploreHandler, ExploreParentHandler, 
              *GoBackHandler, GetMemoryHandler, GetTempleNamesHandler, ForwardPathHandler, 
              *ReversePathHandler
      -'anything else': asks the user if there is anything else they can help them with, from 
              *SetNameHandler
      -'none': the user randomly says no
          
TestAPIHandler
    -used to test API calls, will not actually be used in production
## FIXME, will later want to delete this handler  
        
CancelAndStopHandler
    -built in Alexa handler
        
SessionEndedRequestHandler
    -ends the session
    -note it saves the sessionAttributes
        
ErrorHandler
    -deals with errors
## FIXME, later need to save sessionAttributes before exiting


---
## Session Attributes

y_n_case: remembers what the user is responding yes/no to

have_account: remembers during the session if the user has a family search account

user_name: remembers the user's name, NOTE WILL LATER MOVE THIS TO A PERSISTANT ATTRIBUTE

current_person: remembers which person they want to explore/are on, originally want to set to user

generation: remembers which generation they are on, starting with 0

parent_side: remembers if we are on their mother or father's side

id_stack: stack that remembers the id's of the explored path

m_f_stack: stack remembers the mother/father of the explored path, includes 'me'

access_token: this keeps the access token from the 'getVerification' call
---
## Dynamo DB

Table Information
    -the following is the format of the dynamoDB table
      this.attributes = { 
      'person': {
        'name': '',
        'account': {
          'username': '',
          'password': ''
        }
      }
    };
    -for example, if you wanted to see the name, you would do sessionAttributes.person.name;

---
## API Functions

httpGet
  -makes our call to the sample API provided by Dr. Clement
  -modified from the code provided in the following tutorial:
        -url: https://www.developer.amazon.com/blogs/alexa/post/4a46da08-d1b8-4d8e-9277-055307a9bf4a/alexa-skill-recipe-update-call-and-get-data-from-external-apis
  -currently used in our TestAPIHandler
  -makes a call to the following REST API
        -url: https://fhtl-api-prd.byu-dept-fhtl-prd.amazon.byu.edu/
  -in MODULE EXPORTS
        
getVerification
  -makes a call to the Family Search API requesting an accessToken
        -documentation: https://www.familysearch.org/developers/docs/api/authentication/Authorization_resource
  -modeled from Postman with the following edits
        -needed to JSON.parse() the returned string
        -needed to return a promise or else did not execute in the correct order
  -in MODULE EXPORTS
  
getPerson
  -takes in pid, access_token
  -makes the call and returns a person
        -documentation: https://www.familysearch.org/developers/docs/api/tree/Person_resource
  
getParent
  -takes in pid, access_token
  -makes the call and returns two person array
        -documentation: https://www.familysearch.org/developers/docs/api/tree/Parents_of_a_Person_resource
  -['persons'][0] corresponds to father, ['persons'][1] corresponds to the mother
  
getUser
  -takes in access_token
  -returns information about the current user
    -documentation: https://www.familysearch.org/developers/docs/api/users/Current_User_resource
    
getName
  -takes in a pid and access_token
  -calls getPerson
  -returns the person name
  -in MODULE EXPORTS
  
getParentID
  -takes in pid, access_token, and parent_side (mother or father)
  -calls getParent
  -returns the parent pid of the pid's mother or father
  -in MODULE EXPORTS
  
getUserID
  -takes in access_token
  -calls getUser
  -returns the current user's id
  -in MODULE EXPORTS
