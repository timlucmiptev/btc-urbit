import { Button, LoadingSpinner, Text } from '@tlon/indigo-react';
import React from 'react';

const ReconnectButton = ({ connection, subscription }) => {
  const connectedStatus = connection || 'connected';
  const reconnect = subscription.restart.bind(subscription);

  if (connectedStatus === 'disconnected') {
    return (
      <Button onClick={reconnect} borderColor='red' px={2}>
        <Text display={['none', 'inline']} textAlign='center' color='red'>Reconnect</Text>
        <Text color='red'> ↻</Text>
      </Button>
    );
  } else if (connectedStatus === 'reconnecting') {
    return (
      <Button borderColor='yellow' px={2} onClick={() => {}} cursor='default'>
        <LoadingSpinner foreground='scales.yellow60' background='scales.yellow30' />
        <Text display={['none', 'inline']} pl={['0','2']} textAlign='center' color='yellow'>Reconnecting</Text>
      </Button>
    );
  } else {
    return null;
  }
};

export default ReconnectButton;
