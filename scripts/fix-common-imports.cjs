// scripts/fix-common-imports.cjs
// Utility script that analyzes `src/services/commonImportsService.ts`
// and automatically normalizes its re-exports so they match the actual
// exports of their source modules.

/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const projectRoot = path.resolve(__dirname, '..');
const commonImportsPath = path.join(projectRoot, 'src', 'services', 'commonImportsService.ts');

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

const exportInfoCache = new Map();

const fileExists = (filePath) => {
	try {
		fs.accessSync(filePath, fs.constants.F_OK);
		return true;
	} catch {
		return false;
	}
};

const resolveModulePath = (fromFile, specifier) => {
	if (!specifier) {
		return null;
	}

	const baseDir = path.dirname(fromFile);
	let tentative = path.resolve(baseDir, specifier);

	if (fileExists(tentative)) {
		return tentative;
	}

	for (const ext of SOURCE_EXTENSIONS) {
		if (fileExists(`${tentative}${ext}`)) {
			return `${tentative}${ext}`;
		}
	}

	for (const ext of SOURCE_EXTENSIONS) {
		const withExt = tentative.endsWith(ext) ? tentative : `${tentative}${ext}`;
		if (fileExists(withExt)) {
			return withExt;
		}
	}

	for (const ext of SOURCE_EXTENSIONS) {
		const indexPath = path.join(tentative, `index${ext}`);
		if (fileExists(indexPath)) {
			return indexPath;
		}
	}

	return null;
};

const getExportInfo = (filePath) => {
	if (exportInfoCache.has(filePath)) {
		return exportInfoCache.get(filePath);
	}

	const sourceText = fs.readFileSync(filePath, 'utf8');
	const sourceFile = ts.createSourceFile(
		filePath,
		sourceText,
		ts.ScriptTarget.Latest,
		true,
		filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
	);

	const info = {
		valueExports: new Set(),
		typeExports: new Set(),
		reExportedValues: new Set(),
		reExportedTypes: new Set(),
		hasDefaultExport: false,
	};

	const addValue = (name) => {
		if (name) {
			info.valueExports.add(name);
		}
	};
	const addType = (name) => {
		if (name) {
			info.typeExports.add(name);
		}
	};
	const addReExport = (name, isType) => {
		if (!name) {
			return;
		}
		if (isType) {
			info.reExportedTypes.add(name);
		} else {
			info.reExportedValues.add(name);
		}
	};

	const visit = (node) => {
		if (ts.isExportAssignment(node)) {
			if (!node.isExportEquals) {
				info.hasDefaultExport = true;
			}
		} else if (ts.isExportDeclaration(node)) {
			if (node.exportClause && ts.isNamedExports(node.exportClause)) {
				const isTypeOnly = !!node.isTypeOnly;
				node.exportClause.elements.forEach((element) => {
					addReExport(element.name.text, isTypeOnly);
				});
			} else if (!node.exportClause) {
				info.hasDefaultExport = true;
			}
		} else if (node.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword)) {
			const isDefault = node.modifiers.some((mod) => mod.kind === ts.SyntaxKind.DefaultKeyword);
			if (isDefault) {
				info.hasDefaultExport = true;
				if (node.name && ts.isIdentifier(node.name)) {
					addValue(node.name.text);
				}
			} else if (
				ts.isInterfaceDeclaration(node) ||
				ts.isTypeAliasDeclaration(node)
			) {
				addType(node.name.text);
			} else if (
				ts.isFunctionDeclaration(node) ||
				ts.isClassDeclaration(node) ||
				ts.isEnumDeclaration(node)
			) {
				addValue(node.name?.text);
			} else if (ts.isVariableStatement(node)) {
				node.declarationList.declarations.forEach((decl) => {
					if (ts.isIdentifier(decl.name)) {
						addValue(decl.name.text);
					}
				});
			}
		}
		ts.forEachChild(node, visit);
	};

	visit(sourceFile);
	exportInfoCache.set(filePath, info);
	return info;
};

const classifyExport = (exportInfo, exportName) => {
	if (exportInfo.valueExports.has(exportName) || exportInfo.reExportedValues.has(exportName)) {
		return 'value';
	}
	if (exportInfo.typeExports.has(exportName) || exportInfo.reExportedTypes.has(exportName)) {
		return 'type';
	}
	if (exportInfo.hasDefaultExport) {
		return 'default';
	}
	return 'missing';
};

