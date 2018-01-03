import * as nsqjs from 'nsqjs';
import {INSQPubMessage} from './INSQPubMessage';
import {EventEmitter} from 'events';
import {ConnectionConfigOptions} from 'nsqjs';


export class NsqdWriter extends EventEmitter {

  writer: nsqjs.Writer;

  options: ConnectionConfigOptions;

  host: string;

  port: number;

  constructor(host: string, port: number, options?: ConnectionConfigOptions) {
    super();
    this.host = host;
    this.port = port;
    this.options = options;
  }


  open(): Promise<nsqjs.Writer> {
    return new Promise((resolve, reject) => {
      try {
        this.writer = new nsqjs.Writer(this.host, this.port, this.options);
        let binding = (err: Error) => {
          reject(err);
        };
        this.writer.once(nsqjs.Writer.ERROR, binding);
        this.writer.once(nsqjs.Writer.READY, () => {
          this.writer.removeListener(nsqjs.Writer.ERROR, binding);
          resolve(this.writer);
        });
        this.writer.connect();
      } catch (err) {
        reject(err);
      }
    });
  }


  close(): Promise<{}> {
    let self = this;
    return new Promise((resolve, reject) => {
      self.writer.once(nsqjs.Writer.CLOSED, (err: Error) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }

      });
      this.writer.close();
    });
  }

  publish(message: INSQPubMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      this.writer.publish(message.topic, message.message, (err: Error) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

}
