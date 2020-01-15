const vscode = require("vscode");
const { Uri } = vscode;
const {
  createDefaultAppLabelRuleSet,
  createDefaultTestLabelRuleSet
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
  const mergedArray = [].concat(...arr);
  return mergedArray.length ? `(${mergedArray.join("|")})` : "";
}

function removePrefixSlash(pathName) {
  return pathName && pathName[0] === "/" ? pathName.substr(1) : pathName;
}

/**
 * Returns the sub directory path that comes after the app/test sub folders.
 * Eg: for a given path: `Users/foo/app/components/bar/baz/bang.js`
 * Here, appFolder -> components
 * The function would return the sub directory of components, i.e. `bar/baz`
 * @param {*} appRegexMatch
 * @param {*} testRegexMatch
 */
function getChildSubDir(appRegexMatch, testRegexMatch) {
  if (appRegexMatch) {
    return removePrefixSlash(appRegexMatch[5]);
  }
  if (testRegexMatch) {
    return removePrefixSlash(testRegexMatch[7]);
  }
  return;
}

/**
 * This is to match the files for patterns where the file names
 * are prefixed with any special character i.e. either `_` or `_<parent-folder-name>`
 * Eg: `app/styles/_foo.scss` would be matched to `app/components/foo.js`
 * OR `lib/bar/app/styles/_bar-foo.scss` would also be matched to `lib/bar/app/components/foo.js`
 * @param {*} specialChar
 * @param {*} potentialParentFolderName
 * @param {*} prefix
 */
function getPrefixNameFromSpecialChars(
  specialChar,
  potentialParentFolderName,
  prefix
) {
  const prefixRegex = new RegExp(
    `(${specialChar})?(${potentialParentFolderName}-)?(.*)`
  );
  const prefixRegexMatch = prefix && prefix.match(prefixRegex);
  if (prefixRegexMatch) {
    prefix = prefixRegexMatch[prefixRegexMatch.length - 1];
  }
  return prefix;
}

/**
 * Gather all the root and subroot folders from the config, and return the prefix
 * of the path.
 * Eg: if root and subroot folders is ['app', 'addon', 'tests'],
 * item = `lib/bar/addon/components/foo.js`,
 * it will return `lib/bar`.
 * @param {*} item
 */
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

/**
 * Iterate over the array of the labelRuleSet metadata array and return the
 * matched item's title.
 * @param {*} metadataArray
 * @param {*} prefixPath
 * @param {*} fileName
 */
function _getLabelForFile(metadataArray, prefixPath, fileName) {
  for (let i = 0; i < metadataArray.length; i++) {
    const item = metadataArray[i];
    if (item.regexPatterns && item.regexPatterns.length) {
      for (let j = 0; j < item.regexPatterns.length; j++) {
        const regexItem = `${prefixPath}${item.regexPatterns[j]}`;
        if (fileName.match(regexItem)) {
          return `${item.title}:`;
        }
      }
    }
  }
  return;
}

/**
 * Returns a matched label for a given fileName and a prefix path based on
 * a combination of user's provided custom label rule set, default app rule set
 * and test rule set.
 * @param {*} fileName
 * @param {*} prefixPath
 */
function determineLabelType(fileName, prefixPath) {
  const userDefinedLabels = config.labelRuleSets || [];
  const testLabelRuleSet = createDefaultTestLabelRuleSet(config.testSubFolders);
  const appLabelRuleSet = createDefaultAppLabelRuleSet(config.appSubFolders);

  return (
    _getLabelForFile(
      [].concat(...userDefinedLabels, ...testLabelRuleSet, ...appLabelRuleSet),
      prefixPath,
      fileName
    ) || ""
  );
}

/**
 * Returns the quick pick item object based on the file path.
 * @param {*} item
 */
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
