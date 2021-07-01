import { animated, useSpring } from '@react-spring/web';
import { Box, Row } from '@tlon/indigo-react';
import React, { ReactNode, useState } from 'react';
import { useDrag } from 'react-use-gesture';
import styled from 'styled-components';
import { PropFunc } from '~/types';

const DEFAULT_THRESHOLD = 10;
const AnimBox = styled(animated(Box))`
  touch-action: pan-y;
`;
const AnimRow = styled(animated(Row))`
  touch-action: pan-y;
`;
const NoScrollBox = styled(Box)`
  touch-action: pan-y;
`;

export function SwipeMenu(
  props: {
    children: ReactNode;
    disabled?: boolean;
    menu: ReactNode;
    menuWidth: number;
    threshold?: number;
  } & PropFunc<typeof Box>
) {
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);

  const {
    children,
    disabled = false,
    menu,
    menuWidth,
    threshold = DEFAULT_THRESHOLD,
    ...rest
  } = props;
  const [{ x, opacity }, springApi] = useSpring(() => ({
    x: 0,
    opacity: 0,
    config: {
      tension: 240,
      friction: 30
    }
  }));
  const activationDistance = threshold - menuWidth;

  const sliderBind = useDrag(
    ({ active, movement: [x], tap }) => {
      if (dragging !== active) {
        setDragging(active);
      }
      if (active && x < activationDistance) {
        setOpen(true);
      } else if (active && x > -1 * threshold) {
        setOpen(false);
      }
      return springApi.start({
        x: active ? Math.min(0, x) : open ? -1 * menuWidth : 0,
        opacity: open
          ? 1
          : active
          ? Math.abs(Math.min(1, Math.min(0, x) / activationDistance))
          : 0
      });
    },
    {
      enabled: !disabled
    }
  );

  return (
    <NoScrollBox {...rest} position="relative">
      <AnimBox {...sliderBind()}>
        <AnimBox style={{ x }}>{children}</AnimBox>
      </AnimBox>
      <AnimRow
        top="0px"
        position="absolute"
        zIndex={1}
        height="100%"
        right="0px"
        style={{
          translateX: x.to(x => x + menuWidth),
          opacity
        }}
      >
        {menu}
      </AnimRow>
    </NoScrollBox>
  );
}
