var translate = require("cookieMgr")
var testRunner;
var remainingTests;
 
function check_translation(translation) {
  testRunner.assertEqual("Lizard", translation);
  testRunner.done();
}
 
function test_languages(test, text) {
  testRunner= test;
  testRunner.waitUntilDone(2000);
  translate.translate(text, check_translation);
}
 
exports.test_german = function(test) {
  test_languages(test, "Eidechse");
}
 
exports.test_italian = function(test) {
  test_languages(test, "Lucertola");
}
 
exports.test_finnish = function(test) {
  test_languages(test, "Lisko");
}
 
exports.test_error = function(test) {
  test.assertRaises(function() {
    translate.translate("", check_translation);
  },
  "Text to translate must not be empty");
};