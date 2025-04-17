import { dBind, Directive, getDirectivesMap } from "./createDirective";
import { dClass } from "./dClass";
import { dFor } from "./dFor";
import { dHtml } from "./dHtml";
import { dElse, dIf } from "./dIf";
import { dModel } from "./dModel";
import { dRef } from "./dRef";
import { dStyle } from "./dStyle";

const standardDirectives: Directive[] = [
  dBind,
  dClass,
  dFor,
  dIf,
  dModel,
  dRef,
  dHtml,
  dElse,
  dStyle,
];
const standardDirectivesMap = getDirectivesMap(standardDirectives);

export {
  standardDirectives,
  standardDirectivesMap,
  dBind,
  dClass,
  dFor,
  dIf,
  dModel,
  dRef,
  dHtml,
  dElse,
  dStyle,
};
