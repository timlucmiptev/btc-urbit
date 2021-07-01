import { Box, Col, Icon, Row, Text } from '@tlon/indigo-react';
import { Association, GraphNotificationContents, GraphNotifIndex, Post } from '@urbit/api';
import { BigInteger } from 'big-integer';
import { patp } from 'urbit-ob';
import _ from 'lodash';
import React, { useCallback } from 'react';
import { Link, useHistory } from 'react-router-dom';
import styled from 'styled-components';
import GlobalApi from '~/logic/api/global';
import { pluralize } from '~/logic/lib/util';
import useGroupState from '~/logic/state/group';
import {
  useAssocForGraph,
  useAssocForGroup
} from '~/logic/state/metadata';
import Author from '~/views/components/Author';
import { GraphContent } from '~/views/landscape/components/Graph/GraphContent';
import { Header } from './header';

const TruncBox = styled(Box)<{ truncate?: number }>`
  -webkit-line-clamp: ${p => p.truncate ?? 'unset'};
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  color: ${p => p.theme.colors.black};
`;

function describeNotification(
  description: string,
  plural: boolean,
  isDm: boolean,
  singleAuthor: boolean
): string {
  switch (description) {
    case 'post':
      return singleAuthor ? 'replied to you' : 'Your post received replies';
    case 'link':
      return `New link${plural ? 's' : ''} in`;
    case 'comment':
      return `New comment${plural ? 's' : ''} on`;
    case 'note':
      return `New Note${plural ? 's' : ''} in`;
    case 'edit-note':
      return `updated ${pluralize('note', plural)} in`;
    case 'mention':
      return singleAuthor ? 'mentioned you in' : 'You were mentioned in';
    case 'message':
      if (isDm) {
        return 'messaged you';
      }
      return `New message${plural ? 's' : ''} in`;
    default:
      return description;
  }
}

function ContentSummary({ icon, name, author, to }) {
  return (
    <Link to={to}>
      <Col
        gapY={1}
        flexDirection={['column', 'row']}
        alignItems={['flex-start', 'center']}
      >
        <Row
          alignItems="center"
          gapX={2}
          p={1}
          width="fit-content"
          borderRadius={2}
          border={1}
          borderColor="lightGray"
        >
          <Icon display="block" icon={icon} />
          <Text verticalAlign="baseline" fontWeight="medium">
            {name}
          </Text>
        </Row>
        <Row ml={[0, 1]} alignItems="center">
          <Text lineHeight={1} fontWeight="medium" mr={1}>
            by
          </Text>
          <Author
            sigilPadding={6}
            size={24}
            dontShowTime
            ship={author}
            showImage
          />
        </Row>
      </Col>
    </Link>
  );
}

export const GraphNodeContent = ({ post, mod, index, hidden, association }) => {
  const { contents } = post;
  const idx = index.slice(1).split('/');
  const url = getNodeUrl(mod, hidden, association?.group, association?.resource, index);
  if (mod === 'graph-validator-link' && idx.length === 1) {
    const [{ text: title }] = contents;
    return (
      <ContentSummary to={url} icon="Links" name={title} author={post.author} />
    );
  }
  if (mod === 'graph-validator-publish' && idx[1] === '1') {
    const [{ text: title }] = contents;
    return (
      <ContentSummary to={url} icon="Note" name={title} author={post.author} />
    );
  }
  return (
    <TruncBox truncate={8}>
      <GraphContent api={{} as any} contents={post.contents} showOurContact />
    </TruncBox>
  );
};

function getNodeUrl(
  mod: string,
  hidden: boolean,
  groupPath: string,
  graph: string,
  index: string
) {
  const graphValidator = 'graph-validator-';
  const rmValidator = mod.slice(graphValidator.length);
  if (hidden && mod === 'graph-validator-chat') {
    groupPath = '/messages';
  } else if (hidden) {
    groupPath = '/home';
  }
  const graphUrl = `/~landscape${groupPath}/resource/${rmValidator}${graph}`;
  const idx = index.slice(1).split('/');
  if (mod === 'graph-validator-publish') {
    const [noteId, kind, commId] = idx;
    const selected = kind === '2' ? `?selected=${commId}` : '';
    return `${graphUrl}/note/${noteId}${selected}`;
  } else if (mod === 'graph-validator-link') {
    const [linkId, commId] = idx;
    return `${graphUrl}/index/${linkId}${commId ? `?selected=${commId}` : ''}`;
  } else if (mod === 'graph-validator-chat') {
    if (idx.length > 0) {
      return `${graphUrl}?msg=${idx[0]}`;
    }
    return graphUrl;
  } else if (mod === 'graph-validator-post') {
    return `/~landscape${groupPath}/feed/thread${index}`;
  } else if (mod === 'graph-validator-dm') {
    return `/~landscape${groupPath}/dm/${patp(idx[0])}`;
  }
  return '';
}

