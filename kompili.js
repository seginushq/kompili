/**
 * Kompili - An extended TypeScript Compiler
 *
 * Copyright (c) 2015 TADOKORO Saneyuki, Seginus.
 */

var ts = require('typescript');
var glob = require('glob');

exports.compile = function (options) {
  var program = ts.createProgram(options.files, options.compilerOptions);
  var emitResult = program.emit();

  var allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

  allDiagnostics.forEach(function (diagnostic) {
    var info = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    var message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    console.log(diagnostic.file.fileName
      + ' (' + (info.line + 1) + ',' + (info.character + 1) + '): ' + message);
  });

  var exitCode = emitResult.emitSkipped ? 1 : 0;

  console.log('Process exiting with code ' + exitCode + '.');

  process.exit(exitCode);
};

exports.readConfig = function (confPath) {
  var tsconfig = require(confPath);

  return {
    files: getFiles(tsconfig),
    compilerOptions: getCompilerOptions(tsconfig)
  };
};

function getFiles(tsconfig) {
  var files = tsconfig.files ? Array.prototype.slice.apply(tsconfig.files) : [];
  var filesGlob = tsconfig.filesGlob;
  var pattern = filesGlob.join(',');

  if (filesGlob.length > 1)
    pattern = '{' + pattern + '}';

  var result = glob.sync(pattern, {mark: true});
  Array.prototype.push.apply(files, result);

  return files;
}

function getCompilerOptions(tsconfig) {
  var options = tsconfig.compilerOptions;
  var compilerOptions = {};
  var key, parsed;

  for (key in options) {
    if (key === 'target') {
      parsed = getScriptTarget(options.target);
      if (ts.ScriptTarget.hasOwnProperty(parsed))
        compilerOptions.target = ts.ScriptTarget[parsed];
    } else if (key === 'module') {
      parsed = getModuleKind(options.module);
      if (ts.ModuleKind.hasOwnProperty(parsed))
      compilerOptions.module = ts.ModuleKind[parsed];
    } else if (options.hasOwnProperty(key)) {
      compilerOptions[key] = options[key];
    }
  }

  return compilerOptions;
}

function getScriptTarget(target) {
  return target.toUpperCase();
}

function getModuleKind(module) {
  return module.replace(/commonjs/i, 'CommonJS').replace(/amd/i, 'AMD');
}
