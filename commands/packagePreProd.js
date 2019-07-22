var exec = require("child_process").exec;

// Load existing publisher
var manifest = require("../vss-extension-preProd.json");
var extensionId = manifest.id;

// Package extension
var command = `tfx extension create --rev-version --manifest-globs vss-extension-preProd.json --extension-id ${extensionId} --no-prompt`;
exec(command, function (error) {
  if (error) {
    console.log(`Package create error: ${error}`);
  } else {
    console.log("Package created");
  }
});
