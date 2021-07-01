import { Box, Icon, Row, Text } from '@tlon/indigo-react';
import { Contacts, Invites } from '@urbit/api';
import React, { Component, ReactElement } from 'react';
import defaultApps from '~/logic/lib/default-apps';
import Sigil from '~/logic/lib/sigil';
import { cite, uxToHex } from '~/logic/lib/util';
import { IconRef } from '~/types/util';
import withState from '~/logic/lib/withState';
import useContactState from '~/logic/state/contact';
import useHarkState from '~/logic/state/hark';
import useLaunchState from '~/logic/state/launch';
import useInviteState from '~/logic/state/invite';

function OmniboxResultChord(props: {
  label: string;
  modifier?: string;

}) {
  const { label, modifier } = props;

  return (
    <Text display={['none', 'inline']} color="white" ml="2">
      {label}
      { modifier ? (<Text display="inline-block" ml="1" p="1" borderRadius="1" color="blue" backgroundColor="white">{modifier}</Text>) : null}
      <Text display="inline-block" ml="1" color="blue" borderRadius="1" p="1" backgroundColor="white">↩</Text>
    </Text>
  );
}

interface OmniboxResultProps {
  contacts: Contacts;
  cursor: string;
  icon: string;
  invites: Invites;
  link: string;
  navigate: () => void;
  notificationsCount: number;
  runtimeLag: any;
  selected: string;
  setSelection: () =>  void;
  subtext: string;
  text: string;
  shiftLink?: string;
  shiftDescription?: string;
  description?: string;
}

interface OmniboxResultState {
  isSelected: boolean;
  hovered: boolean;
}

export class OmniboxResult extends Component<OmniboxResultProps, OmniboxResultState> {
  result: React.RefObject<typeof Row>;
  constructor(props: OmniboxResultProps) {
    super(props);
    this.state = {
      isSelected: false,
      hovered: false
    };
    this.setHover = this.setHover.bind(this);
    this.result = React.createRef();
  }

  componentDidUpdate(prevProps: OmniboxResultProps): void {
    const { props, state } = this;
    if (
      prevProps &&
      !state.hovered &&
      prevProps.selected !== props.selected &&
      props.selected === props.link
      && this.result.current
    ) {
      // @ts-ignore ref is forwarded as never, investigate later
      this.result.current.scrollIntoView({ block: 'nearest' });
    }
  }

  getIcon(
    icon: string,
    selected: string,
    link: string,
    invites: Invites,
    lag: any,
    notificationsCount: number,
    text: string,
    color: string
  ): (any) {
    const iconFill =
      (this.state.hovered || selected === link) ? 'white' : 'black';
    const bulletFill =
      (this.state.hovered || selected === link) ? 'white' : 'blue';
    const lagFill =
      this.state.hovered || selected === link ? 'white' : 'yellow';
    const inviteCount = [].concat(
      ...Object.values(invites).map(obj => Object.values(obj))
    );

    let graphic: ReactElement = <div />;
    if (
      defaultApps.includes(icon.toLowerCase()) ||
      icon.toLowerCase() === 'links' ||
      icon.toLowerCase() === 'terminal' ||
      icon === 'btc-wallet'
    ) {
      if (icon === 'Link') {
        icon = 'Collection';
      } else if (icon === 'Terminal') {
        icon = 'Dojo';
      } else if (icon === 'btc-wallet') {
        icon = 'Bitcoin';
      }
      graphic = (
        <Icon
          display='inline-block'
          verticalAlign='middle'
          icon={icon as IconRef}
          mr={2}
          size='18px'
          color={iconFill}
        />
      );
    } else if (icon === 'inbox') {
      graphic = (
        <Box display='flex' verticalAlign='middle' position='relative'>
          <Icon
            display='inline-block'
            verticalAlign='middle'
            icon='Notifications'
            mr={2}
            size='18px'
            color={iconFill}
          />
          {lag && (
            <Icon
              display='inline-block'
              icon='Bullet'
              style={{ position: 'absolute', top: -5, left: 5 }}
              color={lagFill}
            />
          )}
          {(notificationsCount > 0 || inviteCount.length > 0) && (
            <Icon
              display='inline-block'
              icon='Bullet'
              style={{ position: 'absolute', top: -5, left: 5 }}
              color={bulletFill}
            />
          )}
        </Box>
      );
    } else if (icon === 'logout') {
      graphic = (
        <Icon
          display='inline-block'
          verticalAlign='middle'
          icon='LogOut'
          mr={2}
          size='18px'
          color={iconFill}
        />
      );
    } else if (icon === 'profile') {
      text = text.startsWith('Profile') ? window.ship : text;
      graphic = (
        <Sigil
          color={color}
          classes='dib flex-shrink-0 v-mid mr2'
          ship={text}
          size={18}
          icon
          padding={2}
        />
      );
    } else if (icon === 'home') {
      graphic = (
        <Icon
          display='inline-block'
          verticalAlign='middle'
          icon='Home'
          mr={2}
          size='18px'
          color={iconFill}
        />
      );
    } else if (icon === 'notifications') {
      graphic = (
        <Icon
          display='inline-block'
          verticalAlign='middle'
          icon='Notifications'
          mr={2}
          size='18px'
          color={iconFill}
        />
      );
    } else if (icon === 'messages') {
      graphic = (
        <Icon
          display='inline-block'
          verticalAlign='middle'
          icon='Messages'
          mr={2}
          size='18px'
          color={iconFill}
        />
      );
    } else if (icon === 'tutorial') {
      graphic = (
        <Icon
          display='inline-block'
          verticalAlign='middle'
          icon='Tutorial'
          mr={2}
          size='18px'
          color={iconFill}
        />
      );
    } else {
      graphic = (
        <Icon
          display='inline-block'
          icon='NullIcon'
          verticalAlign='middle'
          mr={2}
          size='16px'
          color={iconFill}
        />
      );
    }

    return graphic;
  }

