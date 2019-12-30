const { singular } = require("pluralize");

function _capitalizeFirstLetter(str) {
  return str[0].toUpperCase() + str.slice(1);
}

function createDefaultAppLabels(folders) {
  const stylesItem = {
    folderName: "styles",
    title: "Style",
    regexPatterns: ["(/.*)?/(.+).(css|scss)"]
  };
  const templatesItem = {
    folderName: "templates",
    title: "Template",
    regexPatterns: ["(/.*)?/(.+).(hbs)", "(/.*)?/templates/(.+).(js|ts|hbs)"]
  };
  const rootItem = {
    folderName: "",
    title: "Root",
    regexPatterns: ["(.+).(js|ts|hbs)"]
  };

  let result = folders.map(folderItem => {
    return {
      folderName: folderItem,
      title: _capitalizeFirstLetter(singular(folderItem)),
      regexPatterns: [`(/.*)?/${folderItem}/(.+).(js|ts)`]
    };
  });
  result = result.concat([stylesItem, templatesItem, rootItem]);
  return result;
}

function createDefaultTestLabels(folders) {
  const result = folders.map(folderItem => {
    return {
      folderName: folderItem,
      title: `${_capitalizeFirstLetter(singular(folderItem))} Test`,
      regexPatterns: [
        `(\/.*)?\/(${folderItem})?(\/(.*))?\/(.+)(-|\.)test\.(js|ts)`
      ]
    };
  });
  return result;
}
module.exports = { createDefaultAppLabels, createDefaultTestLabels };
