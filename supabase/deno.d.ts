// Type definitions for Deno runtime and modules
declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    toObject(): { [key: string]: string };
  }
  
  export const env: Env;
}

// Type definitions for Deno modules
declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (request: Request) => Response | Promise<Response>): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export interface SupabaseClient {
    from: (table: string) => any;
    auth: {
      getSession(): Promise<any>;
    };
  }
  
  export function createClient(url: string, key: string, options?: any): SupabaseClient;
}

declare module "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts" {
  export class DOMParser {
    parseFromString(text: string, type: string): Document;
  }
  
  export interface Document {
    querySelectorAll(selectors: string): NodeList;
  }
  
  export interface NodeList {
    [Symbol.iterator](): Iterator<Element>;
    length: number;
  }
  
  export interface Element {
    querySelector(selectors: string): Element | null;
    querySelectorAll(selectors: string): NodeList;
    getAttribute(name: string): string | null;
    textContent: string | null;
  }
}

declare module "https://deno.land/x/xml@2.1.1/mod.ts" {
  export function parse(xml: string, options?: {
    reviveNumbers?: boolean;
    reviveBooleans?: boolean;
    reviveDates?: boolean;
    reviveUndefined?: boolean;
    parseAttributeValue?: boolean;
    cdataAsText?: boolean;
    treatNullAsEmptyString?: boolean;
    treatEmptyStringAsNull?: boolean;
    treatNullAsEmptyObject?: boolean;
    treatEmptyObjectAsNull?: boolean;
    treatNullAsEmptyArray?: boolean;
    treatEmptyArrayAsNull?: boolean;
    preserveAttributes?: boolean;
    preserveDocumentInfo?: boolean;
    preserveComment?: boolean;
    preserveCdata?: boolean;
    preserveSpace?: boolean;
    preserveOrder?: boolean;
    preserveRoot?: boolean;
    preserveLeadingSpace?: boolean;
    preserveTrailingSpace?: boolean;
    preserveNamespaceAttributes?: boolean;
    preserveNamespacePrefix?: boolean;
    preserveNamespaceUri?: boolean;
    preserveNamespaceLocalName?: boolean;
    preserveNamespaceQualifiedName?: boolean;
    preserveNamespaceQualifiedAttributes?: boolean;
    preserveNamespaceQualifiedValues?: boolean;
    preserveNamespaceQualifiedLocalName?: boolean;
    preserveNamespaceQualifiedUri?: boolean;
    preserveNamespaceQualifiedPrefix?: boolean;
    preserveNamespaceQualifiedOrder?: boolean;
    preserveNamespaceQualifiedRoot?: boolean;
    preserveNamespaceQualifiedLeadingSpace?: boolean;
    preserveNamespaceQualifiedTrailingSpace?: boolean;
    preserveNamespaceQualifiedComment?: boolean;
    preserveNamespaceQualifiedCdata?: boolean;
    preserveNamespaceQualifiedDocumentInfo?: boolean;
    preserveNamespaceQualifiedAttributes?: boolean;
    preserveNamespaceQualifiedValues?: boolean;
    preserveNamespaceQualifiedLocalName?: boolean;
    preserveNamespaceQualifiedUri?: boolean;
    preserveNamespaceQualifiedPrefix?: boolean;
    preserveNamespaceQualifiedOrder?: boolean;
    preserveNamespaceQualifiedRoot?: boolean;
    preserveNamespaceQualifiedLeadingSpace?: boolean;
    preserveNamespaceQualifiedTrailingSpace?: boolean;
    preserveNamespaceQualifiedComment?: boolean;
    preserveNamespaceQualifiedCdata?: boolean;
    preserveNamespaceQualifiedDocumentInfo?: boolean;
  }): any;
} 