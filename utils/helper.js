const vscode = require("vscode");
const { Uri } = vscode;
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
  return arr.length ? `(${[].concat(...arr).join("|")})` : '';
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
  const relativePathText = vscode.workspace.asRelativePath(item);
  let pathPrefix = relativePathText.split("/")[0];
  const {
    appRootFolders,
    appSubRootFolders,
    testSubRootFolders,
    testRootFolders
  } = config;
  const rootFolders = [...new Set([].concat(appRootFolders, testRootFolders, appSubRootFolders, testSubRootFolders))];
  const appName1 = new RegExp(`(.*)/${getPipedRegexString(rootFolders)}/(.*)`);
  const appNameMatch = relativePathText.match(appName1);
  if (appNameMatch) {
    pathPrefix = relativePathText.match(appName1)[1];
  }
  return pathPrefix;
}

function determineLabelType(fileName, appName) {
  const test = new RegExp(
    `${appName}(\/(?:.+))?\/(${getPipedRegexString(config.testsSubFolders)})?(\/(.*))?\/(.+)-test\.(js|ts)`
  );

  const components = new RegExp(`${appName}(\/.*)?\/components\/(.+).(js|ts)`);
  const routes = new RegExp(`${appName}(\/.*)?\/routes\/(.+).(js|ts)`);
  const serializers = new RegExp(
    `${appName}(\/.*)?\/serializers\/(.+).(js|ts)`
  );

  const models = new RegExp(`${appName}(\/.*)?\/models\/(.+).(js|ts)`);
  const adapters = new RegExp(`${appName}(\/.*)?\/adapters\/(.+).(js|ts)`);
  const mixins = new RegExp(`${appName}(\/.*)?\/mixins\/(.+).(js|ts)`);
  const utils = new RegExp(`${appName}(\/.*)?\/utils\/(.+).(js|ts)`);
  const services = new RegExp(`${appName}(\/.*)?\/services\/(.+).(js|ts)`);
  const helpers = new RegExp(`${appName}(\/.*)?\/helpers\/(.+).(js|ts)`);
  const initializers = new RegExp(
    `${appName}(\/.*)?\/initializers\/(.+).(js|ts)`
  );
  const controllers = new RegExp(
    `${appName}(\/.*)?\/controllers\/(.+).(js|ts)`
  );
  const templates = new RegExp(`${appName}(\/.*)?\/(.+).(hbs)`);
  const templates1 = new RegExp(
    `${appName}(\/.*)?\/templates\/(.+).(js|ts|hbs)`
  );

  const styles = new RegExp(`${appName}(\/.*)?\/(.+).(css|scss)`);

  if (fileName.match(test)) {
    const matchedTest = fileName.match(test)[2];
    return `${matchedTest.replace(/\w/, c => c.toUpperCase())} Test:`;
  }
  if (fileName.match(templates) || fileName.match(templates1)) {
    return "Template:";
  }
  if (fileName.match(styles)) {
    return "Style:";
  }
  if (fileName.match(components)) {
    return "Component:";
  }
  if (fileName.match(routes)) {
    return "Route:";
  }
  if (fileName.match(controllers)) {
    return "Controller:";
  }
  if (fileName.match(services)) {
    return "Service:";
  }
  if (fileName.match(mixins)) {
    return "Mixin:";
  }
  if (fileName.match(initializers)) {
    return "Initializer:";
  }
  if (fileName.match(serializers)) {
    return "Serializer:";
  }
  if (fileName.match(models)) {
    return "Model:";
  }
  if (fileName.match(adapters)) {
    return "Adapter:";
  }
  if (fileName.match(helpers)) {
    return "Helper:";
  }
  if (fileName.match(utils)) {
    return "Util:";
  }
  return "";
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
