import Promise from 'bluebird';

export interface MediaDevices {
  getUserMedia: (constants: MediaStreamConstraints) => Promise<MediaStream>;
}

class MediaDevicesShim implements MediaDevices {
  getUserMedia = (constraints: MediaStreamConstraints): Promise<MediaStream> => {
    return Promise.resolve(navigator.mediaDevices.getUserMedia(constraints));
  };
}

export default MediaDevicesShim;
