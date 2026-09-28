import { getDocThroughSocket } from "./doc.controller.js";
import DocumentModel from "../models/documents.model.js";
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync.js';
import * as awarenessProtocol from 'y-protocols/awareness.js';
import { encoding, decoding } from 'lib0';

const rooms = new Map();

const getRoom = (roomId) => {
  let room = rooms.get(roomId);

  if (!room) {
    const doc = new Y.Doc();
    room = {
      users: new Map(),
      doc,
      awareness: new awarenessProtocol.Awareness(doc),
      saveTimer: null,
      initPromise: null,
    };
    rooms.set(roomId, room);
  }

  return room;
};

const persistRoom = async (roomId) => {
  const room = rooms.get(roomId);
  if (!room) return;

  const yjsState = Y.encodeStateAsUpdate(room.doc);
  const yjsStateVector = Y.encodeStateVector(room.doc);

  await DocumentModel.findByIdAndUpdate(roomId, {
    yjsState: Buffer.from(yjsState),
    yjsStateVector: Buffer.from(yjsStateVector),
  });
};

const scheduleRoomSave = (roomId) => {
  const room = rooms.get(roomId);
  if (!room) return;

  clearTimeout(room.saveTimer);
  room.saveTimer = setTimeout(async () => {
    try {
      await persistRoom(roomId);
    } catch (error) {
      console.error('Error persisting room:', error);
    }
  }, 1000);
};

const cleanupRoom = async (roomId) => {
  const room = rooms.get(roomId);
  if (!room || room.users.size > 0) return;

  clearTimeout(room.saveTimer);
  try {
    await persistRoom(roomId);
  } catch (error) {
    console.error('Error persisting room during cleanup:', error);
  }

  room.awareness.destroy();
  room.doc.destroy();
  rooms.delete(roomId);
};

const persistAllRooms = async () => {
  await Promise.all([...rooms.keys()].map((roomId) => persistRoom(roomId)));
};

export const socketCtrl = (io) => {
  const shutdown = async () => {
    try {
      await persistAllRooms();
    } catch (error) {
      console.error('Error persisting rooms during shutdown:', error);
    } finally {
      io.close(() => process.exit(0));
    }
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  io.on('connection', (socket) => {
    const userId = socket.id;
    handleConnection(socket, io, userId);
  });
};

const handleConnection = async (socket, io, userId) => {
  socket.on('joinRoom', async (data, callback) => {
    try {
      const { roomId, username } = data;
      socket.join(roomId);

      let room = rooms.get(roomId);
      if (!room) {
        room = getRoom(roomId);
        room.initPromise = getDocThroughSocket(roomId)
          .then((doc) => {
            if (doc?.yjsState) {
              Y.applyUpdate(room.doc, doc.yjsState);
            }
          })
          .catch((error) => {
            console.error('Error loading document state:', error);
          });
      }

      await room.initPromise;

      room.users.set(userId, { username, userId });

      io.to(roomId).emit('someoneJoined', {
        username,
        roomUsers: [...room.users.values()],
      });

      callback(null);
    } catch (error) {
      console.error('Error in joinRoom:', error);
      callback('Error joining room');
    }
  });



  socket.on('leaveRoom', async (data, callback) => {
    try {
      const { roomId, username } = data;
      socket.leave(roomId);

      const room = rooms.get(roomId);
      if (room) {
        room.users.delete(userId);

        io.to(roomId).emit('someoneLeft', {
          username,
          roomUsers: [...room.users.values()],
        });

        // Clean up if no more users in room
        await cleanupRoom(roomId);
      }

      callback(null);
    } catch (error) {
      console.error('Error in leaveRoom:', error);
      callback('Error leaving room');
    }
  });

  // Handle Yjs sync messages
  socket.on('sync', (data, callback) => {
    try {
      const roomId = Array.from(socket.rooms).find(room => room !== socket.id);
      const room = roomId && rooms.get(roomId);
      if (!roomId || !room) return;

      const decoder = decoding.createDecoder(new Uint8Array(data));
      const encoder = encoding.createEncoder();
      const messageType = syncProtocol.readSyncMessage(
        decoder,
        encoder,
        room.doc,
        socket
      );

      if (messageType === syncProtocol.messageYjsUpdate) {
        scheduleRoomSave(roomId);
      }

      const syncMessage = encoding.toUint8Array(encoder);
      if (syncMessage.length > 0) {
        socket.emit('sync', syncMessage);
      }

      callback?.(null);
    } catch (error) {
      console.error('Error in sync:', error);
      callback('Error syncing');
    }
  });

  // Handle update messages (simplified version)
  socket.on('send-update', (data, callback) => {
    try {
      const { roomId, update } = data;
      const room = rooms.get(roomId);
      if (!room) {
        callback?.('Room not found');
        return;
      }

      // Apply update to local Y.Doc
      Y.applyUpdate(room.doc, new Uint8Array(update));
      scheduleRoomSave(roomId);

      // Broadcast to other users
      socket.to(roomId).emit('receive-update', { update });

      callback?.(null);
    } catch (error) {
      console.error('Error in send-update:', error);
      callback?.('Error sending update');
    }
  });

  socket.on('send-cursor', (data) => {
    socket.to(data.roomId).emit('receive-cursor', {
      username: data.username,
      range: data.range
    });
  });


  socket.on('send-changes', (data, callback) => {
    try {
      io.to(data.roomId).emit('receive-changes', { delta: data.delta, username: data.username })
    } catch (error) {
      console.error('Error in send-changes:', error);
      callback('Error sending changes');
    }
  });


  socket.on('get-doc', async (data) => {
    try {

      const curr_doc = await getDocThroughSocket(data.docId);
      let content = curr_doc.content;

      if (!content) {
        content = '';
      }

      socket.emit('load-document', {
        content,
        hasYjsState: Boolean(curr_doc.yjsState),
      });
    } catch (error) {
      console.error('Error in get-doc:', error);
    }
  });

  socket.on('save-doc', async (data, callback) => {
    try {
      if (data?.data === undefined || !data?.docId) {
        callback?.('Document data is required');
        return;
      }

      const roomId = data.docId.toString();
      const room = rooms.get(roomId);
      if (room) {
        // Save Yjs state to database
        const yjsState = Y.encodeStateAsUpdate(room.doc);
        const yjsStateVector = Y.encodeStateVector(room.doc);

        await DocumentModel.findByIdAndUpdate(roomId, {
          content: data.data,
          yjsState: Buffer.from(yjsState),
          yjsStateVector: Buffer.from(yjsStateVector)
        });
      } else {
        await DocumentModel.findByIdAndUpdate(roomId, { content: data.data });
      }

      callback(null);
    } catch (error) {
      console.error('Error in save-doc:', error);
      callback('Error saving doc');
    }
  });

  socket.on('disconnect', () => {
    try {
      for (const [roomId, room] of rooms) {
        const user = room.users.get(userId);
        if (!user) continue;

        room.users.delete(userId);
        io.to(roomId).emit('someoneLeft', {
          username: user.username,
          roomUsers: [...room.users.values()],
        });

        cleanupRoom(roomId).catch((error) => {
          console.error('Error cleaning up disconnected room:', error);
        });
      }
    } catch (error) {
      console.error('Error in disconnect:', error);
    }
  });

};
