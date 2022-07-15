/* eslint-disable @typescript-eslint/naming-convention */
/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export type ObjectDefinition = (GenericDefinition & WithComment) & {
  properties: PropertyDefinition[];
  interfaces: InterfaceImplementedDefinition[];
};
export type GenericDefinition = WithKind & {
  type: string;
  name?: string | null;
  required?: boolean | null;
};
export type PropertyDefinition = WithComment & AnyDefinition;
export type AnyDefinition = GenericDefinition & {
  array?: ArrayDefinition | null;
  scalar?: ScalarDefinition | null;
  map?: MapDefinition | null;
  object?: ObjectRef | null;
  enum?: EnumRef | null;
  unresolvedObjectOrEnum?: UnresolvedObjectOrEnumRef | null;
};
export type ArrayDefinition = AnyDefinition & {
  item?: GenericDefinition;
};
export type ScalarDefinition = GenericDefinition & {
  type:
    | "UInt"
    | "UInt8"
    | "UInt16"
    | "UInt32"
    | "Int"
    | "Int8"
    | "Int16"
    | "Int32"
    | "String"
    | "Boolean"
    | "Bytes"
    | "BigInt"
    | "BigNumber"
    | "JSON";
};
export type MapDefinition = AnyDefinition &
  WithComment & {
    key?: MapKeyDefinition;
    value?: GenericDefinition;
  };
export type MapKeyDefinition = AnyDefinition & {
  type?: "UInt" | "UInt8" | "UInt16" | "UInt32" | "Int" | "Int8" | "Int16" | "Int32" | "String";
};
export type ObjectRef = GenericDefinition;
export type EnumRef = GenericDefinition;
export type UnresolvedObjectOrEnumRef = GenericDefinition;
export type InterfaceImplementedDefinition = GenericDefinition;
export type ModuleDefinition = (GenericDefinition & WithComment) & {
  methods: [] | [MethodDefinition];
  imports: [] | [ImportedModuleRef];
  interfaces: [] | [InterfaceImplementedDefinition];
};
export type MethodDefinition = (GenericDefinition & WithComment) & {
  arguments: [] | [PropertyDefinition];
  env?: {
    required?: boolean;
  };
  return: PropertyDefinition;
};
export type EnumDefinition = (GenericDefinition & WithComment) & {
  constants: string[];
};
export type InterfaceDefinition = (GenericDefinition & ImportedDefinition) & {
  capabilities: CapabilityDefinition;
};
export type ImportedObjectDefinition = (GenericDefinition & WithComment) & ImportedDefinition & WithComment;
export type ImportedModuleDefinition = (GenericDefinition & ImportedDefinition & WithComment) & {
  methods: [] | [GenericDefinition & WithComment];
  isInterface?: boolean | null;
};
export type ImportedEnumDefinition = (GenericDefinition & WithComment) & ImportedDefinition & WithComment;
export type ImportedEnvDefinition = ImportedObjectDefinition;
export type EnvDefinition = GenericDefinition & WithComment;

export interface WrapManifest {
  /**
   * WRAP Standard Version
   */
  version: "0.1.0";
  /**
   * Wrapper Package Type
   */
  type: "wasm" | "interface";
  /**
   * Wrapper Name
   */
  name: string;
  abi: Abi;
}
export interface Abi {
  objectTypes: ObjectDefinition[];
  moduleType?: ModuleDefinition;
  enumTypes: EnumDefinition[];
  interfaceTypes: InterfaceDefinition[];
  importedObjectTypes: ImportedObjectDefinition[];
  importedModuleTypes: ImportedModuleDefinition[];
  importedEnumTypes: ImportedEnumDefinition[];
  importedEnvTypes: ImportedEnvDefinition[];
  envType?: EnvDefinition;
}
export interface WithKind {
  kind: number;
}
export interface WithComment {
  comment?: string;
}
export interface ImportedModuleRef {
  type?: string;
}
export interface ImportedDefinition {
  uri: string;
  namespace: string;
  nativeType: string;
}
export interface CapabilityDefinition {
  getImplementations?: {
    enabled: boolean;
  };
}
