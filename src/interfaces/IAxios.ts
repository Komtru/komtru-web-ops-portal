/**
 * Argument shapes for the HTTP facade in `@/services/base`.
 * Every facade method takes exactly one object argument.
 */

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined | Array<string | number>
>;

export type Headers = Record<string, string>;

/** Base shape — `delete` needs a body often enough to sit at the root. */
export interface IDelete {
  url: string;
  body?: unknown;
  headers?: Headers;
}

export interface IPost extends IDelete {
  query?: QueryParams;
}

export type IPatch = IPost;
export type IPut = IPost;

export interface IGet {
  url: string;
  query?: QueryParams;
  headers?: Headers;
}

export interface IPostMultipart {
  url: string;
  data: FormData;
  query?: QueryParams;
  headers?: Headers;
}

/** Standard success envelope returned by the Komtru API. */
export interface IResponse<D> {
  status: boolean;
  message: string;
  data: D;
}

/** Standard error envelope. Callers read `err.message`. */
export interface RequestError {
  status: false;
  code?: string;
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}

/** A downloaded blob plus the filename parsed from `content-disposition`. */
export interface IBlobResponse {
  blob: Blob;
  filename: string;
  contentType: string;
}
