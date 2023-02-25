const VoiceResponse = require("twilio").twiml.VoiceResponse;
const AccessToken = require("twilio").jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

const nameGenerator = require("./name_generator");

var identity;


exports.tokenGenerator = function tokenGenerator() {
  identity = nameGenerator();

  const twilioAccountSid = "ACc2e61ea3ada9ef4ad339774efbc10c90"
  const twilioApiKey = "SKef4d085d1766f4efece982c5d6372add";
  const twilioApiSecret = "NcRLA4xeZkKxL4J3czS09O5EsMyKv5rj";
  const accessToken = new AccessToken(
    twilioAccountSid,
    twilioApiKey,
    twilioApiSecret,
    { identity: identity }
  );
  const grant = new VoiceGrant({
    outgoingApplicationSid: "AP902684fb636ee4365da5c45d1d9e9289",
    incomingAllow: true,
  });
  accessToken.addGrant(grant);
  // Include identity and token in a JSON response
  return {
    identity: identity,
    token: accessToken.toJwt(),
  };
};

exports.voiceResponse = function voiceResponse(requestBody) {
  const toNumberOrClientName = requestBody.To;
  const callerId = "+12762953790";
  let twiml = new VoiceResponse();


  // If the request to the /voice endpoint is TO your Twilio Number, 
  // then it is an incoming call towards your Twilio.Device.
  if (toNumberOrClientName == callerId) {
    let dial = twiml.dial();
    // This will connect the caller with your Twilio.Device/client 
    dial.client(identity);

  } else if (requestBody.To) {
    // This is an outgoing call

    // set the callerId
    let dial = twiml.dial({ callerId });

    // Check if the 'To' parameter is a Phone Number or Client Name
    // in order to use the appropriate TwiML noun 
    const attr = isAValidPhoneNumber(toNumberOrClientName)
      ? "number"
      : "client";
    dial[attr]({}, toNumberOrClientName);

  } else {
    twiml.say("Thanks for calling!");
  }

  return twiml.toString();
};


// exports.streamResponse = function streamResponse() {
//   const response = new VoiceResponse();
//   const connect = response.connect();
//   connect.stream({
//     url: 'wss://mystream.ngrok.io/audiostream'
//   });
//   return twiml.toString();
// }

/**
 * Checks if the given value is valid as phone number
 * @param {Number|String} number
 * @return {Boolean}
 */
function isAValidPhoneNumber(number) {
  return /^[\d\+\-\(\) ]+$/.test(number);
}
