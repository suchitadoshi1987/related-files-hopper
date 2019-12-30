const path = require("path");
const vscode = require("vscode");
const fg = require("fast-glob");
const {
  removePrefixSlash,
  getChildSubDir,
  getPrefixNameFromSpecialChars,
  getPipedRegexString,
  generateQuickPickItem,
  getConfig
} = require("./utils/helper");
const { workspace, window } = vscode;
const {
  appRootFolders,
  appSubRootFolders,
  appSubFolders,
  testsSubFolders,
  testSubRootFolders,
  testRootFolders
} = getConfig();

const appSubFolderRegexString = getPipedRegexString(appSubFolders);
const testSubFolderRegexString = getPipedRegexString(testsSubFolders);

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
    const config = vscode.workspace.getConfiguration("fileHopper");

    prefix = buildPrefix(
      currentFilename,
      maybeWorkspaceFolder,
      separator,
      config
    );
  } else {
    prefix = "";
  }

  let pathPrefix = vscode.workspace.asRelativePath(
    path.dirname(currentFilename)
  );

  let entries = [currentFilename];

  const toMs = ([sec, nano]) => sec * 1000 + nano / 1000000;
  const start = process.hrtime(); // start

  let potentialParentFolderName = "";

  // Construct the regex for app sub directories
  const appSubDirRegex = `${maybeWorkspaceFolder}(\/.*)?/${getPipedRegexString(
    appSubRootFolders
  )}(\/.*)?\/${appSubFolderRegexString}(\/.*)?\/(_)?${prefix}(-test)?.(js|hbs|scss)`;
  const appTestSubDirRegex = `${maybeWorkspaceFolder}(\/.*)?/${getPipedRegexString(testSubRootFolders)}(\/.*)?\/${testSubFolderRegexString}(\/${appSubFolderRegexString})?(\/.*)?\/(_)?${prefix}(-test)?.(js|hbs|scss)`;

  let parentSubDir;
  let appPrefixNameMatch1 = currentFilename.match(appSubDirRegex);
  let appPrefixNameMatch2 = currentFilename.match(appTestSubDirRegex);

  let childSubDir =
    getChildSubDir(appPrefixNameMatch1, appPrefixNameMatch2) ||
    `(${appSubFolderRegexString}|${testSubFolderRegexString})`;

  let folderRegexMatch = appPrefixNameMatch1 || appPrefixNameMatch2;
  if (folderRegexMatch) {
    parentSubDir = removePrefixSlash(folderRegexMatch[1]);
    pathPrefix = folderRegexMatch[2];
  }

  // This is for the sub directories in the app like app within addons etc.
  if (parentSubDir && parentSubDir.split("/").length > 1) {
    pathPrefix = parentSubDir;
  } else {
    let potentialPrefix;

    // There might be cases where there are multiple projects within a single app.
    // We need to make sure that the pathPrefix is only the top level project and not an
    // engine/addon inside of the app.
    if (folderRegexMatch) {
      const rootLevelFolders = [...new Set([].concat(appRootFolders, testRootFolders))];
      const rootLevelPrefixRegexString = rootLevelFolders.includes(
        folderRegexMatch[2]
      )
        ? getPipedRegexString(rootLevelFolders)
        : null;
      potentialPrefix = rootLevelPrefixRegexString;
      if (parentSubDir && parentSubDir.split("/").length === 1) {
        potentialPrefix = path.join(parentSubDir, rootLevelPrefixRegexString);
      }
    }
    pathPrefix = potentialPrefix
      ? potentialPrefix
      : vscode.workspace.asRelativePath(path.dirname(currentFilename));

    const prefixRegex = new RegExp(`(_)?(.*)`);
    const prefixRegexMatch = prefix.match(prefixRegex);
    if (prefixRegexMatch) {
      prefix = prefixRegexMatch[2];
    }
  }

  // this is to match .scss files for patterns where css file names
  // are prefixed with either `_` or `_<folder-name>`
  const potentialParentFolderNameSplit = pathPrefix.split("/");
  potentialParentFolderName =
    potentialParentFolderNameSplit[potentialParentFolderNameSplit.length - 1];

  prefix = getPrefixNameFromSpecialChars(
    "_",
    potentialParentFolderName,
    prefix
  );

  let globPrefix = childSubDir
    ? `${maybeWorkspaceFolder}/${pathPrefix}/**/${childSubDir}/`
    : `${maybeWorkspaceFolder}/${pathPrefix}/**/`;

  // run the glob query
  try {
    entries = fg.sync(
      [
        `${globPrefix}?(_)?(${potentialParentFolderName}-)${prefix}?(-test).{js,hbs,scss}`
      ],
      { dot: true, ignore: ["**/node_modules"] }
    );
  } catch (e) {
    entries = [currentFilename];
  }

  // move the current file to the top
  entries = [...entries.filter(item => item !== currentFilename)];

  const items = entries.map(generateQuickPickItem);

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
    vscode.commands.registerCommand("fileHopper.show", showRelated)
  );
}

module.exports.buildPrefix = buildPrefix;
module.exports.activate = activate;
