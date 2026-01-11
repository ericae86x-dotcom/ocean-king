// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
  // 浩哥修改：挂载到 window 对象，方便外部调用 undo
  window.gameManager = new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);
});
