import webrtc from 'webrtcsupport';

export interface WebRTC {
  newRTCPeerConnection: (config, constraints) => RTCPeerConnection;
  newRTCSessionDescription: (jsep: RTCSessionDescription) => RTCSessionDescription;
  newRTCIceCandidate: (candidate: RTCIceCandidate) => RTCIceCandidate;
}

class WebRTCShim implements WebRTC {
  newRTCPeerConnection = (config, constraints): RTCPeerConnection => {
    return new webrtc.PeerConnection(config, constraints);
  };

  newRTCSessionDescription = (jsep: RTCSessionDescription): RTCSessionDescription => {
    return new webrtc.SessionDescription(jsep);
  };

  newRTCIceCandidate = (candidate: RTCIceCandidate): RTCIceCandidate => {
    return new webrtc.IceCandidate(candidate);
  };
}

export default WebRTCShim;
