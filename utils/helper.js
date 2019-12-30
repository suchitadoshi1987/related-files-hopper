const vscode = require("vscode");
const { Uri } = vscode;
const {
  createDefaultTestLabels,
  createDefaultAppLabels
} = require("./labelsRuleset");
const document =
  vscode.window.activeTextEditor && vscode.window.activeTextEditor.document;
const workspaceFolder = document
  ? vscode.workspace.getWorkspaceFolder(document.uri)
  : null;
const config = vscode.workspace.getConfiguration("fileHopper");

function getConfig() {
  return config;
}

function getPipedRegexString(...arr) {
  return arr.length ? `(${[].concat(...arr).join("|")})` : "";
}

function removePrefixSlash(pathName) {
  return pathName && pathName[0] === "/" ? pathName.substr(1) : pathName;
}
function getChildSubDir(appRegexMatch, testRegexMatch) {
  if (appRegexMatch) {
    return removePrefixSlash(appRegexMatch[5]);
  }
  if (testRegexMatch) {
    return removePrefixSlash(testRegexMatch[7]);
  }
  return null;
}

// this is to match .scss files for patterns where css file names
// are prefixed with either `_` or `_<folder-name>`
function getPrefixNameFromSpecialChars(
  specialChar,
  potentialParentFolderName,
  prefix
) {
  const prefixRegex = new RegExp(
    `(${specialChar})?(${potentialParentFolderName}-)?(.*)`
  );
  const prefixRegexMatch = prefix.match(prefixRegex);
  if (prefixRegexMatch) {
    prefix = prefixRegexMatch[prefixRegexMatch.length - 1];
  }
  return prefix;
}

function _getPathPrefix(item) {
  const relativePath = vscode.workspace.asRelativePath(item);
  let pathPrefix = relativePath.split("/")[0];
  const rootFolders = [
    ...new Set(
      [].concat(
        config.appRootFolders,
        config.testRootFolders,
        config.appSubRootFolders,
        config.testSubRootFolders
      )
    )
  ];
  const appSubDirRegex = new RegExp(
    `(.*)/${getPipedRegexString(rootFolders)}/(.*)`
  );
  const appNameMatch = relativePath.match(appSubDirRegex);
  if (appNameMatch) {
    pathPrefix = relativePath.match(appSubDirRegex)[1];
  }
  return pathPrefix;
}

function _getLabelForFile(metadataArray, appName, fileName) {
  for (let i = 0; i < metadataArray.length; i++) {
    const item = metadataArray[i];
    if (item.regexPatterns && item.regexPatterns.length) {
      for (let j = 0; j < item.regexPatterns.length; j++) {
        const regexItem = `${appName}${item.regexPatterns[j]}`;
        if (fileName.match(regexItem)) {
          return `${item.title}:`;
        }
      }
    }
  }
  return;
}

function determineLabelType(fileName, appName) {
  const userDefinedLabels = config.labelRuleSets || [];
  const testLabels = createDefaultTestLabels(config.testSubFolders);
  const appLabels = createDefaultAppLabels(config.appSubFolders);

  return (
    _getLabelForFile(
      [].concat(...userDefinedLabels, ...testLabels, ...appLabels),
      appName,
      fileName
    ) || ""
  );
}

function generateQuickPickItem(item) {
  const maybeWorkspaceFolder = workspaceFolder ? workspaceFolder.uri.path : "";
  const pathPrefix = _getPathPrefix(item);
  const fileName = vscode.workspace.asRelativePath(item);
  return {
    url: Uri.file(item),
    rootPath: maybeWorkspaceFolder,
    label: determineLabelType(item, pathPrefix),
    description: fileName
  };
}

module.exports = {
  removePrefixSlash,
  getChildSubDir,
  getPrefixNameFromSpecialChars,
  generateQuickPickItem,
  getPipedRegexString,
  getConfig
};
