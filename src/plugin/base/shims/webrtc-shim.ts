import { WebRTC } from './definitions';

class WebRTCShim implements WebRTC {
  newRTCPeerConnection = (config: RTCConfiguration): RTCPeerConnection => {
    return new window.RTCPeerConnection(config);
  };

  newRTCSessionDescription = (jsep: RTCSessionDescription): RTCSessionDescription => {
    return new window.RTCSessionDescription(jsep);
  };

  newRTCIceCandidate = (candidate: RTCIceCandidate): RTCIceCandidate => {
    return new window.RTCIceCandidate(candidate);
  };
}

export default WebRTCShim;
