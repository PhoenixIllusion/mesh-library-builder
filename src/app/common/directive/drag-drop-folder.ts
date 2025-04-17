import { Directive } from "vue";

// Run feature detection.
const supportsFileSystemAccessAPI =
  'getAsFileSystemHandle' in DataTransferItem.prototype;

type OnFilesystemDirectory = (dir: FileSystemDirectoryHandle) => void;
type DragEventType = 'dragover' | 'dragenter' | 'dragleave' | 'drop';
const DragEventTypes: DragEventType[] = ['dragover', 'dragenter', 'dragleave', 'drop'];
const handler = {
  dragover: new WeakMap<Element, (event: DragEvent) => Promise<void> | void>(),
  dragenter: new WeakMap<Element, (event: DragEvent) => Promise<void> | void>(),
  dragleave: new WeakMap<Element, (event: DragEvent) => Promise<void> | void>(),
  drop: new WeakMap<Element, (event: DragEvent) => Promise<void> | void>()
}

function regHandler(elem: HTMLElement, evt: DragEventType, cb: (event: DragEvent) => Promise<void> | void) {
  elem.addEventListener(evt, cb);
  handler[evt].set(elem, cb);
}
function unregHandler(elem: HTMLElement) {
  DragEventTypes.forEach(evt => {
    const cb = handler[evt].get(elem);
    if (cb) {
      elem.removeEventListener(evt, cb);
    }
  })
}

// This is the drag and drop zone.
const DragDropDirective: Directive<HTMLElement, OnFilesystemDirectory> = {

  mounted(elem: HTMLElement, bindings) {
    const cb = bindings.value;

    // Prevent navigation.
    regHandler(elem, 'dragover', (e) => {
      e.preventDefault();
    });

    // Visually highlight the drop zone.
    regHandler(elem, 'dragenter', (_) => {
      elem.classList.add('drop-target');
    });

    // Visually unhighlight the drop zone.
    regHandler(elem, 'dragleave', (_) => {
      elem.classList.remove('drop-target');
    });

    // This is where the drop is handled.
    regHandler(elem, 'drop', async (e) => {
      // Prevent navigation.
      e.preventDefault();
      if (!supportsFileSystemAccessAPI || !e.dataTransfer) {
        // Cannot handle directories.
        return;
      }
      // Unhighlight the drop zone.
      elem.classList.remove('drop-target');

      // Prepare an array of promises…
      const fileHandlesPromises = [...e.dataTransfer.items]
        // …by including only files (where file misleadingly means actual file _or_
        // directory)…
        .filter((item) => item.kind === 'file')
        // …and, depending on previous feature detection…
        .map((item) =>
          (item as any).getAsFileSystemHandle() as FileSystemHandle
          // …or a classic `FileSystemFileEntry`.
        );
      // Loop over the array of promises.
      for await (const handle of fileHandlesPromises) {
        // This is where we can actually exclusively act on the directories.
        if (handle instanceof FileSystemHandle && handle.kind === 'directory') {
          cb(handle as any as FileSystemDirectoryHandle);
        }
      }
    });
  },
  unmounted(elem) {
    unregHandler(elem);
  }

}

export default DragDropDirective;