interface PostsByAuthor {
  author: string;
  posts: Post[];
}
const GraphNodes = (props: {
  posts: Post[];
  hideAuthors?: boolean;
  index: string;
  mod: string;
  association: Association;
  hidden: boolean;
}) => {
  const {
    posts,
    mod,
    hidden,
    index,
    hideAuthors = false,
    association
  } = props;

  const postsByConsecAuthor = _.reduce(
    posts,
    (acc: PostsByAuthor[], val: Post, key: number) => {
      const lent = acc.length;
      if (lent > 0 && acc?.[lent - 1]?.author === val.author) {
        const last = acc[lent - 1];
        const rest = acc.slice(0, -1);
        return [...rest, { ...last, posts: [...last.posts, val] }];
      }
      return [...acc, { author: val.author, posts: [val] }];
    },
    []
  );

  return (
    <>
      {_.map(postsByConsecAuthor, ({ posts, author }, idx) => {
        const time = posts[0]?.['time-sent'];
        return (
          <Col key={idx} flexGrow={1} alignItems="flex-start">
            {!hideAuthors && (
              <Author
                size={24}
                sigilPadding={6}
                showImage
                ship={author}
                date={time}
              />
            )}
            <Col gapY={2} py={hideAuthors ? 0 : 2} width="100%">
              {_.map(posts, post => (
                <GraphNodeContent
                  key={post.index}
                  post={post}
                  mod={mod}
                  index={index}
                  association={association}
                  hidden={hidden}
                />
              ))}
            </Col>
          </Col>
        );
      })}
    </>
  );
};

export function GraphNotification(props: {
  index: GraphNotifIndex;
  contents: GraphNotificationContents;
  read: boolean;
  time: number;
  timebox: BigInteger;
  api: GlobalApi;
}) {
  const { contents, index, read, time, api, timebox } = props;
  const history = useHistory();

  const authors = _.uniq(_.map(contents, 'author'));
  const singleAuthor = authors.length === 1;
  const { graph, mark } = index;
  const association = useAssocForGraph(graph);
  const dm = mark === 'graph-validator-dm';
  const desc = describeNotification(
    index.description,
    contents.length !== 1,
    dm,
    singleAuthor
  );
  const groupAssociation = useAssocForGroup(association?.group ?? '');
  const groups = useGroupState(state => state.groups);

  const onClick = useCallback(() => {
    if(dm) {
      history.push(`/~landscape/messages/dm/~${authors[0]}`);
      return;
    }
    const first = contents[0];
    history.push(
      getNodeUrl(
        index.mark,
        groups[association?.group]?.hidden,
        association?.group,
        association?.resource,
        first.index
      )
    );
  }, [api, timebox, index, read, history.push, authors, dm]);

  const authorsInHeader =
    dm ||
    ((index.description === 'mention' || index.description === 'post') &&
      singleAuthor);
  const hideAuthors =
    authorsInHeader ||
    index.description === 'note' ||
    index.description === 'link';
  const channelTitle = dm ? undefined : association?.metadata?.title ?? graph;
  const groupTitle = groupAssociation?.metadata?.title;

  return (
    <>
      <Header
        time={time}
        authors={authorsInHeader ? authors : []}
        channelTitle={channelTitle}
        description={desc}
        groupTitle={groupTitle}
        content
      />
      <Col onClick={onClick} gapY={2} flexGrow={1} width="100%" gridArea="main">
        <GraphNodes
          hideAuthors={hideAuthors}
          posts={contents.slice(0, 4)}
          mod={index.mark}
          index={contents?.[0].index}
          association={association}
          hidden={groups[association?.group]?.hidden}
        />
        {contents.length > 4 && (
          <Text mb={2} gray>
            + {contents.length - 4} more
          </Text>
        )}
      </Col>
    </>
  );
}
