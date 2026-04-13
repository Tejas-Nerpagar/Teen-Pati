export const setupSockets = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', (room_id) => {
      socket.join(room_id);
      console.log(`Socket ${socket.id} joined room ${room_id}`);
    });

    socket.on('leave_room', (room_id) => {
      socket.leave(room_id);
      console.log(`Socket ${socket.id} left room ${room_id}`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};
