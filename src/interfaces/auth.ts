import type { ISODateString } from '@/interfaces/common';
import type { IOrganization } from '@/interfaces/organization';

/* -------------------------------------------------------------------------- */
/* Tokens                                                                      */
/* -------------------------------------------------------------------------- */

export interface TokenPayload {
  token: string;
  expires: ISODateString;
}

export interface Access {
  access: TokenPayload;
  refresh: TokenPayload;
}

/* -------------------------------------------------------------------------- */
/* Session                                                                     */
/*                                                                             */
/* NOTE: the account model is not defined yet — no roles, statuses, providers  */
/* or login payloads are modelled here on purpose. These two interfaces exist  */
/* only so the token store and the refresh interceptor in `services/base.ts`   */
/* have something to hold. Widen them once the real account shape lands.       */
/* -------------------------------------------------------------------------- */

export interface IAuth {
  id: string;
  email: string;
}

export interface IUser {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}

/* -------------------------------------------------------------------------- */
/* Store contract                                                              */
/* -------------------------------------------------------------------------- */

interface authStore {
  access?: TokenPayload;
  refresh?: TokenPayload;
  auth: IAuth | null;
  user: IUser | null;
  organization: IOrganization | null;
  hydrated: boolean;
}

export interface IAuthStore extends authStore {
  initUserStore: (payload: {
    auth: IAuth;
    user: IUser;
    organization: IOrganization;
    tokens: Access;
  }) => void;
  setAccess: (tokens: Access) => void;
  setAccount: (payload: {
    auth?: IAuth;
    user?: IUser;
    organization?: IOrganization;
  }) => void;
  setHydrated: () => void;
  logoutAccount: () => void;
}
