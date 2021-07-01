import { Box, Row, SegmentedProgressBar, Text } from '@tlon/indigo-react';
import {
    joinError, joinProgress,

    JoinRequest
} from '@urbit/api';
import React, { useCallback } from 'react';
import GlobalApi from '~/logic/api/global';
import { StatelessAsyncAction } from '~/views/components/StatelessAsyncAction';

interface JoiningStatusProps {
  status: JoinRequest;
  api: GlobalApi;
  resource: string;
}

const description: string[] = [
  'Attempting to contact host',
  'Retrieving data',
  'Finished join',
  'Unable to join, you do not have the correct permissions',
  'Internal error, please file an issue'
];

export function JoiningStatus(props: JoiningStatusProps) {
  const { status, resource, api } = props;

  const current = joinProgress.indexOf(status.progress);
  const desc = description?.[current] || '';
  const isError = joinError.indexOf(status.progress as any) !== -1;
  const onHide = useCallback(() => api.groups.hide(resource)
    , [resource, api]);
  return (
    <Row
      display={['flex-column', 'flex']}
      alignItems="center"
      px={4}
      gapX={4}
    >
      <Box flexGrow={1} maxWidth="400px">
        <SegmentedProgressBar current={current + 1} segments={3} />
      </Box>
      <Text display="block" flexShrink={0} color={isError ? 'red' : 'gray'}>
        {desc}
      </Text>
      <StatelessAsyncAction backgroundColor="white" onClick={onHide} flexShrink={1}>Hide</StatelessAsyncAction>
    </Row>
  );
}
