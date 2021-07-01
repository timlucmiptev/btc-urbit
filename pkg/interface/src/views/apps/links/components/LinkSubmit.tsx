import { BaseInput, Box, Button, LoadingSpinner, Text } from '@tlon/indigo-react';
import { hasProvider } from 'oembed-parser';
import React, { useCallback, useState, DragEvent, useEffect } from 'react';
import GlobalApi from '~/logic/api/global';
import { createPost } from '~/logic/api/graph';
import { parsePermalink, permalinkToReference } from '~/logic/lib/permalinks';
import { useFileDrag } from '~/logic/lib/useDrag';
import useStorage from '~/logic/lib/useStorage';
import SubmitDragger from '~/views/components/SubmitDragger';

interface LinkSubmitProps {
  api: GlobalApi;
  name: string;
  ship: string;
  parentIndex?: any;
}

const LinkSubmit = (props: LinkSubmitProps) => {
  const { canUpload, uploadDefault, uploading, promptUpload } =
    useStorage();

  const [submitFocused, setSubmitFocused] = useState(false);
  const [urlFocused, setUrlFocused] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [disabled, setDisabled] = useState(false);
  const [linkValid, setLinkValid] = useState(false);

  const validateLink = (link) => {
    const URLparser = new RegExp(
      /((?:([\w\d\.-]+)\:\/\/?){1}(?:(www)\.?){0,1}(((?:[\w\d-]+\.)*)([\w\d-]+\.[\w\d]+))){1}(?:\:(\d+)){0,1}((\/(?:(?:[^\/\s\?]+\/)*))(?:([^\?\/\s#]+?(?:.[^\?\s]+){0,1}){0,1}(?:\?([^\s#]+)){0,1})){0,1}(?:#([^#\s]+)){0,1}/
    );

    let linkValid = URLparser.test(link);

    if (!linkValid) {
      linkValid = URLparser.test(`http://${link}`);
      if (linkValid) {
        link = `http://${link}`;
        setLinkValue(link);
      }
    }
    if(link.startsWith('web+urbitgraph://')) {
      const permalink = parsePermalink(link);
      if(!permalink) {
        setLinkValid(false);
        return;
      }
    }

    if (linkValid) {
      if (hasProvider(linkValue)) {
        fetch(`https://noembed.com/embed?url=${linkValue}`)
          .then(response => response.json())
          .then((result) => {
            if (result.title && !linkTitle) {
              setLinkTitle(result.title);
            }
          }).catch((error) => { /* noop*/ });
      } else if (!linkTitle) {
        setLinkTitle(decodeURIComponent(link
          .split('/')
          .pop()
          .split('.')
          .slice(0, -1)
          .join('.')
          .replace('_', ' ')
          .replace(/\d{4}\.\d{1,2}\.\d{2}\.\.\d{2}\.\d{2}\.\d{2}-/, '')
        ));
      }
    }
    return link;
  };

  useEffect(() => {
    setLinkValid(validateLink(linkValue));
  }, [linkValue]);

  const doPost = () => {
    const url = linkValue;
    const text = linkTitle ? linkTitle : linkValue;
    const contents = url.startsWith('web+urbitgraph:/')
      ?  [{ text }, permalinkToReference(parsePermalink(url)!)]
      :  [{ text }, { url }];

    setDisabled(true);
    const parentIndex = props.parentIndex || '';
    const post = createPost(contents, parentIndex);

    props.api.graph.addPost(
      `~${props.ship}`,
      props.name,
      post
    ).then(() => {
      setDisabled(false);
      setLinkValue('');
      setLinkTitle('');
      setLinkValid(false);
    });
  };

  const onFileDrag = useCallback(
    (files: FileList | File[], e: DragEvent): void => {
      if (!canUpload) {
        return;
      }
      uploadDefault(files[0]).then(setLinkValue);
    },
    [uploadDefault, canUpload]
  );

  const { bind, dragging } = useFileDrag(onFileDrag);

  const onPaste = useCallback(
    (event: ClipboardEvent) => {
      if (!event.clipboardData || !event.clipboardData.files.length) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      uploadDefault(event.clipboardData.files[0]).then(setLinkValue);
    }, [setLinkValue, uploadDefault]
  );

  const onKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      doPost();
    }
  };

  const placeholder = <Text
    gray
    position="absolute"
    px={2}
    pt={2}
    style={{ pointerEvents: 'none' }}
                      >{canUpload
    ? <>
      Drop or{' '}
      <Text
        cursor='pointer'
        color='blue'
        style={{ pointerEvents: 'all' }}
        onClick={() => promptUpload().then(setLinkValue)}
      >upload</Text>
      {' '}a file, or paste a link here
      </>
    : 'Paste a link here'
    }</Text>;

  return (
    <>
    {/* @ts-ignore archaic event type mismatch */}
      <Box
        flexShrink={0}
        position='relative'
        border='1px solid'
        borderColor={submitFocused ? 'black' : 'lightGray'}
        width='100%'
        borderRadius={2}
        {...bind}
      >
        {uploading && <Box
          display="flex"
          width="100%"
          height="100%"
          position="absolute"
          left={0}
          right={0}
          bg="white"
          zIndex={9}
          alignItems="center"
          justifyContent="center"
                      >
          <LoadingSpinner />
        </Box>}
        {dragging && <SubmitDragger />}
        <Box position='relative'>
          {!(linkValue || urlFocused || disabled) && placeholder}
          <BaseInput
            type="url"
            pl={2}
            width="100%"
            py={2}
            color="black"
            backgroundColor="transparent"
            onChange={e => setLinkValue(e.target.value)}
            onBlur={() => [setUrlFocused(false), setSubmitFocused(false)]}
            onFocus={() => [setUrlFocused(true), setSubmitFocused(true)]}
            spellCheck="false"
            // @ts-ignore archaic event type mismatch error
            onPaste={onPaste}
            onKeyPress={onKeyPress}
            value={linkValue}
          />
        </Box>
        <BaseInput
          type="text"
          pl={2}
          backgroundColor="transparent"
          width="100%"
          color="black"
          fontSize={1}
          style={{
            resize: 'none',
            height: 40
          }}
          placeholder="Provide a title"
          onChange={e => setLinkTitle(e.target.value)}
          onBlur={() => setSubmitFocused(false)}
          onFocus={() => setSubmitFocused(true)}
          spellCheck="false"
          onKeyPress={onKeyPress}
          value={linkTitle}
        />
      </Box>
      <Box mt={2} mb={4}>
        <Button
          primary
          flexShrink={0}
          disabled={!linkValid || disabled}
          onClick={doPost}
        >Post link</Button>
      </Box>
    </>
  );
};

export default LinkSubmit;
