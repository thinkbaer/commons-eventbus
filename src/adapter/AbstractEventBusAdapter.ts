import {IEventBusAdapter} from './IEventBusAdapter';
import {IReader} from './IReader';
import {IWriter} from './IWriter';
import {EventEmitter} from 'events';
import {IEventBusConfiguration} from '../bus/IEventBusConfiguration';
import {IPseudoObject} from '../bus/IPseudoObject';


export abstract class AbstractEventBusAdapter implements IEventBusAdapter {
  readonly clazz: Function;
  readonly name: string;
  readonly nodeId: string;
  readonly options: IEventBusConfiguration;
  private emitter: EventEmitter = new EventEmitter();


  protected reader: IReader;

  protected writer: IWriter;


  constructor(nodeId: string, name: string, clazz: Function, options: any) {
    this.options = options;
    this.nodeId = nodeId;
    this.name = name;
    this.clazz = clazz;
    this.emitter.setMaxListeners(1000);
  }


  getEmitter() {
    return this.emitter;
  }

  publish(object: any): Promise<IPseudoObject> {
    return undefined;
  }

  subscribe(fn: Function): void {
  }


  eventID() {
    return [this.nodeId, this.name].join('_');
  }


  async shutdown() {
    await this.close();
  }


  async close() {
    this.getEmitter().removeAllListeners();
    if (this.reader) {
      await this.reader.close();
    }
    if (this.writer) {
      await this.writer.close();
    }
  }

}
