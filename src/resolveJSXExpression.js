// @flow

import {
  isStringLiteral,
  isIdentifier,
  isObjectExpression,
  isCallExpression,
  isVariableDeclarator,
  JSXAttribute
} from 'babel-types';
import getClassName from './getClassName';
import type {
  StyleModuleImportMapType,
  HandleMissingStyleNameOptionType
} from './types';

type OptionsType = {|
  handleMissingStyleName: HandleMissingStyleNameOptionType
|};

/**
 * Updates the className value of a JSX element using a provided styleName attribute.
 */
export default (
  path: *,
  styleModuleImportMap: StyleModuleImportMapType,
  sourceAttribute: JSXAttribute,
  destinationName: string,
  options: OptionsType): void => {
  const jsxExpression = sourceAttribute.value.expression;
  const replaceCallArguments = function (callExpressionArguments) {
    for (const argument of callExpressionArguments) {
      if (isStringLiteral(argument)) {
        argument.value = getClassName(argument.value, styleModuleImportMap, options);
      } else if (isObjectExpression(argument)) {
        for (const property of argument.properties) {
          if (isStringLiteral(property.key)) {
            property.key.value = getClassName(property.key.value, styleModuleImportMap, options);
          }
        }
      }
    }
  };

  if (isCallExpression(jsxExpression)) {
    replaceCallArguments(sourceAttribute.value.expression.arguments);
  } else if (isIdentifier(jsxExpression)) {
    const variableDeclaration = path.scope.getBinding(jsxExpression.name).path.node;

    if (isVariableDeclarator(variableDeclaration)) {
      if (isCallExpression(variableDeclaration.init)) {
        replaceCallArguments(variableDeclaration.init.arguments);
      }
    }
  }

  const destinationAttribute = path.node.openingElement.attributes
    .find((attribute) => {
      return typeof attribute.name !== 'undefined' && attribute.name.name === destinationName;
    });

  // the desination attribute cannot be already present on the Jsx
  if (destinationAttribute) {
    throw new Error('Destination Attribute cannot be present on JSX Element when using JSX Expressions');
  } else {
    sourceAttribute.name.name = destinationName;
  }
};
