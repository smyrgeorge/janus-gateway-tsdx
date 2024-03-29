import Promise from 'bluebird';
import { MediaDevices } from './definitions';

class MediaDevicesShim implements MediaDevices {
  getUserMedia = (constraints: MediaStreamConstraints): Promise<MediaStream> => {
    return Promise.resolve(navigator.mediaDevices.getUserMedia(constraints));
  };
}

export default MediaDevicesShim;
