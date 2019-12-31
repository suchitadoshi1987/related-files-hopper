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

  test("generateQuickPickItem - Returns correct label type", () => {
    let fileName = "Users/projects/bang/app/foo/components/bar.js";
    assert.equal(helper.generateQuickPickItem(fileName).label, "Component:");

    fileName = "Users/projects/bang/app/foo/templates/components/bar.hbs";
    assert.equal(helper.generateQuickPickItem(fileName).label, "Template:");

    fileName = "Users/projects/bang/lib/bang/addon/routes/bar.js";
    assert.equal(helper.generateQuickPickItem(fileName).label, "Route:");

    fileName = "Users/projects/bang/app/styles/app.scss";
    assert.equal(helper.generateQuickPickItem(fileName).label, "Style:");

    fileName = "Users/projects/bang/tests/integration/bar-test.js";
    assert.equal(
      helper.generateQuickPickItem(fileName).label,
      "Integration Test:"
    );

    fileName = "Users/projects/bang/tests/acceptance/bar-test.js";
    assert.equal(
      helper.generateQuickPickItem(fileName).label,
      "Acceptance Test:"
    );
  });

  test("getPrefixNameFromSpecialChars", () => {
    assert.equal(
      helper.getPrefixNameFromSpecialChars("_", null, "_bar"),
      "bar"
    );
    assert.equal(
      helper.getPrefixNameFromSpecialChars("_", "foo", "_foo-bar"),
      "bar"
    );
    assert.equal(
      helper.getPrefixNameFromSpecialChars("_", "foo", "bang"),
      "bang"
    );
    assert.equal(helper.getPrefixNameFromSpecialChars(null, null, null), null);
  });

  test("getChildSubDir", () => {
    const appSubDirRegex = `(\/.*)?/(app|addon)(\/.*)?\/(components|routes|templates)(\/.*)?\/(_)?foo.(js|hbs|scss|css)`;
    const appTestSubDirRegex = `(\/.*)?/(tests)(\/.*)?\/(acceptance|unit)(\/(components|routes|templates))?(\/.*)?\/(_)?foo(-test)?.(js|hbs|scss|css)`;

    let fileName = "Users/projects/app/components/admin/foo.js";
    let appSubDirMatch = fileName.match(appSubDirRegex);
    let testSubDirMatch = fileName.match(appTestSubDirRegex);
    assert.equal(
      helper.getChildSubDir(appSubDirMatch, testSubDirMatch),
      "admin"
    );

    fileName =
      "Users/projects/tests/acceptance/components/admin/settings/foo-test.js";
    appSubDirMatch = fileName.match(appSubDirRegex);
    testSubDirMatch = fileName.match(appTestSubDirRegex);
    assert.equal(
      helper.getChildSubDir(appSubDirMatch, testSubDirMatch),
      "admin/settings"
    );

    fileName = "Users/projects/tests/integration/foo-test.js";
    appSubDirMatch = fileName.match(appSubDirRegex);
    testSubDirMatch = fileName.match(appTestSubDirRegex);
    assert.equal(
      helper.getChildSubDir(appSubDirMatch, testSubDirMatch),
      undefined
    );
  });
});
