export interface MediaDevices {
  getUserMedia: (constants: MediaStreamConstraints) => Promise<MediaStream>;
}

export interface WebRTC {
  newRTCPeerConnection: (config: RTCConfiguration) => RTCPeerConnection;
  newRTCSessionDescription: (jsep: RTCSessionDescription) => RTCSessionDescription;
  newRTCIceCandidate: (candidate: RTCIceCandidate) => RTCIceCandidate;
}
