export interface INSQSubMessage {
  id: string,
  body: any,
  timestamp: number,
  timestamp_sub: number,
  receivedOn: number,
  lastTouched: number,
  touchCount: number
}