const buildSpecifierString = (propertyName, exportName) => {
	if (propertyName && propertyName !== exportName) {
		return `${propertyName} as ${exportName}`;
	}
	return exportName;
};

const fixCommonImports = () => {
	if (!fileExists(commonImportsPath)) {
		console.error(`Could not locate common imports file at ${commonImportsPath}`);
		process.exit(1);
	}

	const sourceText = fs.readFileSync(commonImportsPath, 'utf8');
	const sourceFile = ts.createSourceFile(
		commonImportsPath,
		sourceText,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TS,
	);

	let updatedText = sourceText;
	const replacements = [];

	sourceFile.statements.forEach((node) => {
		if (!ts.isExportDeclaration(node)) {
			return;
		}

		if (!node.moduleSpecifier || !node.exportClause || !ts.isNamedExports(node.exportClause)) {
			return;
		}

		const originalText = sourceText.slice(node.getStart(sourceFile), node.getEnd());
		const leadingWhitespace = originalText.match(/^(\s*)export/);
		const indent = leadingWhitespace ? leadingWhitespace[1] : '';

		const moduleSpecifierText = node.moduleSpecifier.getText(sourceFile).slice(1, -1);
		const resolvedPath = resolveModulePath(commonImportsPath, moduleSpecifierText);

		if (!resolvedPath) {
			console.warn(`⚠️  Unable to resolve module specifier "${moduleSpecifierText}"`);
			return;
		}

		const exportInfo = getExportInfo(resolvedPath);

		const valueSpecifiers = [];
		const typeSpecifiers = [];
		const defaultSpecifiers = [];
		const missingSpecifiers = [];

		node.exportClause.elements.forEach((specifier) => {
			const propertyName = specifier.propertyName ? specifier.propertyName.text : specifier.name.text;
			const exportName = specifier.name.text;

			if (propertyName === 'default') {
				defaultSpecifiers.push(buildSpecifierString(propertyName, exportName));
				return;
			}

			const classification = classifyExport(exportInfo, propertyName);

			switch (classification) {
				case 'value': {
					const specString = buildSpecifierString(propertyName, exportName);
					valueSpecifiers.push(specString);
					break;
				}
				case 'type': {
					const specString = buildSpecifierString(propertyName, exportName);
					typeSpecifiers.push(specString);
					break;
				}
				case 'default':
					defaultSpecifiers.push(`default as ${exportName}`);
					break;
				default: {
					missingSpecifiers.push(buildSpecifierString(propertyName, exportName));
					break;
				}
			}
		});

		const newLines = [];

		if (valueSpecifiers.length > 0) {
			newLines.push(
				`${indent}export { ${valueSpecifiers.join(', ')} } from '${moduleSpecifierText}';`,
			);
		}

		if (typeSpecifiers.length > 0) {
			newLines.push(
				`${indent}export type { ${typeSpecifiers.join(', ')} } from '${moduleSpecifierText}';`,
			);
		}

		if (defaultSpecifiers.length > 0) {
			defaultSpecifiers.forEach((spec) => {
				newLines.push(`${indent}export { ${spec} } from '${moduleSpecifierText}';`);
			});
		}

		if (missingSpecifiers.length > 0) {
			missingSpecifiers.forEach((spec) => {
				console.warn(`⚠️  Could not classify export "${spec}" from "${moduleSpecifierText}".`);
			});
		}

		if (newLines.length === 0) {
			return;
		}

		const replacementText = newLines.join('\n');
		replacements.push({
			start: node.getStart(sourceFile),
			end: node.getEnd(),
			text: replacementText,
		});
	});

	if (replacements.length === 0) {
		console.log('No export declarations required changes.');
		return;
	}

	replacements.sort((a, b) => b.start - a.start);
	let workingText = updatedText;

	replacements.forEach(({ start, end, text }) => {
		workingText = `${workingText.slice(0, start)}${text}${workingText.slice(end)}`;
	});

	fs.writeFileSync(commonImportsPath, workingText);
	console.log(`✅ Updated ${commonImportsPath} with normalized re-exports.`);
};

fixCommonImports();

