import { Contact, Patp, Rolodex } from '@urbit/api';
import { useCallback } from 'react';
import { BaseState, createState } from './base';

export interface ContactState extends BaseState<ContactState> {
  contacts: Rolodex;
  isContactPublic: boolean;
  nackedContacts: Set<Patp>;
  // fetchIsAllowed: (entity, name, ship, personal) => Promise<boolean>;
}

// @ts-ignore investigate zustand types
const useContactState = createState<ContactState>('Contact', {
  contacts: {},
  nackedContacts: new Set(),
  isContactPublic: false
  // fetchIsAllowed: async (
  //   entity,
  //   name,
  //   ship,
  //   personal
  // ): Promise<boolean> => {
  //   const isPersonal = personal ? 'true' : 'false';
  //   const api = useApi();
  //   return api.scry({
  //     app: 'contact-store',
  //     path: `/is-allowed/${entity}/${name}/${ship}/${isPersonal}`
  //   });
  // },
}, ['nackedContacts']);

export function useContact(ship: string) {
  return useContactState(
    useCallback(s => s.contacts[ship] as Contact | null, [ship])
  );
}

export function useOurContact() {
  return useContact(`~${window.ship}`);
}

export default useContactState;
