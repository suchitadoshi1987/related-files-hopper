const assert = require("assert");

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require("vscode");
// const myExtension = require('../extension');
const helper = require("../../utils/helper");

suite("Helper Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("getPipedRegexString", () => {
    assert.equal(helper.getPipedRegexString(["app", "tests"]), "(app|tests)");
    assert.equal(
      helper.getPipedRegexString(["app", "tests"], ["src"]),
      "(app|tests|src)"
    );
    assert.equal(helper.getPipedRegexString(), "");
  });

  test("removePrefixSlash", () => {
    assert.equal(helper.removePrefixSlash("/app/foo/bar"), "app/foo/bar");
    assert.equal(helper.removePrefixSlash("app/foo/bar"), "app/foo/bar");
    assert.equal(helper.removePrefixSlash(), undefined);
	});
	
	test("removePrefixSlash", () => {
    assert.equal(helper.removePrefixSlash("/app/foo/bar"), "app/foo/bar");
    assert.equal(helper.removePrefixSlash("app/foo/bar"), "app/foo/bar");
    assert.equal(helper.removePrefixSlash(), undefined);
  });
});
