janus-gateway-tsdx [![CI](https://github.com/smyrgeorge/janus-gateway-ts/actions/workflows/main.yml/badge.svg)](https://github.com/smyrgeorge/janus-gateway-ts/actions/workflows/main.yml)
================

## About

Modern typescript client for [janus gateway](https://janus.conf.meetecho.com/). Based on websockets.
The original client can be found here https://janus.conf.meetecho.com/docs/rest.html.
This library is a rewrite of [janus-gateway-js](https://github.com/sjkummer/janus-gateway-js) in typescript.
Also, this library is possible to be used with **react-native**.
In this case we need to create some shim classes and pass them to Client constructor, see [Client](src/client/client.ts). 

## TODO
- [ ] Remove bluebird Promise library
- [ ] Make use of async/await
- [ ] Write some tests
- [ ] Write some proper documentation
- [x] Documentation for React Native

## Example of usage
See the [VideoRoom](src/wrapper/video-room/video-room.ts) and [VideoRoomBuilder](src/wrapper/video-room/video-room-builder.ts)

## Install

`yarn add janus-gateway-tsdx`

## Build

Just run `yarn build`


## Client API

* [Client](src/client/client.ts)
* [Connection](src/client/connection.ts)
* [Session](src/client/session.ts)
* [Plugin](src/client/plugin.ts)
* [WebsocketConnection](src/client/websocket.ts)


## Plugins

Currently, the project has four implemented plugins: audio-bridge, video-streaming, rtp-broadcast and audio-room and video-room.
If you require a plugin that is not implemented then you need to write it on your own.

* [MediaPlugin](src/plugin/base/media-plugin.ts)
* [AudioBridgePlugin](src/plugin/audio-bridge-plugin.ts)
* [AudioBoomPlugin](src/plugin/audio-room-plugin.ts)
* [StreamingPlugin](src/plugin/streaming-plugin.ts)
* [RtpBroadcastPlugin](src/plugin/rtp-broadcast-plugin.ts)
* [VideoRoomPlugin](src/plugin/video-room-plugin.ts)


### Shims for React native

Media devices shim:
```typescript
import {MediaDevices} from "janus-gateway-tsdx/src/plugin/base/shims/definitions";
import {mediaDevices} from 'react-native-webrtc';

class MediaDevicesReactNativeShim implements MediaDevices {
  getUserMedia = (constraints) => {
    return Promise.resolve(mediaDevices.getUserMedia(constraints));
  };
}

export default MediaDevicesReactNativeShim
```

WebRTC shim:
```typescript
import {RTCIceCandidate, RTCPeerConnection, RTCSessionDescription} from 'react-native-webrtc';
import {WebRTC} from "janus-gateway-tsdx/dist/plugin/base/shims/definitions";

class WebRTCReactNativeShim implements WebRTC {
  newRTCPeerConnection = (config, constraints): RTCPeerConnection => {
    return new RTCPeerConnection(config, constraints);
  };

  newRTCSessionDescription = (jsep: RTCSessionDescription): RTCSessionDescription => {
    return new RTCSessionDescription(jsep);
  };

  newRTCIceCandidate = (candidate: RTCIceCandidate): RTCIceCandidate => {
    return new RTCIceCandidate(candidate);
  };
}

export default WebRTCReactNativeShim
```

Then use it:
```typescript
import Client from '../../client/client';
let client = new Client(this.address, this.clientOptions, new MediaDevicesReactNativeShim(), new WebRTCReactNativeShim);
```

### How to write a Plugin

For simplicity lets write an [EchoTest plugin](https://janus.conf.meetecho.com/docs/janus__echotest_8c.html) that does
only `audio`.

```typescript
import Promise from 'bluebird';
import Plugin from '../client/plugin';
import MediaPlugin from './base/media-plugin';

class EchoTest extends MediaPlugin {
  static NAME = 'janus.plugin.echotest';

  audio(state: boolean): Promise<RTCSessionDescription> {
    return Promise.try(() => this.getUserMedia({ audio: true, video: false }))
      .then(stream => {
        this.createPeerConnection();
        stream.getTracks().forEach(track => this.addTrack(track, stream));
      })
      .then(() => this.createOffer({}))
      .then(jsep => {
        let message = { body: { audio: state }, jsep: jsep };
        return this.sendWithTransaction(message);
      })
      .then(response => {
        let jsep = response.get('jsep');
        if (jsep) {
          this.setRemoteSDP(jsep);
          return jsep;
        }
      });
  }
}

Plugin.register(EchoTest.NAME, EchoTest);

export default EchoTest;

```

Then we can use it

```typescript
let janus = new Janus.Client(config.url, config);
janus.createConnection('client')
  .then(connection => connection.createSession())
  .then(session => session.attachPlugin(EchoTest.NAME))
  .then(echoTestPlugin => echoTestPlugin.audio(true))
```
