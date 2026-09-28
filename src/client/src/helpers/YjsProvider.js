import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync.js';
import * as awarenessProtocol from 'y-protocols/awareness.js';
import { encoding, decoding } from 'lib0';

/**
 * Custom Yjs Provider for Socket.IO
 * Synchronizes Y.Doc through socket.io connection
 */
export class SocketIOProvider {
  constructor(socket, roomId, ydoc) {
    this.socket = socket;
    this.roomId = roomId;
    this.ydoc = ydoc;
    this.awareness = new awarenessProtocol.Awareness(ydoc);
    this.synced = false;
    this.syncStep2Received = false;
    this.handleUpdate = (update, origin) => {
      if (origin !== this) {
        this.sendUpdate(update);
      }
    };

    this.ydoc.on('update', this.handleUpdate);
    this.setupSocketListeners();
  }

  setupSocketListeners() {
    // Listen for sync messages from server
    this.handleSyncMessage = (data) => this.handleSync(data);
    this.handleReceiveUpdate = ({ update }) => {
      try {
        Y.applyUpdate(this.ydoc, new Uint8Array(update), this);
      } catch (error) {
        console.error('Error applying received update:', error);
      }
    };
    this.handleLoadDocument = () => {};

    this.socket.on('sync', this.handleSyncMessage);

    // Listen for update messages from other users
    this.socket.on('receive-update', this.handleReceiveUpdate);

    // Listen for document loads
    this.socket.on('load-document', this.handleLoadDocument);
  }

  handleSync(data) {
    try {
      const decoder = decoding.createDecoder(new Uint8Array(data));
      const encoder = encoding.createEncoder();
      const messageType = syncProtocol.readSyncMessage(
        decoder,
        encoder,
        this.ydoc,
        this
      );

      if (messageType === syncProtocol.messageYjsSyncStep2) {
        this.syncStep2Received = true;
      }

      const response = encoding.toUint8Array(encoder);
      if (response.length > 1) {
        this.socket.emit('sync', response);
      }

      if (!this.synced && this.syncStep2Received) {
        this.synced = true;
        this.ydoc.emit('synced', [true]);
      }
    } catch (error) {
      console.error('Error handling sync:', error);
    }
  }

  sendUpdate(update) {
    try {
      this.socket.emit('send-update', {
        roomId: this.roomId,
        update: Array.from(update)
      });
    } catch (error) {
      console.error('Error sending update:', error);
    }
  }

  requestSync() {
    const encoder = encoding.createEncoder();
    syncProtocol.writeSyncStep1(encoder, this.ydoc);
    this.socket.emit('sync', encoding.toUint8Array(encoder));
  }

  destroy() {
    this.socket.off('sync', this.handleSyncMessage);
    this.socket.off('receive-update', this.handleReceiveUpdate);
    this.socket.off('load-document', this.handleLoadDocument);
    this.ydoc.off('update', this.handleUpdate);
  }
}
