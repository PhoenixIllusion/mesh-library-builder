
interface SyntaxError {
  expected: string;
  found: string;
  location: string;
  name: "SyntaxError";
}

declare const StartRules: string[];

interface ParseOptions {
  grammarSource?: string;
  startRule?: string;
}

export interface PropFunction {
  method: string;
  args: any[]
}

export type PropVal = string | number | boolean | PropFunction | object;

export interface Block {
  block: {
    type: string;
    attr: [string,string][]
  },
  props: [
    [string, PropVal]
  ]
}

declare function parse(input: string, options?: ParseOptions): Block[];

export {
  StartRules,
  SyntaxError,
  parse
};