import * as _ from 'lodash';
import {EventEmitter} from 'events';

import {NsqdObject} from './NsqdObject';

import {IPseudoObject} from '../../';
import {INsqSubMessage} from './INsqSubMessage';
import {INsqPubMessage} from './INsqPubMessage';
import {INsqdReader} from './INsqdReader';
import {INsqdWriter} from './INsqdWriter';
import {AbstractEventBusAdapter} from '../AbstractEventBusAdapter';


export class NsqdEventBusAdapter extends AbstractEventBusAdapter {

  static ADAPTER_NAME = 'nsq';


  private static NsqdReader: Function;

  private static NsqdWriter: Function;


  constructor(nodeId: string, name: string, clazz: Function, options: any) {
    super(nodeId, name, clazz, options);

    this.loadDependencies();
  }


  loadDependencies() {
    try {
      require('nsqjs');
      NsqdEventBusAdapter.NsqdReader = require('./NsqdReader').NsqdReader;
      NsqdEventBusAdapter.NsqdWriter = require('./NsqdWriter').NsqdWriter;
    } catch (err) {
      let msg = 'EventBus adapter nsqjs can\'t be loaded, because modul nsqjs is not installed. :(';
      console.error(msg);
      throw new Error(msg);
    }
  }


  async getSubscriber(): Promise<INsqdReader> {
    if (this.reader) return this.reader;
    this.reader = Reflect.construct(NsqdEventBusAdapter.NsqdReader,
      [this.name, this.nodeId, this.options.extra.reader]);
    try {
      this.reader.on('message', this.onMessage.bind(this));
      await this.reader.open();
    } catch (err) {
      throw err;
    }
    return this.reader;
  }


  async getPublisher(): Promise<INsqdWriter> {
    if (this.writer) return this.writer;
    this.writer = Reflect.construct(NsqdEventBusAdapter.NsqdWriter,
      [this.options.extra.writer.host, this.options.extra.writer.port]);
    try {
      await this.writer.open();
    } catch (err) {
      throw err;
    }
    return this.writer;
  }


  onMessage(message: INsqSubMessage) {
    let data = message.body;
    if (_.has(data, 'status')) {
      if (data.status === 'work') {
        this.getEmitter().emit(this.eventID(), data.uuid, data);
      } else if (data.status === 'done') {
        this.getEmitter().emit([this.eventID(), data.uuid, 'done'].join('_'), data.error, data.result);
      }
    } else if (_.has(data, 'source')) {
    }
  }


  async publish(object: any): Promise<IPseudoObject> {
    let obj = new NsqdObject(this, this.eventID(), object);
    await obj.fire();
    return obj;
  }


  async subscribe(fn: Function) {
    await this.getSubscriber();
    this.getEmitter().on(this.eventID(), async (uuid: string, data: any) => {
      let res = null;
      let err = null;
      try {
        res = await fn(data.object);
      } catch (err2) {
        err = err2;
      }
      let writer = await this.getPublisher();
      let _msp = {
        source: this.nodeId,
        dest: data.source,
        status: 'done',
        uuid: uuid,
        event: data.event,
        result: res,
        error: err
      };

      let msg: INsqPubMessage = {
        topic: this.name,
        message: JSON.stringify(_msp)
      };
      await writer.publish(msg);
    });
  }

}

