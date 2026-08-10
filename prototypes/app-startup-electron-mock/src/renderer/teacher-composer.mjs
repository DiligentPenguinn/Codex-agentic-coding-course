export function resizeTeacherComposer(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  textarea.style.overflowY = textarea.scrollHeight > 120 ? "auto" : "hidden";
}

export function shouldSubmitTeacherComposer(event) {
  return event.key === "Enter" && !event.shiftKey && !event.isComposing;
}
