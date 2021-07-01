import _ from 'lodash';
import React, { useRef, ReactNode } from 'react';
import urbitOb from 'urbit-ob';
import { Icon, Row, Box, Text, BaseImage } from '@tlon/indigo-react';
import { Association, cite } from '@urbit/api';
import { HoverBoxLink } from '~/views/components/HoverBox';
import { Sigil } from '~/logic/lib/sigil';
import { useTutorialModal } from '~/views/components/useTutorialModal';
import { TUTORIAL_HOST, TUTORIAL_GROUP } from '~/logic/lib/tutorialModal';
import { Workspace } from '~/types/workspace';
import useContactState, { useContact } from '~/logic/state/contact';
import { getItemTitle, getModuleIcon, uxToHex } from '~/logic/lib/util';
import useGroupState from '~/logic/state/group';
import Dot from '~/views/components/Dot';
import { SidebarAppConfigs } from './types';
import { useHarkDm } from '~/logic/state/hark';
import useSettingsState from '~/logic/state/settings';

function SidebarItemBase(props: {
  to: string;
  selected: boolean;
  hasNotification: boolean;
  hasUnread: boolean;
  isSynced?: boolean;
  children: ReactNode;
  title: string | ReactNode;
  mono?: boolean;
}) {
  const {
    title,
    children,
    to,
    selected,
    hasNotification,
    hasUnread,
    isSynced = false,
    mono = false
  } = props;
  const color = isSynced ? (hasUnread || hasNotification) ? 'black' : 'gray' : 'lightGray';

  const fontWeight = hasUnread || hasNotification ? '500' : 'normal';

  return (
    <HoverBoxLink
      // ref={anchorRef}
      to={to}
      bg="white"
      bgActive="washedGray"
      width="100%"
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      py={1}
      pl={3}
      pr={3}
      selected={selected}
    >
      <Row width="100%" alignItems="center" flex="1 auto" minWidth="0">
        {hasNotification && (
          <Text
            color="black"
            marginLeft={-2}
            width={2}
            display="flex"
            alignItems="center"
          >
            <Dot />
          </Text>
        )}
        {children}

        <Box
          width="100%"
          flexShrink={2}
          ml={2}
          display="flex"
          overflow="hidden"
        >
          <Text
            lineHeight="tall"
            display="inline-block"
            flex="1"
            overflow="hidden"
            width="100%"
            mono={mono}
            color={color}
            fontWeight={fontWeight}
            style={{ textOverflow: 'ellipsis', whiteSpace: 'pre' }}
          >
            {title}
          </Text>
        </Box>
      </Row>
    </HoverBoxLink>
  );
}

export function SidebarDmItem(props: {
  ship: string;
  selected?: boolean;
  workspace: Workspace;
}) {
  const { ship, selected = false } = props;
  const contact = useContact(ship);
  const { hideAvatars, hideNicknames }  = useSettingsState(s => s.calm);
  const title = (!hideNicknames && contact?.nickname)
    ? contact?.nickname
    : (cite(ship) ?? ship);
  const { unreads } = useHarkDm(ship) || { unreads: 0 };
  const img =
    contact?.avatar && !hideAvatars ? (
      <BaseImage
        referrerPolicy="no-referrer"
        src={contact.avatar}
        width="16px"
        height="16px"
        borderRadius={2}
      />
    ) : (
      <Sigil
        ship={ship}
        color={`#${uxToHex(contact?.color || '0x0')}`}
        icon
        padding={2}
        size={16}
      />
    );

  return (
    <SidebarItemBase
      selected={selected}
      hasNotification={false}
      hasUnread={(unreads as number) > 0}
      to={`/~landscape/messages/dm/${ship}`}
      title={title}
      mono={hideAvatars || !contact?.nickname}
      isSynced
    >
      {img}
    </SidebarItemBase>
  );
}
// eslint-disable-next-line max-lines-per-function
export function SidebarAssociationItem(props: {
  hideUnjoined: boolean;
  association: Association;
  path: string;
  selected: boolean;
  apps: SidebarAppConfigs;
  workspace: Workspace;
}) {
  const { association, path, selected, apps } = props;
  const title = getItemTitle(association) || '';
  const appName = association?.['app-name'];
  let mod = appName;
  if (association?.metadata?.config && 'graph' in association.metadata.config) {
    mod = association.metadata.config.graph;
  }
  const rid = association?.resource;
  const groupPath = association?.group;
  const groups = useGroupState(state => state.groups);
  const { hideNicknames } = useSettingsState(s => s.calm);
  const contacts = useContactState(s => s.contacts);
  const anchorRef = useRef<HTMLAnchorElement>(null);
  useTutorialModal(
    mod as any,
    groupPath === `/ship/${TUTORIAL_HOST}/${TUTORIAL_GROUP}`,
    anchorRef
  );
  const app = apps[appName];
  const isUnmanaged = groups?.[groupPath]?.hidden || false;
  if (!app) {
    return null;
  }
  const DM = isUnmanaged && props.workspace?.type === 'messages';
  const itemStatus = app.getStatus(path);
  const hasNotification = itemStatus === 'notification';
  const hasUnread = itemStatus === 'unread';
  const isSynced = itemStatus !== 'unsubscribed';
  let baseUrl = `/~landscape${groupPath}`;

  if (DM) {
    baseUrl = '/~landscape/messages';
  } else if (isUnmanaged) {
    baseUrl = '/~landscape/home';
  }

  const to = isSynced
    ? `${baseUrl}/resource/${mod}${rid}`
    : `${baseUrl}/join/${mod}${rid}`;

  if (props.hideUnjoined && !isSynced) {
    return null;
  }

  const participantNames = (str: string) => {
    const color = isSynced ? (hasUnread || hasNotification) ? 'black' : 'gray' : 'lightGray';
    if (_.includes(str, ',') && _.startsWith(str, '~')) {
      const names = _.split(str, ', ');
      return names.map((name, idx) => {
        if (urbitOb.isValidPatp(name)) {
          if (contacts[name]?.nickname && !hideNicknames)
            return (
              <Text key={name} bold={hasUnread} color={color}>
                {contacts[name]?.nickname}
                {idx + 1 != names.length ? ', ' : null}
              </Text>
            );
          return (
            <Text key={name} mono bold={hasUnread} color={color}>
              {name}
              <Text color={color}>
                {idx + 1 != names.length ? ', ' : null}
              </Text>
            </Text>
          );
        } else {
          return name;
        }
      });
    } else {
      return str;
    }
  };

  return (
    <SidebarItemBase
      to={to}
      selected={selected}
      hasUnread={hasUnread}
      isSynced={isSynced}
      title={
        DM && !urbitOb.isValidPatp(title)
          ? participantNames(title)
          : title
      }
      hasNotification={hasNotification}
    >
      {DM ? (
        <Box
          flexShrink={0}
          height={16}
          width={16}
          borderRadius={2}
          backgroundColor={
            `#${uxToHex(props?.association?.metadata?.color)}` || '#000000'
          }
        />
      ) : (
        <Icon
          display="block"
          color={isSynced ? 'black' : 'lightGray'}
          icon={getModuleIcon(mod)}
        />
      )}
    </SidebarItemBase>
  );
}
