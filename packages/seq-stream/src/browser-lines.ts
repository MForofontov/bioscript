/** Decode a browser file incrementally and release its source on early return. */
export async function* browserLines(file: File | Blob): AsyncGenerator<string> {
  let stream = file.stream();
  if (typeof File !== 'undefined' && file instanceof File && file.name.endsWith('.gz')) {
    stream = stream.pipeThrough(new DecompressionStream('gzip'));
  }
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let completed = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      let offset = 0;
      let end: number;
      while ((end = buffer.indexOf('\n', offset)) >= 0) {
        yield buffer.slice(offset, end).replace(/\r$/, '');
        offset = end + 1;
      }
      buffer = buffer.slice(offset);
      if (done) {
        completed = true;
        if (buffer) yield buffer.replace(/\r$/, '');
        break;
      }
    }
  } finally {
    try {
      if (!completed) await reader.cancel();
    } finally {
      reader.releaseLock();
    }
  }
}
