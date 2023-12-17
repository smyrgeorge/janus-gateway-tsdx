import Client from '../src/client/client';
import { MediaDevices, WebRTC } from '../src/plugin/base/shims/definitions';
import Connection from '../src/client/connection';

jest.mock('../src/client/connection');

describe('client', () => {
  const fakeMediaDevices = (jest.fn() as unknown) as MediaDevices;
  const fakeWebRtcShim = (jest.fn() as unknown) as WebRTC;
  let client: Client;
  beforeEach(() => {
    client = new Client('fake-address', {}, fakeMediaDevices, fakeWebRtcShim);
  });

  describe('Constructor', () => {
    it('should set keepAlive to true by default', () => {
      client = new Client('fake-address', undefined, fakeMediaDevices, fakeWebRtcShim);
      expect(client['options'].keepalive).toBe(true);
    });
  });

  describe('createConnection', () => {
    it('create a connection with the respective paramters', async () => {
      await client.createConnection('fake-id');
      expect(Connection).toHaveBeenCalledWith('fake-id', 'fake-address', {}, fakeMediaDevices, fakeWebRtcShim);
    });

    it('should open the connection', async () => {
      const openSpy = jest.spyOn(Connection.prototype, 'open');
      await client.createConnection('fake-id');
      expect(openSpy).toHaveBeenCalled();
    });
  });
});
