export const registerSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    socket.on("project:join", (projectId) => {
      socket.join(projectId);
    });

    socket.on("project:leave", (projectId) => {
      socket.leave(projectId);
    });
  });
};

export const emitProjectUpdate = (io, projectId, payload) => {
  io.to(projectId.toString()).emit("project:updated", payload);
};
