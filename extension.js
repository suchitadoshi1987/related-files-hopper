const path = require("path");
const vscode = require("vscode");

const fg = require("fast-glob");
const { Uri, workspace, window } = vscode;

function open(item) {
  workspace
    .openTextDocument(item.url)
    .then(doc => window.showTextDocument(doc.uri));
}

function stripExtension(currentFilename, separator) {
  const filenameParts = currentFilename.split(separator);

  let basename = filenameParts[filenameParts.length - 1];
  let extension;
  while ((extension = path.extname(basename))) {
    basename = path.basename(basename, extension);
  }

  filenameParts[filenameParts.length - 1] = basename;
  return filenameParts.join(separator);
}

function stripGenericPattern(currentFilename, pattern) {
  if (pattern.startsWith("/") && pattern.endsWith("/")) {
    pattern = new RegExp(pattern.slice(1, pattern.length - 1), "g");
    currentFilename = currentFilename.replace(pattern, "");
  } else {
    while (currentFilename.includes(pattern)) {
      currentFilename = currentFilename.replace(pattern, "");
    }
  }

  return currentFilename;
}

function stripPatterns(currentFilename, separator, patterns) {
  if (patterns) {
    patterns.forEach(function(pattern) {
      if (pattern === "{EXTENSION}") {
        currentFilename = stripExtension(currentFilename, separator);
      } else {
        currentFilename = stripGenericPattern(currentFilename, pattern);
      }
    });
  }

  return currentFilename;
}

function buildPrefix(currentFilename, workspaceFolder, separator, config) {
  currentFilename = path.basename(currentFilename);
  currentFilename = stripPatterns(
    currentFilename,
    separator,
    config.patternsToStrip
  );
  return currentFilename;
}

function determineLabelType(fileName, appName) {
  const test = new RegExp(
    `${appName}(\/(?:.+))?\/(integration|acceptance|unit)?(\/(.*))?\/(.+)-test\.(js|ts)`
  );

  const components = new RegExp(`${appName}(\/.*)?\/components\/(.+).(js|ts)`);
  const routes = new RegExp(`${appName}(\/.*)?\/routes\/(.+).(js|ts)`);
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
  if (fileName.match(helpers)) {
    return "Helper:";
  }
  if (fileName.match(utils)) {
    return "Util:";
  }
  return "";
}

function getPathPrefix(item) {
  const relativePathText = vscode.workspace.asRelativePath(item);
  let pathPrefix = relativePathText.split("/")[0];
  const appName1 = new RegExp("(.*)/(addon|app|tests)/(.*)");
  const appNameMatch = relativePathText.match(appName1);
  if (appNameMatch) {
    pathPrefix = relativePathText.match(appName1)[1];
  }
  return pathPrefix;
}

function getRootLevelPrefix(pathPrefix) {
  return pathPrefix === "app" || pathPrefix === "tests" ? "(app|tests)" : null;
}

function showRelated() {
  const document =
    vscode.window.activeTextEditor && vscode.window.activeTextEditor.document;

  let prefix;
  let maybeWorkspaceFolder;
  let currentFilename;
  if (document) {
    currentFilename = document.fileName;
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    maybeWorkspaceFolder = workspaceFolder ? workspaceFolder.uri.path : "";
    const separator = path.sep;
    const config = vscode.workspace.getConfiguration("jumpBetweenRelatedFiles");

    prefix = buildPrefix(
      currentFilename,
      maybeWorkspaceFolder,
      separator,
      config
    );
  } else {
    prefix = "";
  }

  let pathPrefix = getPathPrefix(currentFilename);
  let entries = [currentFilename];

  const toMs = ([sec, nano]) => sec * 1000 + nano / 1000000;
  const start = process.hrtime(); // start

  let potentialEngineLibName = "";

  const pathPrefixRegex = new RegExp("(.*)/(addon|app|tests)/(.*)");
  const appPrefixNameMatch = vscode.workspace
    .asRelativePath(currentFilename)
    .match(pathPrefixRegex);

  if (appPrefixNameMatch) {
    pathPrefix = appPrefixNameMatch[1];

    // this is to match .scss files for patterns where css file names
    // are prefixed with either `_` or `_<engine-name>`
    const potentialEngineLibNameSplit = pathPrefix.split("/");
    potentialEngineLibName =
      potentialEngineLibNameSplit[potentialEngineLibNameSplit.length - 1];

    const prefixRegex = new RegExp(`(_)?(${potentialEngineLibName}-)?(.*)`);
    const prefixRegexMatch = prefix.match(prefixRegex);
    if (prefixRegexMatch) {
      prefix = prefixRegexMatch[3];
    }

    // There might be cases where there are multiple Ember projects within a single app.
    // We need to make sure that the pathPrefix is only the top level project and not an
    // engine/addon inside of the app.
    const potentialPrefix = getRootLevelPrefix(appPrefixNameMatch[2]);
    if (pathPrefix.split("/").length === 1 && potentialPrefix) {
      pathPrefix = path.join(pathPrefix, potentialPrefix);
    }
  } else {
    const potentialPrefix = getRootLevelPrefix(pathPrefix);
    pathPrefix = potentialPrefix
      ? potentialPrefix
      : vscode.workspace.asRelativePath(path.dirname(currentFilename));
  }

  // run the glob query
  try {
    entries = fg.sync(
      [
        `${maybeWorkspaceFolder}/${pathPrefix}/**/?(_)?(${potentialEngineLibName}-)${prefix}?(-test).{js,hbs,scss}`
      ],
      { dot: true, ignore: ["**/node_modules"] }
    );
  } catch (e) {
    entries = [currentFilename];
  }

  // move the current file to the top
  entries = [...entries.filter(item => item !== currentFilename)];

  const items = entries.map(item => {
    pathPrefix = getPathPrefix(item);
    const fileName = vscode.workspace.asRelativePath(item);
    return {
      url: Uri.file(item),
      rootPath: maybeWorkspaceFolder,
      label: determineLabelType(item, pathPrefix),
      description: fileName
    };
  });

  const placeholderText =
    items.length > 0
      ? `Related files to ${vscode.workspace.asRelativePath(
          currentFilename
        )} starting with most relevant`
      : `No Related Files found for ${vscode.workspace.asRelativePath(
          currentFilename
        )}`;
  window
    .showQuickPick(items, {
      placeHolder: placeholderText,
      matchOnDescription: true
    })
    .then(item => {
      if (item) {
        open(item);
      }
    });

  console.log(toMs(process.hrtime(start)).toFixed(2) + " ms");
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("jumpBetweenRelatedFiles.show", showRelated)
  );
}

module.exports.buildPrefix = buildPrefix;
module.exports.activate = activate;
