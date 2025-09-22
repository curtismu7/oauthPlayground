/**
 * Type definitions for URL utility functions
 */

export type QueryParams = Record<string, string | number | boolean | null | undefined>;
export type HashParams = Record<string, string>;

export interface URLParseOptions {
  /**
   * Whether to parse arrays in query strings (e.g., "a=1&a=2" => { a: [1, 2] })
   * @default false
   */
  parseArrays?: boolean;
  
  /**
   * Whether to parse numbers in query strings (e.g., "a=1" => { a: 1 })
   * @default true
   */
  parseNumbers?: boolean;
  
  /**
   * Whether to parse booleans in query strings (e.g., "a=true" => { a: true })
   * @default true
   */
  parseBooleans?: boolean;
}

export interface URLBuildOptions {
  /**
   * Whether to encode the URL
   * @default true
   */
  encode?: boolean;
  
  /**
   * Whether to include undefined values in the query string
   * @default false
   */
  skipNull?: boolean;
  
  /**
   * Array format for repeated parameters
   * - 'bracket': `a[]=1&a[]=2`
   * - 'index': `a[0]=1&a[1]=2`
   * - 'comma': `a=1,2`
   * - 'separator': `a=1&a=2`
   * - 'none': `a=1` (last value wins)
   * @default 'none'
   */
  arrayFormat?: 'bracket' | 'index' | 'comma' | 'separator' | 'none';
}

export interface URLObject extends URL {
  query: QueryParams;
  hashParams: HashParams;
}
