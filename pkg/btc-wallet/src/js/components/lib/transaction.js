import React, { Component } from 'react';
import {
  Box,
  Icon,
  Row,
  Text,
  Button,
  Col,
  LoadingSpinner,
} from '@tlon/indigo-react';
import _ from 'lodash';

import { Sigil } from './sigil.js'
import TxAction from './tx-action.js'
import TxCounterparty from './tx-counterparty.js'
import { satsToCurrency } from '../../lib/util.js'

export default class Transaction extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const pending = (!this.props.tx.recvd);

    let weSent = _.find(this.props.tx.inputs, (input) => {
      return (input.ship === window.ship);
    });
    let weRecv = this.props.tx.outputs.every((output) => {
      return (output.ship === window.ship)
    });

    let action =
      (weRecv) ? "recv" :
      (weSent) ? "sent" : "recv";

    let counterShip = null;
    let counterAddress = null;
    let value;
    let sign;

    if (action === "sent") {
      let counter = _.find(this.props.tx.outputs, (output) => {
        return (output.ship !== window.ship);
      });
      counterShip = _.get(counter, 'ship', null);
      counterAddress = _.get(counter, 'val.address', null);
      value = _.get(counter, 'val.value', null);
      sign = '-'
    }
    else if (action === "recv") {
      value = _.reduce(this.props.tx.outputs, (sum, output) => {
        if (output.ship === window.ship) {
          return sum + output.val.value;
        } else {
          return sum;
        }
      }, 0);


      if (weSent && weRecv) {
        counterAddress = _.get(_.find(this.props.tx.inputs, (input) => {
          return (input.ship === window.ship);
        }), 'val.address', null);
      } else {
        let counter = _.find(this.props.tx.inputs, (input) => {
          return (input.ship !== window.ship);
        });
        counterShip = _.get(counter, 'ship', null);
        counterAddress = _.get(counter, 'val.address', null);
      }
      sign = '';
    }

    let currencyValue = sign + satsToCurrency(value, this.props.denom, this.props.rates);

    const failure = Boolean(this.props.tx.failure);
    if (failure) action = "fail";

    const txid = this.props.tx.txid.dat.slice(2).replaceAll('.','');


    return (
      <Col
        width='100%'
        backgroundColor="white"
        justifyContent="space-between"
        mb="16px"
      >
        <Row justifyContent="space-between" alignItems="center">
          <TxAction action={action} pending={pending} txid={txid} network={this.props.network}/>
          <Text fontSize="14px" alignItems="center" color="gray">
            {sign}{value} sats
          </Text>
        </Row>
        <Box ml="11px" borderLeft="2px solid black" height="4px">
        </Box>
        <Row justifyContent="space-between" alignItems="center">
          <TxCounterparty address={counterAddress} ship={counterShip}/>
          <Text fontSize="14px">{currencyValue}</Text>
        </Row>
      </Col>
    );
  }
}
