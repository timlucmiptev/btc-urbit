import {
    Col,
    Label, ManagedTextInputField as Input,

    Text
} from '@tlon/indigo-react';
import { Association } from '@urbit/api';
import { Form, Formik } from 'formik';
import React from 'react';
import GlobalApi from '~/logic/api/global';
import { uxToHex } from '~/logic/lib/util';
import { ColorInput } from '~/views/components/ColorInput';
import { FormError } from '~/views/components/FormError';
import { FormGroupChild } from '~/views/components/FormGroup';

interface FormSchema {
  title: string;
  description: string;
  color: string;
}

interface ChannelDetailsProps {
  api: GlobalApi;
  association: Association;
}

export function ChannelDetails(props: ChannelDetailsProps) {
  const { association, api } = props;
  const { metadata } = association;
  const initialValues: FormSchema = {
    title: metadata?.title || '',
    description: metadata?.description || '',
    color: metadata?.color || '0x0'
  };

  const onSubmit = async (values: FormSchema, actions) => {
    const { title, description } = values;
    const color = uxToHex(values.color);
    await api.metadata.update(association, { title, color, description });
    actions.setStatus({ success: null });
  };

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      <Form style={{ display: 'contents' }}>
        <FormGroupChild id="details" />
        <Col mx={4} mb={4} flexShrink={0} gapY={4}>
          <Col mb={3}>
            <Text id="details" fontSize={2} fontWeight="bold">
              Channel Details
            </Text>
            <Label gray mt={2}>
              Set the title, description and colour of the channel
            </Label>
          </Col>
          <Input
            id="title"
            label="Title"
            caption="Change the title of this channel"
          />
          <Input
            id="description"
            label="Change description"
            caption="Change the description of this channel"
          />
          <ColorInput
            id="color"
            label="Color"
            caption="Change the color of this channel"
          />
          <FormError message="Failed to update settings" />
        </Col>
      </Form>
    </Formik>
  );
}
