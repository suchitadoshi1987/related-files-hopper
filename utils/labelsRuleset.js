const { singular } = require("pluralize");

function _capitalizeFirstLetter(str) {
  return str[0].toUpperCase() + str.slice(1);
}

/**
 * Returns an array of default label rule set for the quick pick item based on the folders array
 * along with some custom rulesets.
 * @param {*} folders
 */
function createDefaultAppLabelRuleSet(folders) {
  const stylesRuleSet = {
    folderName: "styles",
    title: "Style",
    regexPatterns: ["(/.*)?/(.+).(css|scss)"]
  };
  const templatesRuleSet = {
    folderName: "templates",
    title: "Template",
    regexPatterns: ["(/.*)?/(.+).(hbs)", "(/.*)?/templates/(.+).(js|ts|hbs)"]
  };
  const rootRuleSet = {
    folderName: "",
    title: "Root",
    regexPatterns: ["(.+).(js|ts|hbs)"]
  };

  let appRuleSets = folders.map(folderItem => {
    return {
      folderName: folderItem,
      title: _capitalizeFirstLetter(singular(folderItem)),
      regexPatterns: [`(/.*)?/${folderItem}/(.+).(js|ts)`]
    };
  });
  appRuleSets = [].concat(
    stylesRuleSet,
    templatesRuleSet,
    ...appRuleSets,
    rootRuleSet
  );
  return appRuleSets;
}

/**
 * Returns an array of default label rule set for the quick pick item based
 * on the test folders array.
 * @param {*} testFolders
 */
function createDefaultTestLabelRuleSet(testFolders) {
  return testFolders.map(folderItem => {
    return {
      folderName: folderItem,
      title: `${_capitalizeFirstLetter(singular(folderItem))} Test`,
      regexPatterns: [
        `(\/.*)?\/(${folderItem})?(\/(.*))?\/(.+)(-|\.)test\.(js|ts)`
      ]
    };
  });
}
module.exports = {
  createDefaultAppLabelRuleSet,
  createDefaultTestLabelRuleSet
};