  setHover(boolean: boolean): void {
    this.setState({ hovered: boolean });
  }

  render(): ReactElement {
    const {
      icon,
      text,
      subtext,
      link,
      cursor,
      navigate,
      selected,
      invites,
      notificationsCount,
      runtimeLag,
      contacts,
      setSelection,
      shiftDescription,
      description = 'Go',
      shiftLink
    } = this.props;

    const color = contacts?.[text]
      ? `#${uxToHex(contacts[text].color)}`
      : '#000000';
    const graphic = this.getIcon(
      icon,
      selected,
      link,
      invites,
      runtimeLag,
      notificationsCount,
      text,
      color
    );

    return (
      <Row
        p={1}
        cursor={cursor}
        onMouseMove={() => setSelection()}
        onMouseLeave={() => this.setHover(false)}
        backgroundColor={
          this.state.hovered || selected === link ? 'blue' : 'white'
        }
        onClick={navigate}
        width='100%'
        height="32px"
        alignItems="center"
        justifyContent='space-between'
        // @ts-ignore indigo-react doesn't allow us to pass refs
        ref={this.result}
      >
        <Box
          display='flex'
          verticalAlign='middle'
          maxWidth='60%'
          flexShrink={0}
        >
          {graphic}
          <Text
            mono={icon == 'profile' && text.startsWith('~')}
            color={this.state.hovered || selected === link ? 'white' : 'black'}
            display='inline-block'
            verticalAlign='middle'
            width='100%'
            overflow='hidden'
            textOverflow='ellipsis'
            whiteSpace='pre'
            mr={1}
          >
            {text.startsWith('~') ? cite(text) : text}
          </Text>
        </Box>

        <Text
          pr={1}
          display='inline-block'
          verticalAlign='middle'
          color={this.state.hovered || selected === link ? 'white' : 'black'}
          width='100%'
          minWidth={0}
          textOverflow='ellipsis'
          whiteSpace='pre'
          overflow='hidden'
          maxWidth='60%'
          textAlign='right'
        >
          {(selected === link) ? (
            <>
              <OmniboxResultChord label={description} />
              {(shiftLink && shiftDescription) ? (<OmniboxResultChord label={shiftDescription} modifier="Shift" />) : null}
            </>
          ) : subtext}
        </Text>
      </Row>
    );
  }
}

export default withState(OmniboxResult, [
  [useLaunchState, ['runtimeLag']],
  [useInviteState],
  [useHarkState, ['notificationsCount']],
  [useContactState]
]);
